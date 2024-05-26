var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
(function () {
    var _this = this;
    var scanForm = document.getElementById('scanForm');
    var loadingSpinner = document.getElementById('loadingSpinner');
    if (scanForm) {
        scanForm.addEventListener('submit', function (event) { return __awaiter(_this, void 0, void 0, function () {
            var formData, url, responseChromium, processedChromium, responseFirefox, processedFirefox, responseWebkit, processedWebkit, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        event.preventDefault();
                        if (loadingSpinner) {
                            loadingSpinner.style.display = 'block';
                        }
                        // Clear the contents of result elements
                        clearResults();
                        formData = new FormData(event.target);
                        url = formData.get('url');
                        if (!url) return [3 /*break*/, 10];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, fetch('/scan/chromium', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ url: url }),
                            })];
                    case 2:
                        responseChromium = _a.sent();
                        if (!responseChromium.ok) {
                            throw new Error('Chromium scan failed');
                        }
                        return [4 /*yield*/, responseChromium.json()];
                    case 3:
                        processedChromium = (_a.sent()).result;
                        displayResult('resultsChromium', processedChromium);
                        return [4 /*yield*/, fetch('/scan/firefox', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ url: url }),
                            })];
                    case 4:
                        responseFirefox = _a.sent();
                        if (!responseFirefox.ok) {
                            throw new Error('Firefox scan failed');
                        }
                        return [4 /*yield*/, responseFirefox.json()];
                    case 5:
                        processedFirefox = (_a.sent()).result;
                        displayResult('resultsFirefox', processedFirefox);
                        return [4 /*yield*/, fetch('/scan/webkit', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ url: url }),
                            })];
                    case 6:
                        responseWebkit = _a.sent();
                        if (!responseWebkit.ok) {
                            throw new Error('Webkit scan failed');
                        }
                        return [4 /*yield*/, responseWebkit.json()];
                    case 7:
                        processedWebkit = (_a.sent()).result;
                        displayResult('resultsWebkit', processedWebkit);
                        return [3 /*break*/, 9];
                    case 8:
                        error_1 = _a.sent();
                        handleScanError(error_1);
                        return [3 /*break*/, 9];
                    case 9:
                        if (loadingSpinner) {
                            loadingSpinner.style.display = 'none';
                        }
                        _a.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        }); });
    }
    function displayResult(elementId, result) {
        var resultsDiv = document.getElementById(elementId);
        if (resultsDiv) {
            var output = '';
            // 1. Ad Trackers
            if (result.adTrackers > 0) {
                output += "\n          <details>\n            <summary class=\"found\">".concat(result.adTrackers, " ad tracker(s) found on this site.</summary>\n            <ol id=\"").concat(elementId, "AdTrackers\" class=\"ad-trackers-list\">").concat(result.uniqueFiltersArray.map(function (tracker) { return "<li>".concat(tracker, "</li>"); }).join(''), "</ol>\n          </details><br><br>");
            }
            else {
                output += "\n          <details>\n            <summary>Ad-trackers not found on this site.</summary>\n            <ol id=\"".concat(elementId, "AdTrackers\" class=\"ad-trackers-list\">NONE</ol>\n          </details><br><br>");
            }
            // 2. Third-party Cookies
            if (result.thirdPartyCookies > 0) {
                output += "\n          <details>\n            <summary class=\"found\">".concat(result.thirdPartyCookies, " third-party cookie(s) found.</summary>\n            <ol id=\"").concat(elementId, "Cookies\" class=\"ad-trackers-list\">").concat(result.thirdPartyCookiesArray.map(function (tracker) { return "<li>".concat(tracker, "</li>"); }).join(''), "</ol>\n          </details><br><br>");
            }
            else {
                output += "\n          <details>\n            <summary>Third-party cookies not found on this site.</summary>\n            <ol id=\"".concat(elementId, "Cookies\" class=\"ad-trackers-list\">NONE</ol>\n          </details><br><br>");
            }
            // 3. Canvas Fingerprinting
            // Check for canvas_fingerprinters and canvas_font_fingerprinters for tracking that evades cookie blockers
            if (!result.canvasFingerprinting) {
                output += 'Tracking that evades cookie blockers not found.<br><br>';
            }
            else {
                output += '<span class="found">Tracking that evades cookie blockers found.</span><br><br>';
            }
            // 4. Session Recording
            if (!result.sessionRecording) {
                output += 'Session recording services not found on this website.<br><br>';
            }
            else {
                output += '<span class="found">Session recording services found on this website.</span><br><br>';
            }
            // 5. Key Logging
            if (!result.keyLogging) {
                output += 'We did not find this website capturing keystrokes.<br><br>';
            }
            else {
                output += '<span class="found">We found this website capturing keystrokes.</span><br><br>';
            }
            // 6. Facebook Pixel
            if (!result.fbPixel) {
                output += 'Facebook Pixel not found on this website.<br><br>';
            }
            else {
                output += '<span class="found">When you visit this site, it tells Facebook.</span><br><br>';
            }
            // 7. Google Analytics
            if (!result.googleAnalytics) {
                output += 'Google Analytics\' "remarketing audience" feature not found.<br><br>';
            }
            else {
                output += '<span class="found">This site allows Google Analytics to follow you across the internet.</span><br><br>';
            }
            // Execution Time Calculation
            output += "<span class=\"w3-tag w3-center\">Execution time: ".concat(result.executionTime, " seconds</span>");
            // Displaying the results
            resultsDiv.innerHTML = "<pre>".concat(output, "</pre>");
        }
    }
    function clearResults() {
        clearResult('resultsChromium');
        clearResult('resultsFirefox');
        clearResult('resultsWebkit');
    }
    function clearResult(elementId) {
        var resultsDiv = document.getElementById(elementId);
        if (resultsDiv) {
            resultsDiv.innerHTML = '';
        }
    }
    function handleScanError(error) {
        console.error('Error:', error.message);
        var resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.textContent = error.message;
        }
    }
})();
