import { fromPlaywrightDetails, PlaywrightBlocker } from '@cliqz/adblocker-playwright';
import fs from 'fs';
import path from 'path';
import { Page } from 'playwright';
import { TrackingRequestEvent } from './types';

const blockerOptions = {
    debug: true,
    enableOptimizations: false,
    loadCosmeticFilters: false
};

const easyPrivacy = PlaywrightBlocker.parse(
    fs.readFileSync(path.join(__dirname, '../data/blocklists/easyprivacy.txt'), 'utf8'),
    blockerOptions
);

const easyList = PlaywrightBlocker.parse(
    fs.readFileSync(path.join(__dirname, '../data/blocklists/easylist.txt'), 'utf8'),
    blockerOptions
);

export const setUpThirdPartyTrackersInspector = async (
    page: Page,
    eventDataHandler: (event: TrackingRequestEvent) => void,
    enableAdBlock = false
) => {
    if (enableAdBlock) {
        await page.route('**', (route) => {
            const request = route.request();
            let isBlocked = false;

            const { match: easyPrivacyMatch } = easyPrivacy.match(fromPlaywrightDetails(request));
            const { match: easyListMatch } = easyList.match(fromPlaywrightDetails(request));

            if (easyPrivacyMatch || easyListMatch) {
                isBlocked = true;
            }

            for (const [listName, blocker] of Object.entries({ easyPrivacy, easyList })) {
                const { match, filter } = blocker.match(fromPlaywrightDetails(request));

                if (!match) {
                    continue;
                }

                isBlocked = true;

                const params = new URL(request.url()).searchParams;
                const query: Record<string, any> = {};
                for (const [key, value] of params.entries()) {
                    try {
                        query[key] = JSON.parse(value);
                    } catch {
                        query[key] = value;
                    }
                }

                const eventData: TrackingRequestEvent = {
                    data: {
                        query,
                        filter: filter.toString(),
                        listName
                    },
                    stack: [
                        {
                            fileName: request.frame()?.url() ?? '',
                            source: 'ThirdPartyTracker RequestHandler'
                        }
                    ],
                    type: 'TrackingRequest',
                    url: request.url()
                };

                eventDataHandler(eventData);

                break;
            }

            if (enableAdBlock) {
                isBlocked ? route.abort() : route.continue();
            }
        });
    }
};