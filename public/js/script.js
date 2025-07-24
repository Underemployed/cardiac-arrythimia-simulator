let data = 0;
let WIFI_URL = "http://192.168.4.1";
// ================================================================
// ================================================================
// ================================================================
WIFI_URL = "http://192.168.1.2:5000/"; // test
// ===============================================================
// ===============================================================
// ===============================================================
let isTrainingMode = false;
let wifiConnected = false;
let m = false;
const video = document.getElementById("mainVideo");
let padMonitorInterval = null;

// Global variables to track video state
let currentActiveVideo = null;
let isVideoManuallyPaused = false;


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
                showGraphSelection();
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
            if (!isTrainingMode || isVideoManuallyPaused) {
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
        isVideoManuallyPaused = false; // Reset pause state when loading new video
    }

    // Set initial display states
    mainVideo.controls = false;
    blankVideo.controls = false;

    // Only show the appropriate video and respect manual pause state
    if (padState) {
        blankVideo.style.display = 'none';
        mainVideo.style.display = 'block';
        mainVideo.muted = false;
        blankVideo.muted = true;
        currentActiveVideo = mainVideo;

        // Only auto-play if not manually paused
        if (!isVideoManuallyPaused && mainVideo.paused) {
            mainVideo.play();
        } else if (isVideoManuallyPaused && !mainVideo.paused) {
            mainVideo.pause();
        }
    } else {
        mainVideo.style.display = 'none';
        blankVideo.style.display = 'block';
        mainVideo.muted = true;
        blankVideo.muted = false;
        currentActiveVideo = blankVideo;

        // Only auto-play if not manually paused
        if (!isVideoManuallyPaused && blankVideo.paused) {
            blankVideo.play();
        } else if (isVideoManuallyPaused && !blankVideo.paused) {
            blankVideo.pause();
        }
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
        
        // Show title only in presentation mode, show key in training mode
        if (isTrainingMode) {
            const displayChar = getVideoDisplayChar(index);
            card.innerHTML = `
                <div class="thumbnail">
                    <div class="training-number">${displayChar}</div>
                     <!-- <div class="training-hint">Press ${displayChar}</div> -->
                </div>`;
        } else {
            card.innerHTML = `
                <div class="thumbnail">${graph.name}</div>`;
        }
        
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
            currentActiveVideo = mainVideo;
            isVideoManuallyPaused = false;
        }, 500);
    }
}




function goBackToGraphSelection() {
    selectedGraphId = null;
    debug("Returning to graph selection.");
    video.pause();
    video.currentTime = 0;
    video.src = "";
    currentActiveVideo = null;
    isVideoManuallyPaused = false; 
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
//     debug(`
// === Debug Log from ${location} ===
// Video Details:
// - Last Known Video: ${video.src}
// - Last Pad State: ${m}
// - Current Mode: ${isTrainingMode}
// - Selected Graph: ${selectedGraphId}
// Current Graph Info: ${JSON.stringify(graphData.find(g => g.id === selectedGraphId))}
// ===========================
    // `);
    
}

// window.addEventListener('resize', () => {
//     var w = window.innerWidth;
//     debug(`Window width changed: ${w}`);
// });




//  video shit
// Function to get the currently visible/active video
function getCurrentActiveVideo() {
    const mainVideo = document.getElementById('mainVideo');
    const blankVideo = document.getElementById('blankVideo');

    if (mainVideo.style.display !== 'none' && mainVideo.src) {
        return mainVideo;
    } else if (blankVideo.style.display !== 'none' && blankVideo.src) {
        return blankVideo;
    }
    return null;
}



// Function to toggle play/pause on the active video
function toggleVideoPlayPause() {
    const activeVideo = getCurrentActiveVideo();

    if (!activeVideo && isTrainingMode && selectedGraphId && !isVideoManuallyPaused) {
        debug("No active video found to pause/play");
        debug("Video paused  EMPTY");

        isVideoManuallyPaused = true;
        stopPadMonitoring();
        return;
    }
    if (!activeVideo && isTrainingMode && selectedGraphId && isVideoManuallyPaused) {
        isVideoManuallyPaused = false;
        startPadMonitoring();
        debug("Video resumed EMPTY");
        return;
    }

    if (activeVideo.paused) {
        activeVideo.play();
        isVideoManuallyPaused = false;
        if (isTrainingMode) startPadMonitoring();
        debug("Video resumed");
    } else {
        activeVideo.pause();
        isVideoManuallyPaused = true;
        debug("Video paused");
    }
}


document.addEventListener('keydown', function (event) {
    // Handle spacebar for video pause/play
    if (event.code === 'Space' || event.keyCode === 32) {
        event.preventDefault();
        if (selectedGraphId) {
            toggleVideoPlayPause();
        }
        return;
    }

    // Handle keyboard keys for video selection in training mode
    if (isTrainingMode && selectedGraphId === null) {
        // event.preventDefault();
        handleKeyboardSelection(event.code || event.key);
    }
});




// Function to get the display character for a video index
function getVideoDisplayChar(index) {
    if (index < 10) {
        return (index + 1).toString(); // Numbers 1-9, 0
    } else {
        return String.fromCharCode(65 + (index - 10)); // Letters A-Z
    }
}

function handleKeyboardSelection(keyPressed) {
    // Only work in training mode and when on graph selection screen
    if (!isTrainingMode || selectedGraphId !== null) {
        return;
    }

    let videoIndex = -1;

    // Map keyboard keys to video indices (supports up to 36 videos)
    switch (keyPressed.toUpperCase()) {
        // Numbers 1-9 (videos 1-9)
        case '1':
        case 'DIGIT1':
        case 'NUMPAD1':
            videoIndex = 0;
            break;
        case '2':
        case 'DIGIT2':
        case 'NUMPAD2':
            videoIndex = 1;
            break;
        case '3':
        case 'DIGIT3':
        case 'NUMPAD3':
            videoIndex = 2;
            break;
        case '4':
        case 'DIGIT4':
        case 'NUMPAD4':
            videoIndex = 3;
            break;
        case '5':
        case 'DIGIT5':
        case 'NUMPAD5':
            videoIndex = 4;
            break;
        case '6':
        case 'DIGIT6':
        case 'NUMPAD6':
            videoIndex = 5;
            break;
        case '7':
        case 'DIGIT7':
        case 'NUMPAD7':
            videoIndex = 6;
            break;
        case '8':
        case 'DIGIT8':
        case 'NUMPAD8':
            videoIndex = 7;
            break;
        case '9':
        case 'DIGIT9':
        case 'NUMPAD9':
            videoIndex = 8;
            break;
        case '0':
        case 'DIGIT0':
        case 'NUMPAD0':
            videoIndex = 9;
            break;
        // Letters A-Z (videos 11-36)
        case 'A':
        case 'DIGITA':
        case 'KEYA':
            videoIndex = 10;
            break;
        case 'B':
        case 'KEYB':
            videoIndex = 11;
            break;
        case 'C':
        case 'KEYC':
            videoIndex = 12;
            break;
        case 'D':
        case 'KEYD':
            videoIndex = 13;
            break;
        case 'E':
        case 'KEYE':
            videoIndex = 14;
            break;
        case 'F':
        case 'KEYF':
            videoIndex = 15;
            break;
        case 'G':
        case 'KEYG':
            videoIndex = 16;
            break;
        case 'H':
        case 'KEYH':
            videoIndex = 17;
            break;
        case 'I':
        case 'KEYI':
            videoIndex = 18;
            break;
        case 'J':
        case 'KEYJ':
            videoIndex = 19;
            break;
        case 'K':
        case 'KEYK':
            videoIndex = 20;
            break;
        case 'L':
        case 'KEYL':
            videoIndex = 21;
            break;
        case 'M':
        case 'KEYM':
            videoIndex = 22;
            break;
        case 'N':
        case 'KEYN':
            videoIndex = 23;
            break;
        case 'O':
        case 'KEYO':
            videoIndex = 24;
            break;
        case 'P':
        case 'KEYP':
            videoIndex = 25;
            break;
        case 'Q':
        case 'KEYQ':
            videoIndex = 26;
            break;
        case 'R':
        case 'KEYR':
            videoIndex = 27;
            break;
        case 'S':
        case 'KEYS':
            videoIndex = 28;
            break;
        case 'T':
        case 'KEYT':
            videoIndex = 29;
            break;
        case 'U':
        case 'KEYU':
            videoIndex = 30;
            break;
        case 'V':
        case 'KEYV':
            videoIndex = 31;
            break;
        case 'W':
        case 'KEYW':
            videoIndex = 32;
            break;
        case 'X':
        case 'KEYX':
            videoIndex = 33;
            break;
        case 'Y':
        case 'KEYY':
            videoIndex = 34;
            break;
        case 'Z':
        case 'KEYZ':
            videoIndex = 35;
            break;
        default:
            return; // Invalid key
    }

    // Check if the video index exists
    if (videoIndex >= 0 && videoIndex < graphData.length) {
        const selectedGraph = graphData[videoIndex];
        debug(`Keyboard selection: Key ${keyPressed} -> Video ${videoIndex + 1} (${selectedGraph.name})`);
        selectGraph(selectedGraph.id);
    } else {
        debug(`Invalid keyboard selection: Key ${keyPressed} -> Index ${videoIndex} (out of range)`);
    }
}



const trainingModeStyles = `
<style>
.training-number {
    font-size: 3em;
    font-weight: bold;
    color:rgba(242, 242, 242, 0.61);
    margin-bottom: 10px;
}

.training-hint {
    font-size: 0.9em;
    color: #666;
    font-style: italic;
}

.card .thumbnail {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
}
</style>
`;



if (!document.querySelector('#training-mode-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'training-mode-styles';
    styleElement.innerHTML = trainingModeStyles;
    document.head.appendChild(styleElement);
}