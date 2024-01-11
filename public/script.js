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
            var formData, url, response, _a, processedChromium, processedFirefox, processedWebkit, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        event.preventDefault();
                        if (loadingSpinner) {
                            loadingSpinner.style.display = 'block'; // Show loading spinner
                        }
                        formData = new FormData(event.target);
                        url = formData.get('url');
                        if (!url) return [3 /*break*/, 6];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch('/scan', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ url: url }),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error('Scan failed');
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        _a = _b.sent(), processedChromium = _a.processedChromium, processedFirefox = _a.processedFirefox, processedWebkit = _a.processedWebkit;
                        displayInspectionResults(processedChromium, processedFirefox, processedWebkit);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        handleScanError(error_1);
                        return [3 /*break*/, 5];
                    case 5:
                        if (loadingSpinner) {
                            loadingSpinner.style.display = 'none';
                        }
                        _b.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); });
    }
    function displayInspectionResults(processedChromium, processedFirefox, processedWebkit) {
        displayResult('resultsChromium', processedChromium);
        displayResult('resultsFirefox', processedFirefox);
        displayResult('resultsWebkit', processedWebkit);
    }
    function displayResult(elementId, result) {
        var resultsDiv = document.getElementById(elementId);
        if (resultsDiv) {
            var output = '';
            // 1. Ad Trackers
            if (result.adTrackers > 0) {
                output += "".concat(result.adTrackers, " ad tracker(s) found on this site.<br><br>");
            }
            else {
                output += 'Ad trackers not found on this site.<br><br>';
            }
            // 2. Third-party Cookies
            if (result.thirdPartyCookies > 0) {
                output += "".concat(result.thirdPartyCookies, " third-party cookie(s) found.<br><br>");
            }
            else {
                output += 'Third-party cookies not found.<br><br>';
            }
            // 3. Canvas Fingerprinting
            // Check for canvas_fingerprinters and canvas_font_fingerprinters for tracking that evades cookie blockers
            if (!result.canvasFingerprinting) {
                output += 'Tracking that evades cookie blockers not found.<br><br>';
            }
            else {
                output += 'This website loads trackers on your computer that are designed to evade third-party cookie blockers.<br><br>';
            }
            // 4. Session Recording
            if (!result.sessionRecording) {
                output += 'Session recording services not found on this website.<br><br>';
            }
            else {
                output += 'This website could be monitoring your keystrokes and mouse clicks.<br><br>';
            }
            // 5. Key Logging
            if (!result.keyLogging) {
                output += 'We did not find this website capturing keystrokes.<br><br>';
            }
            else {
                output += 'We found this website capturing keystrokes.<br><br>';
            }
            // 6. Facebook Pixel
            if (!result.fbPixel) {
                output += 'Facebook Pixel not found on this website.<br><br>';
            }
            else {
                output += 'When you visit this site, it tells Facebook.<br><br>';
            }
            // 7. Google Analytics
            if (!result.googleAnalytics) {
                output += 'Google Analytics\' "remarketing audience" feature not found.<br><br>';
            }
            else {
                output += 'Google Analytics\' "remarketing audience" feature found.<br><br>';
            }
            // Execution Time Calculation
            output += "Execution time: ".concat(result.executionTime, " milliseconds");
            // Displaying the results
            resultsDiv.innerHTML = "<pre>".concat(output, "</pre>");
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
