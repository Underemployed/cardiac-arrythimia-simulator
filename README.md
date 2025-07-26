# Arrhythmia Training Simulator

A medical training tool for teaching arrhythmia diagnosis using simulated ECG patterns.

## Features
- Training mode with real-time ECG simulation
- Presentation mode for instructor demonstrations 
- Interactive pad-based learning system
- WiFi-enabled connectivity
- Video library of arrhythmia patterns

## Prerequisites
- Electron.js
- Python 3.x
- ESP12E
- WiFi connection to simulator device (Default: http://192.168.4.1)

## Setup & Installation
```bash
# Install dependencies
pip install -r req.txt
npm install

# Start the application
npm start

# Run WiFi simulator
python wifi.py

# Generate installer (outputs to dist folder)
npm run build
```

## Usage
1. Connect to the wifi of the simulator
2. Launch application
3. Choose training or presentation mode
4. For training mode:
    - Connect both pads to see ECG patterns
    - The title of arrythimia pattern are hidden in training mode
5. Use `SPACEBAR` to pause/resume ECG patterns
6. Press `CTRL+M` to toggle audio
7. `ESC` to return to graph selection.

HW uses esp + pressure pads hidden inside the manquin ..
this was creared for the sole purpose of training medical students using a simulation tool

## Technical Notes
- WiFi communication uses binary signals (0/1)
- Default simulator IP: 192.168.4.1 can be updated in `public/src/script.js`
- Developed for Bio Medical Technology Wing SCTIMST.


