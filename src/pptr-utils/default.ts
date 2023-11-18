import { writeFile } from 'fs/promises';
import path from 'path';
import { Page } from 'playwright';

export const savePageContent = async (index, outDir, page: Page, screenshot = true) => {
    try {
        const html = await page.content();
        const outPath = path.join(outDir, `${index}.html`);
        await writeFile(outPath, html);
        if (screenshot) {
            const outPathImg = path.join(outDir, `${index}.jpeg`);
            await page.screenshot({ path: outPathImg, type: 'jpeg', quality: 50 });
        }
    } catch (error) {
        console.log(`Couldn't save page content: ${JSON.stringify(error)}`);
    }
};

/**
 * Default Playwright options for dev
 */
export const defaultPlaywrightBrowserOptions = {
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors', '--autoplay-policy=no-user-gesture-required'],
    viewport: null,
    headless: true,
};