import { test } from '@playwright/test';
import { fromPlaywrightDetails, PlaywrightBlocker } from '@cliqz/adblocker-playwright';
import fs from 'fs';
import path from 'path';

const blockerOptions = {
  debug: true,
  enableOptimizations: false,
  loadCosmeticFilters: false,
};

type TrackerInfo = {
  data: {
    query: Record<string, any>;
    filter: string;
    listName: string;
  };
  stack: {
    fileName: string;
    source: string;
  }[];
  type: string;
  url: string;
};

const trackers: TrackerInfo[] = [];

const easyList = PlaywrightBlocker.parse(
  fs.readFileSync(path.join(__dirname, '../data/blocklists/easylist.txt'), 'utf8'),
  blockerOptions
);

const easyPrivacy = PlaywrightBlocker.parse(
  fs.readFileSync(path.join(__dirname, '../data/blocklists/easyprivacy.txt'), 'utf8'),
  blockerOptions
);

test.beforeEach(async ({ context }) => {
  // Intercept network requests from the beginning
  await context.route('**', (route) => {
    const request = route.request();
    let isBlocked = false;

    // Check against EasyList and EasyPrivacy for first-party requests
    const { match: easyListMatch } = easyList.match(fromPlaywrightDetails(request));
    const { match: easyPrivacyMatch } = easyPrivacy.match(fromPlaywrightDetails(request));

    if (easyListMatch || easyPrivacyMatch) {
      isBlocked = true;
    }

    for (const [listName, blocker] of Object.entries({ easyList, easyPrivacy })) {
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

      const newTracker: TrackerInfo = {
        data: {
          query,
          filter: filter.toString(),
          listName,
        },
        stack: [
          {
            fileName: request.frame()?.url() ?? '',
            source: 'ThirdPartyTracker RequestHandler',
          },
        ],
        type: 'TrackingRequest',
        url: request.url(),
      };

      // Check if the tracker is already in the array before pushing
      const isDuplicate = trackers.some(
        (tracker) => JSON.stringify(tracker) === JSON.stringify(newTracker)
      );

      if (!isDuplicate) {
        trackers.push(newTracker);
      }

      break;
    }

    if (isBlocked) {
      route.abort();
    } else {
      route.continue();
    }
  });
});

test('Monitor Network Requests', async ({ context }) => {
  // Create a new page
  const page = await context.newPage();

  // Perform other test actions or assertions...
  // Clear cookies and permissions before each test
  await context.clearCookies();
  await context.clearPermissions();

  await page.goto('https://twitter.com');
  await page.goto('https://twitter.com/settings');

  // Perform additional analysis for third-party tracking requests
  console.log('Trackers:', trackers.length);

  await context.close();
});
