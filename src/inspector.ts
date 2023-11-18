import { promises as fsPromises } from 'fs';
import { Page } from 'playwright';
import { instrumentAddEventListener } from './plugins/add-event-listener';
import { instrumentFingerprintingApis } from './plugins/fingerprinting-apis';
import { jsInstruments } from './plugins/js-instrument';
import { injectPlugins } from './pptr-utils/eval-scripts';
import { BlacklightEvent } from './types';

function getPageScriptAsString(observers, testing = false) {
    let observersString = '';
    let observersNameString = '';
    observers.forEach(o => {
        observersString += `${o}\n`;
        observersNameString += `${o.name},`;
    });
    return `${jsInstruments}\n${observersString}(${injectPlugins}(jsInstruments,[${observersNameString}],StackTrace,${testing ? 'true' : 'false'}))`;
}

export const setupBlacklightInspector = async (
    page: Page,
    eventDataHandler: (event: BlacklightEvent) => void,
    testing = false,
    plugins = [instrumentAddEventListener, instrumentFingerprintingApis]
) => {
    const stackTraceHelper = await fsPromises.readFile(require.resolve('stacktrace-js/dist/stacktrace.js'), 'utf8');
    await page.addInitScript(stackTraceHelper);
    
    const pageScript = await getPageScriptAsString(plugins, testing);
    await page.addInitScript(pageScript);

    await page.exposeFunction('reportEvent', eventData => {
        try {
            const parsed = JSON.parse(eventData);
            eventDataHandler(parsed);
        } catch (error) {
            eventDataHandler({
                data: {
                    message: JSON.stringify(eventData)
                },
                stack: [],
                type: `Error.BlacklightInspector`,
                url: ''
            });
        }
    });
};
