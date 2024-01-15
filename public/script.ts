(function () {
  const scanForm = document.getElementById('scanForm');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const downloadButton = document.getElementById('downloadButton');

  if (downloadButton) {
    downloadButton.style.display = 'none';
  }

  if (scanForm) {
    scanForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
      }

      const formData = new FormData(event.target as HTMLFormElement);
      const url = formData.get('url');

      if (url) {
        try {
          const response = await fetch('/scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (!response.ok) {
            throw new Error('Scan failed');
          }

          const { processedChromium, processedFirefox, processedWebkit } = await response.json();
          displayInspectionResults(processedChromium, processedFirefox, processedWebkit);

          if (downloadButton) {
            downloadButton.style.display = 'inline-block';
          }
        } catch (error) {
          handleScanError(error);
        }
        if (loadingSpinner) {
          loadingSpinner.style.display = 'none';
        }
      }
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener('click', downloadResults);
  }

  function displayInspectionResults(processedChromium, processedFirefox, processedWebkit) {
    displayResult('resultsChromium', processedChromium);
    displayResult('resultsFirefox', processedFirefox);
    displayResult('resultsWebkit', processedWebkit);
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

  async function downloadResults() {
    try {
      // Fetch the JSON files from the server
      const [resultChromium, resultFirefox, resultWebkit] = await Promise.all([
        fetch('/results/resultChromium.json'),
        fetch('/results/resultFirefox.json'),
        fetch('/results/resultWebkit.json')
      ]);

      // Check if the requests were successful
      if (!resultChromium.ok || !resultFirefox.ok || !resultWebkit.ok) {
        throw new Error('Failed to download JSON files');
      }

      // Get the JSON data from the responses
      const [dataChromium, dataFirefox, dataWebkit] = await Promise.all([
        resultChromium.json(),
        resultFirefox.json(),
        resultWebkit.json()
      ]);

      // Create a Blob for each file
      const blobChromium = new Blob([JSON.stringify(dataChromium, null, 2)], { type: 'application/json' });
      const blobFirefox = new Blob([JSON.stringify(dataFirefox, null, 2)], { type: 'application/json' });
      const blobWebkit = new Blob([JSON.stringify(dataWebkit, null, 2)], { type: 'application/json' });

      // Create download links for each file
      downloadFile(blobChromium, 'resultChromium.json');
      downloadFile(blobFirefox, 'resultFirefox.json');
      downloadFile(blobWebkit, 'resultWebkit.json');
    } catch (error) {
      console.error('Error downloading files:', error.message);
    }
  }

  // Define the downloadFile function
  function downloadFile(blob, filename) {
    // Create an <a> element to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;

    // Append the link to the document and trigger the download
    document.body.appendChild(link);
    link.click();

    // Remove the link from the document
    document.body.removeChild(link);
  }


  function handleScanError(error) {
    console.error('Error:', error.message);
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
      resultsDiv.textContent = error.message;
    }
  }
})();
