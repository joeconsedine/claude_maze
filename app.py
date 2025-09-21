from flask import Flask, render_template, jsonify, request
import json
import time
import os
import threading
import logging
from datetime import datetime

# Configure detailed logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class SlideController:
    def __init__(self):
        self.current_slide = 0
        self.lock = threading.Lock()
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

slide_controller = SlideController()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/control')
def control():
    return render_template('control.html')

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)