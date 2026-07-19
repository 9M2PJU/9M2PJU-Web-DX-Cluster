from webapp import app, socketio, start_background_services

# Eventlet is ultra-efficient for Raspberry Pi and supports native WebSockets
start_background_services()
socketio.run(app, host="0.0.0.0", port=8080, log_output=True)
