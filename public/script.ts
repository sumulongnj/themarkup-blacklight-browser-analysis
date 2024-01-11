(function() {
    const scanForm = document.getElementById('scanForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (scanForm) {
      scanForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (loadingSpinner) {
            loadingSpinner.style.display = 'block'; // Show loading spinner
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
          } catch (error) {
            handleScanError(error);
          }
          if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
          }
        }
      });
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
                output += `${result.adTrackers} ad tracker(s) found on this site.<br><br>`;
            } else {
                output += 'Ad trackers not found on this site.<br><br>';
            }
    
            // 2. Third-party Cookies
            if (result.thirdPartyCookies > 0) {
                output += `${result.thirdPartyCookies} third-party cookie(s) found.<br><br>`;
            } else {
                output += 'Third-party cookies not found.<br><br>';
            }
    
            // 3. Canvas Fingerprinting
            // Check for canvas_fingerprinters and canvas_font_fingerprinters for tracking that evades cookie blockers
            if (!result.canvasFingerprinting) {
                output += 'Tracking that evades cookie blockers not found.<br><br>';
            } else {
                output += 'This website loads trackers on your computer that are designed to evade third-party cookie blockers.<br><br>';
            }
    
            // 4. Session Recording
            if (!result.sessionRecording) {
                output += 'Session recording services not found on this website.<br><br>';
            } else {
                output += 'This website could be monitoring your keystrokes and mouse clicks.<br><br>';
            }
    
            // 5. Key Logging
            if (!result.keyLogging) {
                output += 'We did not find this website capturing keystrokes.<br><br>';
            } else {
                output += 'We found this website capturing keystrokes.<br><br>';
            }
    
            // 6. Facebook Pixel
            if (!result.fbPixel) {
                output += 'Facebook Pixel not found on this website.<br><br>';
            } else {
                output += 'When you visit this site, it tells Facebook.<br><br>';
            }
    
            // 7. Google Analytics
            if (!result.googleAnalytics) {
                output += 'Google Analytics\' "remarketing audience" feature not found.<br><br>';
            } else {
                output += 'Google Analytics\' "remarketing audience" feature found.<br><br>';
            }
    
            // Execution Time Calculation
            output += `Execution time: ${result.executionTime} milliseconds`;
    
            // Displaying the results
            resultsDiv.innerHTML = `<pre>${output}</pre>`;
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
  