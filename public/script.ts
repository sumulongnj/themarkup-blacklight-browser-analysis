(function () {
  const scanForm = document.getElementById('scanForm');
  const loadingSpinner = document.getElementById('loadingSpinner');

  if (scanForm) {
    scanForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
      }

      // Clear the contents of result elements
      clearResults();

      const formData = new FormData(event.target as HTMLFormElement);
      const url = formData.get('url');

      if (url) {
        try {
          // Chromium
          const responseChromium = await fetch('/scan/chromium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (!responseChromium.ok) {
            throw new Error('Chromium scan failed');
          }

          const { result: processedChromium } = await responseChromium.json();
          displayResult('resultsChromium', processedChromium);

          // Firefox
          const responseFirefox = await fetch('/scan/firefox', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (!responseFirefox.ok) {
            throw new Error('Firefox scan failed');
          }

          const { result: processedFirefox } = await responseFirefox.json();
          displayResult('resultsFirefox', processedFirefox);

          // Webkit
          const responseWebkit = await fetch('/scan/webkit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (!responseWebkit.ok) {
            throw new Error('Webkit scan failed');
          }

          const { result: processedWebkit } = await responseWebkit.json();
          displayResult('resultsWebkit', processedWebkit);

        } catch (error) {
          handleScanError(error);
        }
        if (loadingSpinner) {
          loadingSpinner.style.display = 'none';
        }
      }
    });
  }

  function displayResult(elementId, result) {
    const resultsDiv = document.getElementById(elementId);
    if (resultsDiv) {
      let output = '';

      // 1. Ad Trackers
      if (result.adTrackers > 0) {
        output += `<span class="found">${result.adTrackers} ad tracker(s) found on this site.</span><br><br>`;
      } else {
        output += 'Ad trackers not found on this site.<br><br>';
      }

      // 2. Third-party Cookies
      if (result.thirdPartyCookies > 0) {
        output += `<span class="found">${result.thirdPartyCookies} third-party cookie(s) found.</span><br><br>`;
      } else {
        output += 'Third-party cookies not found.<br><br>';
      }

      // 3. Canvas Fingerprinting
      // Check for canvas_fingerprinters and canvas_font_fingerprinters for tracking that evades cookie blockers
      if (!result.canvasFingerprinting) {
        output += 'Tracking that evades cookie blockers not found.<br><br>';
      } else {
        output += '<span class="found">This website loads trackers on your computer that are designed to evade third-party cookie blockers.</span><br><br>';
      }

      // 4. Session Recording
      if (!result.sessionRecording) {
        output += 'Session recording services not found on this website.<br><br>';
      } else {
        output += '<span class="found">This website could be monitoring your keystrokes and mouse clicks.</span><br><br>';
      }

      // 5. Key Logging
      if (!result.keyLogging) {
        output += 'We did not find this website capturing keystrokes.<br><br>';
      } else {
        output += '<span class="found">We found this website capturing keystrokes.</span><br><br>';
      }

      // 6. Facebook Pixel
      if (!result.fbPixel) {
        output += 'Facebook Pixel not found on this website.<br><br>';
      } else {
        output += '<span class="found">When you visit this site, it tells Facebook.</span><br><br>';
      }

      // 7. Google Analytics
      if (!result.googleAnalytics) {
        output += 'Google Analytics\' "remarketing audience" feature not found.<br><br>';
      } else {
        output += '<span class="found">This site allows Google Analytics to follow you across the internet.</span><br><br>';
      }

      // Execution Time Calculation
      output += `<span class="w3-tag w3-center">Execution time: ${result.executionTime} seconds</span>`;

      // Displaying the results
      resultsDiv.innerHTML = `<pre>${output}</pre>`;
    }
  }

  function clearResults() {
    clearResult('resultsChromium');
    clearResult('resultsFirefox');
    clearResult('resultsWebkit');
  }

  function clearResult(elementId) {
    const resultsDiv = document.getElementById(elementId);
    if (resultsDiv) {
      resultsDiv.innerHTML = ''; 
    }
  }

  function handleScanError(error) {
    console.error('Error:', error.message);
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
      resultsDiv.textContent = error.message;
    }
  }
})();
