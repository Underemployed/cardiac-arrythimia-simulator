from flask import Flask
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

# Simulate pad state
pad_state = 0
last_toggle = time.time()

@app.route('/')
def get_pad_state():
    global pad_state, last_toggle
    
    # Toggle state every 5 seconds for testing
    current_time = time.time()
    if current_time - last_toggle > 5:
        pad_state = 1 if pad_state == 0 else 0
        last_toggle = current_time
    
    return str(pad_state)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
