import { Page } from 'puppeteer';

export const DEFAULT_INPUT_VALUES = {
    // ... [rest of the default input values]
};

export const fillForms = async (page: Page, timeout = 6000) => {
    let isInteracting = false;

    const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
            if (isInteracting) {
                console.log('Interaction ongoing. Waiting for safe exit.');
                return;
            }
            console.log('Timeout reached. Exiting fillForms().');
            resolve('Timeout');
        }, timeout);
    });

    const fillPromise = async () => {
        console.log('Entering fillPromise.');
        try {
            if (!page.isClosed()) {
                console.log('Checking for inputs on the page');
                const elements = await page.$$('input');
                console.log(`Found ${elements.length} input elements`);
                let count = 0;
                for (const el of elements) {
                    if (!page.isClosed()) {
                        isInteracting = true;

                        console.log(`Inspecting element ${count}`);
                        if (count > 100) {
                            break;
                        }
                        count += 1;

                        const pHandle = await el.getProperty('type');
                        const pValue = await pHandle.jsonValue();
                        console.log(`Input is type ${pValue}`);

                        const autoCompleteHandle = await el.getProperty('autocomplete');
                        const autoCompleteValue = (await autoCompleteHandle.jsonValue()) as string;
                        console.log(`Autocomplete attribute is: ${autoCompleteValue}`);
                        let autoCompleteKeys = [];

                        console.log('Checking autocomplete value');
                        if (autoCompleteValue) {
                            if (autoCompleteValue.includes('cc-name')) {
                                console.log('Autocomplete includes cc-name.');
                                autoCompleteKeys = ['cc-name'];
                            } else {
                                console.log('Autocomplete does not include cc-name.');
                                autoCompleteKeys = Object.keys(DEFAULT_INPUT_VALUES).filter(k => (autoCompleteValue as string).includes(k));
                            }
                        }

                        if (pValue === 'submit' || pValue === 'hidden') {
                            console.log('Type is either submit or hidden.');
                            continue;
                        } else if (autoCompleteKeys.length > 0) {
                            console.log('Autocomplete keys > 0');
                            await el.focus();
                            await page.keyboard.press('Tab', {
                                delay: 100
                            });
                            await el.press('Backspace');
                            await page.keyboard.type(DEFAULT_INPUT_VALUES[autoCompleteKeys[0] as string]);
                        } else if (Object.keys(DEFAULT_INPUT_VALUES).includes(pValue as string)) {
                            console.log('Default input values includes pValue');
                            await el.focus();
                            await page.keyboard.press('Tab', {
                                delay: 100
                            });
                            await el.press('Backspace');
                            await page.keyboard.type(DEFAULT_INPUT_VALUES[pValue as string]);
                            console.log(' ... done with test');
                        }
                        isInteracting = false;
                    } else {
                        console.log('Page is closed. Exiting loop.');
                        break;
                    }
                }
            } else {
                console.log('Page is closed. Exiting fillForms.');
            }
        } catch (error) {
            if (error.message.includes('Execution context was destroyed')) {
                console.log('Page navigated away while interacting. Continuing...');
            } else {
                console.error('Error in fillForms:', error);
            }
        } finally {
            console.log('Done with fillForms');
        }
    };

    return await Promise.race([timeoutPromise, fillPromise()]);
};

export const autoScroll = async page => {
    await page.evaluate(async () => {
        return new Promise((resolve, reject) => {
            try {
                let totalHeight = 0;
                const distance = 150;
                const COUNT_MAX = 5;
                let count = 0;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    count += 1;
                    if (totalHeight >= scrollHeight || count > COUNT_MAX) {
                        clearInterval(timer);
                        resolve(undefined);
                    }
                }, 100);
            } catch (error) {
                reject(error);
            }
        });
    });
};
