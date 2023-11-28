const express = require('express');
const { devices } = require('playwright');
const { collectChromium, collectFirefox, collectWebkit } = require('./src'); // Update with your path to the collector script
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

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

app.post('/scan', async (req, res) => {
  const { url } = req.body;

  const config = {
    numPages: 1,
    headless: true,
    outDir: path.join(__dirname, 'demo-dir'),
  };

  console.log(`Beginning scan of ${url}`);

  try {
    const resultChromium = await collectChromium(`http://${url}`, config);
    const resultFirefox = await collectFirefox(`http://${url}`, config);
    const resultWebkit = await collectWebkit(`http://${url}`, config);

    const processedChromium = processResults(resultChromium); // Process the results for Chromium
    const processedFirefox = processResults(resultFirefox); // Process the results for Firefox
    const processedWebkit = processResults(resultWebkit); // Process the results for Webkit

    const resultsDirectory = path.join(__dirname, 'results'); // Define the directory path for results

    // Create the directory if it doesn't exist
    await fs.mkdir(resultsDirectory, { recursive: true });

    // Write processed results to JSON files in the new directory
    await fs.writeFile(path.join(resultsDirectory, 'resultChromium.json'), JSON.stringify(resultChromium, null, 2));
    await fs.writeFile(path.join(resultsDirectory, 'resultFirefox.json'), JSON.stringify(resultFirefox, null, 2));
    await fs.writeFile(path.join(resultsDirectory, 'resultWebkit.json'), JSON.stringify(resultWebkit, null, 2));

    res.json({ processedChromium, processedFirefox, processedWebkit });
  } catch (error) {
    console.error('Scan failed:', error.message);
    res.status(500).json({ error: 'Scan failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
