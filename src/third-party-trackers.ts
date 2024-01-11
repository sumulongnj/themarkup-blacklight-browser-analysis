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

const blockers = {
    'easyprivacy.txt': PlaywrightBlocker.parse(fs.readFileSync(path.join(__dirname, '../data/blocklists/easyprivacy.txt'), 'utf8'), blockerOptions),
    'easylist.txt': PlaywrightBlocker.parse(fs.readFileSync(path.join(__dirname, '../data/blocklists/easylist.txt'), 'utf8'), blockerOptions)
};

export const setUpThirdPartyTrackersInspector = async (
    page: Page,
    eventDataHandler: (event: TrackingRequestEvent) => void,
    enableAdBlock = false
) => {
    if (enableAdBlock) {
        console.log("ad-blocked");
    }

    page.on('request', async request => {
        let isBlocked = false;

        for (const [listName, blocker] of Object.entries(blockers)) {
            const { match, filter } = blocker.match(fromPlaywrightDetails(request));

            if (!match) {
                continue;
            }

            isBlocked = true;

            const params = new URL(request.url()).searchParams;
            const query = {};
            for (const [key, value] of params.entries()) {
                try {
                    query[key] = JSON.parse(value);
                } catch {
                    query[key] = value;
                }
            }

            eventDataHandler({
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
            });

            break;
        }

        if (enableAdBlock) {
            if (isBlocked) {
                console.log("ad-blocked");
            } else {
                console.log("ad-not-blocked");
            }
        }
    });
};