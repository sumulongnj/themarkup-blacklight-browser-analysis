const express = require('express');
const { devices } = require('playwright');
const { collectChromium, collectFirefox, collectWebkit } = require('./src'); // Update with your path to the collector script
const path = require('path');
const fs = require('fs').promises;
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'Blacklight_Tool',
});

connection.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public', { extensions: ['html', 'js'] }));

function processResults(result) {
    const adTrackers = result.reports?.third_party_trackers?.length || 0;
    const thirdPartyCookies = result.reports?.cookies?.length || 0;
  
    const canvasFingerprinting = !(
        Object.keys(result.reports.canvas_fingerprinters).length ||
        Object.keys(result.reports.canvas_font_fingerprinters).length
    );
  
    const sessionRecording = Object.keys(result.reports.session_recorders).length > 0;
    const keyLogging = Object.keys(result.reports.key_logging).length > 0;
    const fbPixel = result.reports.fb_pixel_events.length > 0;
  
    const googleAnalytics = Array.isArray(result.hosts?.requests) && result.hosts?.requests.some(request =>
        request.startsWith('stats.g.doubleclick') && request.includes('UA-')
        );      
  
    const executionTime = new Date(result.end_time).getTime() - new Date(result.start_time).getTime();
  
    return {
        adTrackers,
        thirdPartyCookies,
        canvasFingerprinting,
        sessionRecording,
        keyLogging,
        fbPixel,
        googleAnalytics,
        executionTime,
    };
}

function saveProcessedResultsToMySQL(processedData, website, browser) {
    const { adTrackers, thirdPartyCookies, canvasFingerprinting, sessionRecording, keyLogging, fbPixel, googleAnalytics, executionTime } = processedData;
    
    const insertQuery = `INSERT INTO WebsiteData (Website, Browser, adTrackers, thirdPartyCookies, canvasFingerprinting, sessionRecording, keyLogging, fbPixel, googleAnalytics, executionTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [website, browser, adTrackers, thirdPartyCookies, canvasFingerprinting, sessionRecording, keyLogging, fbPixel, googleAnalytics, executionTime];
    
    connection.query(insertQuery, values, (insertError) => {
        if (insertError) {
            console.error('Error saving processed data:', insertError);
        } else {
            console.log(`Inserted data for ${website} (${browser}) into the database.`);
        }
        connection.end();
    });
}

app.post('/scan', async (req, res) => {
    const { url } = req.body;
  
    const config = {
        numPages: 1,
        headless: true,
        outDir: path.join(__dirname, 'demo-dir'),
    };
  
    console.log(`Beginning scan of ${url}`);
  
    try {
        const existingWebsiteQuery = 'SELECT * FROM WebsiteData WHERE Website = ?';
        connection.query(existingWebsiteQuery, [`http://${url}`], async (error, results) => {
            if (error) {
                console.error('Error checking for existing data:', error);
                res.status(500).json({ error: 'Error checking for existing data' });
            } else {
                if (results.length > 0) {
                    const chromiumQuery = 'SELECT adTrackers, thirdPartyCookies, canvasFingerprinting, sessionRecording, keyLogging, fbPixel, googleAnalytics, executionTime FROM WebsiteData WHERE Website = ? AND Browser = ?';
                    const firefoxQuery = 'SELECT adTrackers, thirdPartyCookies, canvasFingerprinting, sessionRecording, keyLogging, fbPixel, googleAnalytics, executionTime FROM WebsiteData WHERE Website = ? AND Browser = ?';
                    const webkitQuery = 'SELECT adTrackers, thirdPartyCookies, canvasFingerprinting, sessionRecording, keyLogging, fbPixel, googleAnalytics, executionTime FROM WebsiteData WHERE Website = ? AND Browser = ?';
                    
                    connection.query(chromiumQuery, [`http://${url}`, 'Chromium'], (chromiumError, chromiumData) => {
                        if (chromiumError) {
                            console.error('Error fetching Chromium data:', chromiumError);
                            res.status(500).json({ error: 'Error fetching Chromium data' });
                        } else {
                            const processedChromium = chromiumData.length > 0 ? chromiumData[0] : null;
                            
                            connection.query(firefoxQuery, [`http://${url}`, 'Firefox'], (firefoxError, firefoxData) => {
                                if (firefoxError) {
                                    console.error('Error fetching Firefox data:', firefoxError);
                                    res.status(500).json({ error: 'Error fetching Firefox data' });
                                } else {
                                    const processedFirefox = firefoxData.length > 0 ? firefoxData[0] : null;
                                    
                                    connection.query(webkitQuery, [`http://${url}`, 'Webkit'], (webkitError, webkitData) => {
                                        if (webkitError) {                                            
                                            console.error('Error fetching Webkit data:', webkitError);
                                            res.status(500).json({ error: 'Error fetching Webkit data' });
                                        } else {
                                            const processedWebkit = webkitData.length > 0 ? webkitData[0] : null;
                                            
                                            res.json({ processedChromium, processedFirefox, processedWebkit });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    const resultChromium = await collectChromium(`http://${url}`, config);
                    const resultFirefox = await collectFirefox(`http://${url}`, config);
                    const resultWebkit = await collectWebkit(`http://${url}`, config);
        
                    const processedChromium = processResults(resultChromium);
                    const processedFirefox = processResults(resultFirefox);
                    const processedWebkit = processResults(resultWebkit);
        
                    // Save processed data to MySQL
                    saveProcessedResultsToMySQL(processedChromium, `http://${url}`, 'Chromium');
                    saveProcessedResultsToMySQL(processedFirefox, `http://${url}`, 'Firefox');
                    saveProcessedResultsToMySQL(processedWebkit, `http://${url}`, 'Webkit');
        
                    // Additional logic for handling the processed results and responses
                    const resultsDirectory = path.join(__dirname, 'results');
                    await fs.mkdir(resultsDirectory, { recursive: true });
        
                    await fs.writeFile(path.join(resultsDirectory, 'resultChromium.json'), JSON.stringify(resultChromium, null, 2));
                    await fs.writeFile(path.join(resultsDirectory, 'resultFirefox.json'), JSON.stringify(resultFirefox, null, 2));
                    await fs.writeFile(path.join(resultsDirectory, 'resultWebkit.json'), JSON.stringify(resultWebkit, null, 2));
        
                    res.json({ processedChromium, processedFirefox, processedWebkit });
                }
            }
        });
    } catch (error) {
        console.error('Scan failed:', error.message);
        res.status(500).json({ error: 'Scan failed' });
    }
});  

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
