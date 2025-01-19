let data = 0;
let WIFI_URL = "http://192.168.4.1";
// ================================================================
// ================================================================
// ================================================================
// WIFI_URL = "http://192.168.1.3:5000/"; // test
// ===============================================================
// ===============================================================
// ===============================================================
let isTrainingMode = false;
let wifiConnected = false;
let m = false;
const video = document.getElementById("mainVideo");
let padMonitorInterval = null;

function debug(message) {
    console.log(`[DEBUG] ${message}`);
}
let graphData = [];
const fadeOut = (element, callback) => {
    $(element).fadeOut(500, callback);
};

// Load initial graph data
fetch('data.json')
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;  // Store complete data object
        graphData = jsonData.graphs;  // Store graphs array
        debug("Graph data loaded successfully");
        showGraphSelection();
         wifidata(false,2500); // no alert wifi check

    })
    .catch(error => {
        debug("Error loading graph data: " + error);
    });

function toggleMode(btn) {
    // Reset states first
    logDebugState('Toggle Mode Start');

    stopPadMonitoring();
    selectedGraphId = null;
    wifiConnected = false;
    padsEngaged = false;

    // Toggle mode
    isTrainingMode = !isTrainingMode;
    goBackToGraphSelection();
    debug(`Mode toggled to: ${isTrainingMode ? 'Training' : 'Presentation'}`);

    const sendDiv = document.querySelector('.send-div');
    $(sendDiv).fadeIn(500);

    if (isTrainingMode) {
        btn.textContent = "Training";
        initializeTrainingMode().then(() => {
            if (!wifiConnected) {
                debug("WiFi not connected, staying in Presentation mode");
                isTrainingMode = false;
                btn.textContent = "Presentation";
                document.querySelector(".wifi-indicator").style.color = "red";
            }
            fadeOut(sendDiv);
        });
    } else {
        btn.textContent = "Presentation";
        document.querySelector(".wifi-indicator").style.color = "red";
        debug("Presentation mode active - WiFi monitoring stopped");
        fadeOut(sendDiv);
        wifidata(false); // no alert wifi check
    }
    logDebugState('Toggle Mode End');
}


function stopPadMonitoring() {
    if (padMonitorInterval) {
        clearInterval(padMonitorInterval);
        padMonitorInterval = null;
        padsEngaged = false; // Reset pad state
    }
    debug("Pad monitoring stopped");

}


async function wifidata(showAlert = true, timeout = 3000) {
    debug("Checking WiFi connection");
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(WIFI_URL, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.text();
        debug(`Pad data received: ${data}`);

        const numericData = parseInt(data.trim());
        if (numericData === 0 || numericData === 1) {
            wifiConnected = true;
            document.querySelector(".wifi-indicator").style.color = "green";
            return numericData;
        } else {
            wifiConnected = false;
            document.querySelector(".wifi-indicator").style.color = "red";
            if (showAlert) alert("Invalid response from WiFi");
            return -1;
        }
    } catch (error) {
        wifiConnected = false;
        document.querySelector(".wifi-indicator").style.color = "red";
        if (showAlert) alert("Please connect to WiFi!");
        debug("WiFi connection failed:", error);
        return -1;
    }
}

async function initializeTrainingMode() {
    debug("Initializing training mode");
    const wifiStatus = await wifidata();

    if (wifiStatus !== -1) {
        startPadMonitoring();
    } else {
        debug("Failed to initialize training mode - no WiFi connection");
    }
}

function startPadMonitoring() {
    debug("Starting pad monitoring");
    if (padMonitorInterval) clearInterval(padMonitorInterval);

    let previousPadState = m;
    let previousVideoState = null;

    // First check WiFi connection
    wifidata().then(status => {
        if (status === -1) {
            stopPadMonitoring();
            return;
        }

        padMonitorInterval = setInterval(async () => {
            if (!isTrainingMode) {
                stopPadMonitoring();
                return;
            }

            try {
                const response = await fetch(WIFI_URL);
                const status = await response.text();
                debug(`Pad status received: ${status}`);
                
                const newPadState = parseInt(status.trim()) === 1;

                if (newPadState !== previousPadState) {
                    debug(`Pad state changed: ${previousPadState} → ${newPadState}`);
                    m = newPadState;
                    previousPadState = newPadState;
                    
                    if (selectedGraphId) {
                        const newVideoState = updateVideoSource(newPadState, previousVideoState);
                        previousVideoState = newVideoState;
                    }
                }
            } catch (error) {
                debug("WiFi connection lost");
                wifiConnected = false;
                document.querySelector(".wifi-indicator").style.color = "red";
                alert("WiFi connection lost. Please reconnect!");
                // =================================================================
                // stopPadMonitoring(); not sure could cause bugs later on maybe...
                // =================================================================
            }
        }, 1000);
    });
}

function updateVideoSource(padState, previousVideoState) {
    logDebugState('Video Source Update');

    const graph = graphData.find(g => g.id === selectedGraphId);
    if (!graph) return previousVideoState;

    const mainVideo = document.getElementById('mainVideo');
    const blankVideo = document.getElementById('blankVideo');

    // Set up main video if source changed
    if (mainVideo.src !== graph.videoPath) {
        mainVideo.src = graph.videoPath;
        mainVideo.loop = true;
        mainVideo.controls = false;

        mainVideo.load();
        mainVideo.play();
    }

  

    // Set initial display states
    mainVideo.controls = false;
    blankVideo.controls = false;
    // Only show the appropriate video
    if (padState) {
        blankVideo.style.display = 'none';

        mainVideo.style.display = 'block';
        mainVideo.muted = false;
        blankVideo.muted = true;

    } else {
        mainVideo.style.display = 'none';

        blankVideo.style.display = 'block';
        mainVideo.muted = true;
        blankVideo.muted = false;


    }

    return graph.videoPath;
}



let selectedGraphId = null;

function showGraphSelection() {
    debug("Showing graph selection screen.");
    const container = document.querySelector("#graph-selection .container");
    container.innerHTML = "";
    graphData.forEach((graph, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.id = `graph${index + 1}`;
        card.innerHTML = `

    <img class="thumbnail" src="${graph.thumbnail}" ></img>

    `;
        card.onclick = () => selectGraph(graph.id);
        container.appendChild(card);
    });
}







function selectGraph(graphId) {
    debug(`Graph ${graphId} selected.`);
    selectedGraphId = graphId;
    document.getElementById("video-player").style.display = "flex";
    document.getElementById("graph-selection").style.display = "none";

    const graph = graphData.find(g => g.id === selectedGraphId);
    if (!graph) return;

    const loader = $('.loader-div');
    loader.fadeIn(500);

    // Hide both videos initially
    const mainVideo = document.getElementById("mainVideo");
    const blankVideo = document.getElementById("blankVideo");
    mainVideo.style.display = "none";
    blankVideo.style.display = "none";

    if (isTrainingMode) {
        document.getElementById("video-title").style.display = "none";
        setTimeout(() => {
            const mainVideo = document.getElementById("mainVideo");
            updateVideoSource(m, video.src);
            document.getElementById("loading-message").style.display = "none";
        }, 500);
        fadeOut(loader);

    } else {
        $(document.getElementById("video-title")).fadeIn(500);
        document.getElementById("video-title").textContent = graph.name;
        fadeOut(loader);
        setTimeout(() => {
            mainVideo.src = graph.videoPath;
            mainVideo.controls = true;
            mainVideo.loop = true;
            mainVideo.muted = false;
            mainVideo.load();
            document.getElementById("loading-message").style.display = "none";
            mainVideo.style.display = "block";
            mainVideo.play();
        }, 500);
    }
}




function goBackToGraphSelection() {
    selectedGraphId = null;
    debug("Returning to graph selection.");
    video.pause();
    video.currentTime = 0;
    video.src = "";
    $('#video-player').fadeOut(500, () => {
        $('#video-player').fadeOut();
        $('#graph-selection').fadeIn();
        showGraphSelection();
    });
}







debug("Arrhythmia Simulator initialized");

video.addEventListener('error', function () {
    debug("Video error: " + (video.error ? video.error.message : 'unknown error'));
});

video.addEventListener('loadeddata', function () {
    debug("Video loaded successfully");
});


function logDebugState(location) {
    debug(`
=== Debug Log from ${location} ===
Video Details:
- Last Known Video: ${video.src}
- Last Pad State: ${m}
- Current Mode: ${isTrainingMode}
- Selected Graph: ${selectedGraphId}
Current Graph Info: ${JSON.stringify(graphData.find(g => g.id === selectedGraphId))}
===========================
`);
}