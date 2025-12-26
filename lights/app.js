// Pattern names (must match server-side order)
const PATTERNS = [
    "Rainbow",
    "Firefly",
    "Christmas 1",
    "Christmas 2",
    "Christmas 3",
    "Twinkle",
    "Solid",
    "Sparkle",
    "Chase"
];

// Gamma correction (gamma = 2.0) for perceptually linear brightness

// User input 0-100% to server value 0-255
function percentToValue(percent) {
    const normalized = percent / 100;
    return Math.round(normalized * normalized * 255);
}

// Server value 0-255 to display 0-100%
function valueToPercent(value) {
    return Math.round(Math.sqrt(value / 255) * 100);
}

// Format uptime as "Xd Xh Xm Xs"
function formatUptime(secs) {
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Format voltage from millivolts
function formatVoltage(mv) {
    return (mv / 1000).toFixed(2) + "V";
}

// Update the UI with status data
function updateStatus(data) {
    document.getElementById("uptime").textContent = formatUptime(data.uptime_secs);
    document.getElementById("pattern-display").textContent =
        PATTERNS[data.pattern] || `Unknown (${data.pattern})`;
    document.getElementById("brightness-desired").textContent =
        valueToPercent(data.brightness) + "%";
    document.getElementById("brightness-actual").textContent =
        valueToPercent(data.brightness_target) + "%";
    document.getElementById("voltage-raw").textContent = formatVoltage(data.raw_mv);
    document.getElementById("voltage-smoothed").textContent = formatVoltage(data.smoothed_mv);
    document.getElementById("voltage-predicted").textContent = formatVoltage(data.predicted_mv);
    document.getElementById("voltage-trend").textContent = data.trend_mv_per_sec + " mV/s";

    // Update form controls to match current values
    document.getElementById("pattern").value = data.pattern;
    const brightnessPercent = valueToPercent(data.brightness);
    document.getElementById("brightness").value = brightnessPercent;
    document.getElementById("brightness-label").textContent = brightnessPercent + "%";
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById("error");
    errorDiv.textContent = message;
    errorDiv.classList.add("visible");
}

// Hide error message
function hideError() {
    document.getElementById("error").classList.remove("visible");
}

// Set button loading state
function setLoading(loading) {
    document.getElementById("apply-btn").disabled = loading;
    document.getElementById("refresh-btn").disabled = loading;
}

// Fetch status from server
async function fetchStatus() {
    setLoading(true);
    hideError();
    try {
        const response = await fetch(`${window.API_BASE}/api/status`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        updateStatus(data);
    } catch (err) {
        showError(`Failed to fetch status: ${err.message}`);
    } finally {
        setLoading(false);
    }
}

// Submit configuration to server
async function submitConfig() {
    setLoading(true);
    hideError();
    try {
        const pattern = parseInt(document.getElementById("pattern").value);
        const brightnessPercent = parseInt(document.getElementById("brightness").value);
        const brightness = percentToValue(brightnessPercent);

        const response = await fetch(`${window.API_BASE}/api/config`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ pattern, brightness })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        updateStatus(data);
    } catch (err) {
        showError(`Failed to apply config: ${err.message}`);
    } finally {
        setLoading(false);
    }
}

// Initialize the app
function init() {
    // Populate pattern dropdown
    const patternSelect = document.getElementById("pattern");
    PATTERNS.forEach((name, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = name;
        patternSelect.appendChild(option);
    });

    // Update brightness label on slider change
    const brightnessSlider = document.getElementById("brightness");
    const brightnessLabel = document.getElementById("brightness-label");
    brightnessSlider.addEventListener("input", () => {
        brightnessLabel.textContent = brightnessSlider.value + "%";
    });

    // Button handlers
    document.getElementById("apply-btn").addEventListener("click", submitConfig);
    document.getElementById("refresh-btn").addEventListener("click", fetchStatus);

    // Initial fetch
    fetchStatus();
}

// Start when DOM is ready
document.addEventListener("DOMContentLoaded", init);
