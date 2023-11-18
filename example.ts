import { devices } from 'playwright';
import { CollectorOptions, collect } from './src';
import { join } from 'path';

(async () => {
    const URL = process.argv.length > 2 ? process.argv[2] : 'twitter.com';
    const EMULATE_DEVICE = 'Desktop Firefox';

    const config: CollectorOptions = {
        numPages: 1,
        headless: false,
        emulateDevice: devices[EMULATE_DEVICE],
        outDir: join(__dirname, 'demo-dir')
    };

    console.log(`Beginning scan of ${URL}`);

    const result = await collect(`http://${URL}`, config);

    if (result.status === 'success') {
        console.log(`Scan successful: ${config.outDir}`);
    } else {
        console.error(`Scan failed: ${result.page_response}`);
    }
})();