from flask import Flask, render_template, jsonify, request
import json
import time
import os
import threading
import logging
from datetime import datetime
from livekit import api
import jwt

# Configure detailed logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class SlideController:
    def __init__(self):
        self.current_slide = 0
        self.lock = threading.Lock()
        self.laser_points = []  # Store active laser points
        self.laser_active = False
        self.last_laser_update = time.time()

        # Video streaming state
        self.video_active = False
        self.video_url = ""
        self.video_type = "none"  # none, youtube, vimeo, twitch, webcam, jitsi
        self.webcam_room_id = ""

        logger.info(f"🔧 SlideController initialized - starting at slide {self.current_slide}")
        self.slides = [
            {
                'id': 'line_chart',
                'title': 'Line Chart',
                'chart_type': 'line',
                'data': {
                    'xAxis': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    'series': [820, 932, 901, 934, 1290, 1330, 1320]
                }
            },
            {
                'id': 'bar_chart',
                'title': 'Bar Chart',
                'chart_type': 'bar',
                'data': {
                    'xAxis': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    'series': [120, 200, 150, 80, 70, 110]
                }
            },
            {
                'id': 'pie_chart',
                'title': 'Pie Chart',
                'chart_type': 'pie',
                'data': [
                    {'value': 1048, 'name': 'Search Engine'},
                    {'value': 735, 'name': 'Direct'},
                    {'value': 580, 'name': 'Email'},
                    {'value': 484, 'name': 'Union Ads'},
                    {'value': 300, 'name': 'Video Ads'}
                ]
            },
            {
                'id': 'scatter_chart',
                'title': 'Scatter Plot',
                'chart_type': 'scatter',
                'data': [
                    [10.0, 8.04], [8.0, 6.95], [13.0, 7.58], [9.0, 8.81],
                    [11.0, 8.33], [14.0, 9.96], [6.0, 7.24], [4.0, 4.26]
                ]
            }
        ]

    def get_current_slide(self):
        with self.lock:
            slide = self.slides[self.current_slide]
            logger.info(f"📖 GET_CURRENT_SLIDE: Returning slide {self.current_slide} - {slide['title']} (ID: {slide['id']})")
            return slide

    def next_slide(self):
        with self.lock:
            old_slide = self.current_slide
            if self.current_slide < len(self.slides) - 1:
                self.current_slide += 1
            else:
                self.current_slide = 0
            slide = self.slides[self.current_slide]
            logger.warning(f"⏭️ NEXT_SLIDE CALLED: {old_slide} → {self.current_slide} - Now showing: {slide['title']}")
            return slide

    def previous_slide(self):
        with self.lock:
            old_slide = self.current_slide
            if self.current_slide > 0:
                self.current_slide -= 1
            else:
                self.current_slide = len(self.slides) - 1
            slide = self.slides[self.current_slide]
            logger.warning(f"⏮️ PREVIOUS_SLIDE CALLED: {old_slide} → {self.current_slide} - Now showing: {slide['title']}")
            return slide

    def goto_slide(self, index):
        with self.lock:
            old_slide = self.current_slide
            if 0 <= index < len(self.slides):
                self.current_slide = index
            slide = self.slides[self.current_slide]
            logger.warning(f"🎯 GOTO_SLIDE CALLED: {old_slide} → {self.current_slide} (requested: {index}) - Now showing: {slide['title']}")
            return slide

    def add_laser_point(self, x, y, intensity, container_width, container_height):
        with self.lock:
            current_time = time.time()
            # Remove old points (older than 5 seconds)
            self.laser_points = [p for p in self.laser_points if current_time - p['timestamp'] < 5]

            # Add new point
            self.laser_points.append({
                'x': x,
                'y': y,
                'intensity': intensity,
                'container_width': container_width,
                'container_height': container_height,
                'timestamp': current_time
            })
            self.last_laser_update = current_time
            logger.debug(f"🔴 Added laser point: ({x}, {y}) - Total points: {len(self.laser_points)}")

    def get_laser_points(self):
        with self.lock:
            current_time = time.time()
            # Remove old points
            self.laser_points = [p for p in self.laser_points if current_time - p['timestamp'] < 5]
            return {
                'points': self.laser_points,
                'active': self.laser_active,
                'last_update': self.last_laser_update
            }

    def set_laser_active(self, active):
        with self.lock:
            self.laser_active = active
            if not active:
                self.laser_points = []  # Clear points when deactivated
            self.last_laser_update = time.time()
            logger.info(f"🔴 Laser set to: {'ON' if active else 'OFF'}")

    def clear_laser_points(self):
        with self.lock:
            self.laser_points = []
            self.last_laser_update = time.time()
            logger.info("🧹 Laser points cleared")

    def set_video_stream(self, video_type, video_url="", room_id=""):
        with self.lock:
            self.video_type = video_type
            self.video_url = video_url
            self.webcam_room_id = room_id
            self.video_active = video_type != "none"
            logger.info(f"📹 Video stream set: {video_type} - URL: {video_url} - Room: {room_id}")

    def get_video_state(self):
        with self.lock:
            return {
                'active': self.video_active,
                'type': self.video_type,
                'url': self.video_url,
                'room_id': self.webcam_room_id
            }

    def stop_video_stream(self):
        with self.lock:
            self.video_active = False
            self.video_type = "none"
            self.video_url = ""
            self.webcam_room_id = ""
            logger.info("📹 Video stream stopped")

slide_controller = SlideController()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/control')
def control():
    return render_template('control.html')

@app.route('/webcam-test')
def webcam_test():
    return render_template('webcam_test.html')

@app.route('/presenter')
def presenter():
    return render_template('presenter.html')

@app.route('/viewer')
def viewer():
    return render_template('viewer.html')

@app.route('/api/current-slide')
def current_slide():
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
    user_agent = request.environ.get('HTTP_USER_AGENT', 'Unknown')
    referer = request.environ.get('HTTP_REFERER', 'No referer')
    logger.info(f"📡 API/CURRENT-SLIDE called by {client_ip} - UA: {user_agent[:50]}... - Referer: {referer}")
    return jsonify(slide_controller.get_current_slide())

@app.route('/api/slides')
def get_slides():
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
    logger.info(f"📊 API/SLIDES called by {client_ip}")
    return jsonify({
        'slides': slide_controller.slides,
        'current_index': slide_controller.current_slide,
        'total': len(slide_controller.slides)
    })

@app.route('/api/next-slide')
def next_slide():
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
    user_agent = request.environ.get('HTTP_USER_AGENT', 'Unknown')
    referer = request.environ.get('HTTP_REFERER', 'No referer')
    logger.error(f"🚨 API/NEXT-SLIDE CALLED! IP: {client_ip} - UA: {user_agent[:50]}... - Referer: {referer}")
    return jsonify(slide_controller.next_slide())

@app.route('/api/previous-slide')
def previous_slide():
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
    user_agent = request.environ.get('HTTP_USER_AGENT', 'Unknown')
    referer = request.environ.get('HTTP_REFERER', 'No referer')
    logger.error(f"🚨 API/PREVIOUS-SLIDE CALLED! IP: {client_ip} - UA: {user_agent[:50]}... - Referer: {referer}")
    return jsonify(slide_controller.previous_slide())

@app.route('/api/goto-slide/<int:index>')
def goto_slide(index):
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
    user_agent = request.environ.get('HTTP_USER_AGENT', 'Unknown')
    referer = request.environ.get('HTTP_REFERER', 'No referer')
    logger.error(f"🚨 API/GOTO-SLIDE CALLED! Index: {index} - IP: {client_ip} - UA: {user_agent[:50]}... - Referer: {referer}")
    return jsonify(slide_controller.goto_slide(index))

# Laser overlay API endpoints
@app.route('/api/laser/point', methods=['POST'])
def add_laser_point():
    try:
        data = request.get_json()
        slide_controller.add_laser_point(
            data['x'],
            data['y'],
            data.get('intensity', 1.0),
            data.get('container_width', 800),
            data.get('container_height', 600)
        )
        return jsonify({'status': 'success'})
    except Exception as e:
        logger.error(f"Error adding laser point: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/laser/points')
def get_laser_points():
    return jsonify(slide_controller.get_laser_points())

@app.route('/api/laser/active', methods=['POST'])
def set_laser_active():
    try:
        data = request.get_json()
        slide_controller.set_laser_active(data.get('active', False))
        return jsonify({'status': 'success'})
    except Exception as e:
        logger.error(f"Error setting laser active: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/laser/clear', methods=['POST'])
def clear_laser_points():
    slide_controller.clear_laser_points()
    return jsonify({'status': 'success'})

# Video streaming API endpoints
@app.route('/api/video/start', methods=['POST'])
def start_video_stream():
    try:
        data = request.get_json()
        video_type = data.get('type', 'none')
        video_url = data.get('url', '')
        room_id = data.get('room_id', '')

        # Generate room ID for webcam if not provided
        if video_type == 'webcam' and not room_id:
            import uuid
            room_id = str(uuid.uuid4())[:8]

        slide_controller.set_video_stream(video_type, video_url, room_id)
        return jsonify({
            'status': 'success',
            'video_state': slide_controller.get_video_state()
        })
    except Exception as e:
        logger.error(f"Error starting video stream: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/video/stop', methods=['POST'])
def stop_video_stream():
    slide_controller.stop_video_stream()
    return jsonify({'status': 'success'})

@app.route('/api/video/state')
def get_video_state():
    return jsonify(slide_controller.get_video_state())

# LiveKit token generation endpoint
@app.route('/api/token', methods=['POST'])
def generate_livekit_token():
    try:
        data = request.get_json()
        room_name = data.get('room', 'presentation-room')
        participant_name = data.get('identity', f'user-{int(time.time())}')

        # Get LiveKit credentials from environment
        api_key = os.environ.get('LIVEKIT_API_KEY')
        api_secret = os.environ.get('LIVEKIT_API_SECRET')

        if not api_key or not api_secret:
            return jsonify({'error': 'LiveKit credentials not configured'}), 500

        # Create access token
        token = api.AccessToken(api_key, api_secret) \
            .with_identity(participant_name) \
            .with_name(participant_name) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True
            ))

        jwt_token = token.to_jwt()
        livekit_url = os.environ.get('LIVEKIT_URL', 'wss://localhost:7880')

        logger.info(f"🎟️ Generated LiveKit token for {participant_name} in room {room_name}")

        return jsonify({
            'token': jwt_token,
            'url': livekit_url,
            'room': room_name,
            'identity': participant_name
        })

    except Exception as e:
        logger.error(f"Error generating LiveKit token: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)