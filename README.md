# Arrhythmia Training Simulator

A medical training tool for teaching arrhythmia diagnosis using simulated ECG patterns. This simulator was designed specifically for medical students to practice arrhythmia diagnosis in a controlled environment.

## Download

Get the latest installer from the [Releases page](https://github.com/nithilprasad/Arryhthmia_simulator/releases).



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

# Run WiFi simulator
python wifi.py

# Start the application
npm start


# Generate installer (outputs to dist folder)
npm run build
```

## Usage
1. Connect to the wifi or the simulator
2. Launch application
3. Choose training or presentation mode
4. For training mode:
    - Connect both pads to see ECG patterns
    - The title of arrythimia pattern are hidden in training mode
5. Press `CTRL+M` to toggle audio
6. Use `SPACEBAR` to pause/resume ECG patterns
7. Press `CTRL+F` to toggle fullscreen mode 
8. `ESC` to return to graph selection



## Hardware Details
- ESP for WiFi communication
- Pressure pads embedded in mannequin
- Binary signal processing for real-time feedback
- Purpose-built medical simulation training tool
- Designed for hands-on clinical education

## Technical Notes
- WiFi communication uses binary signals (0/1)
- Default simulator IP: 192.168.4.1 can be updated in `public/src/script.js`
- Developed for Bio Medical Technology Wing SCTIMST



