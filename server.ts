const express = require('express');
const { devices } = require('playwright');
const { collectChromium, collectFirefox, collectWebkit } = require('./src'); // Update with your path to the collector script
const { collect } = require('./control');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public', { extensions: ['html', 'js'] }));
app.use('/results', express.static(path.join(__dirname, 'results')));

function processResults(result) {
    const uniqueFilters = new Set();
    const adTrackers = result.reports.third_party_trackers.reduce((count, tracker) => {
        const filter = tracker.data.filter;
        if (!uniqueFilters.has(filter)) {
            uniqueFilters.add(filter);
            return count + 1;
        }
        return count;
    }, 0);

    const thirdPartyCookies = result.reports.cookies.filter(cookies => cookies['third_party']).length || 0;

    let canvasFingerprinting;
    if (result.reports.canvas_fingerprinters.data_url.length ||
        result.reports.canvas_fingerprinters.fingerprinters.length ||
        result.reports.canvas_fingerprinters.styles.length ||
        result.reports.canvas_fingerprinters.texts.length ||
        result.reports.canvas_font_fingerprinters.canvas_font.length ||
        result.reports.canvas_font_fingerprinters.text_measure.length) {
        canvasFingerprinting = true;
    }
    else {
        canvasFingerprinting = false;
    }

    const sessionRecording = Object.keys(result.reports.session_recorders).length > 0;
    const keyLogging = Object.keys(result.reports.key_logging).length > 0;
    const fbPixel = result.reports.fb_pixel_events.length > 0;

    const hasGoogleAnalyticsRequest = result.reports.third_party_trackers.some(tracker => {
        const url = tracker.url.toLowerCase();
        const isDoubleClick = url.includes('stats.g.doubleclick');

        // Check if tracker.data and tracker.data.query are both defined and tracker.data.query is an object
        const hasUAGoogleIdentifier = tracker.data && tracker.data.query && typeof tracker.data.query === 'object' &&
            tracker.data.query.tid && typeof tracker.data.query.tid === 'string' && tracker.data.query.tid.startsWith('UA-');

        return isDoubleClick && hasUAGoogleIdentifier;
    });
    const googleAnalytics = !!hasGoogleAnalyticsRequest;

    const executionTime = (new Date(result.end_time).getTime() - new Date(result.start_time).getTime()) / 1000;

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

// Chromium route
app.post('/scan/chromium', async (req, res) => {
    const { url } = req.body;

    const config = {
        numPages: 1,
        headless: true,
        outDir: path.join(__dirname, 'demo-dir'),
    };

    console.log(`Beginning scan of ${url} in Chromium`);

    try {
        const resultChromium = await collect(`http://${url}`, config);
        const processedChromium = processResults(resultChromium);

        // Send processed result for Chromium immediately
        res.json({ result: processedChromium });

        // Additional logic for handling the processed results and responses
        const resultsDirectory = path.join(__dirname, 'results');
        await fs.mkdir(resultsDirectory, { recursive: true });

        await fs.writeFile(path.join(resultsDirectory, 'resultChromium.json'), JSON.stringify(resultChromium, null, 2));
    } catch (error) {
        console.error('Chromium scan failed:', error.message);
        res.status(500).json({ error: 'Chromium scan failed' });
    }
});

// Firefox route
app.post('/scan/firefox', async (req, res) => {
    const { url } = req.body;

    const config = {
        numPages: 1,
        headless: true,
        outDir: path.join(__dirname, 'demo-dir'),
    };

    console.log(`Beginning scan of ${url} in Firefox`);

    try {
        const resultFirefox = await collectFirefox(`http://${url}`, config);
        const processedFirefox = processResults(resultFirefox);

        // Send processed result for Firefox immediately
        res.json({ result: processedFirefox });

        // Additional logic for handling the processed results and responses
        const resultsDirectory = path.join(__dirname, 'results');
        await fs.mkdir(resultsDirectory, { recursive: true });

        await fs.writeFile(path.join(resultsDirectory, 'resultFirefox.json'), JSON.stringify(resultFirefox, null, 2));
    } catch (error) {
        console.error('Firefox scan failed:', error.message);
        res.status(500).json({ error: 'Firefox scan failed' });
    }
});

// Webkit route
app.post('/scan/webkit', async (req, res) => {
    const { url } = req.body;

    const config = {
        numPages: 1,
        headless: true,
        outDir: path.join(__dirname, 'demo-dir'),
    };

    console.log(`Beginning scan of ${url} in Webkit`);

    try {
        const resultWebkit = await collectWebkit(`http://${url}`, config);
        const processedWebkit = processResults(resultWebkit);

        // Send processed result for Webkit immediately
        res.json({ result: processedWebkit });

        // Additional logic for handling the processed results and responses
        const resultsDirectory = path.join(__dirname, 'results');
        await fs.mkdir(resultsDirectory, { recursive: true });

        await fs.writeFile(path.join(resultsDirectory, 'resultWebkit.json'), JSON.stringify(resultWebkit, null, 2));
    } catch (error) {
        console.error('Webkit scan failed:', error.message);
        res.status(500).json({ error: 'Webkit scan failed' });
    }
});

app.get('/results/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'results', filename);

    console.log(filename);
    console.log(filePath);

    res.setHeader('Content-Type', 'application/json');

    res.sendFile(filePath);
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
