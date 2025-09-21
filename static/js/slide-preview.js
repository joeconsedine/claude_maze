class SlidePreview {
    constructor(containerElement) {
        this.container = containerElement;
        this.previewElement = null;
        this.chartInstance = null;
        this.currentSlideData = null;
        this.laserOverlay = null;
        this.isLaserActive = false;

        this.init();
    }

    init() {
        this.createPreviewContainer();
        this.setupLaserOverlay();
        this.loadCurrentSlide();
        this.startPolling();
    }

    createPreviewContainer() {
        this.previewElement = document.createElement('div');
        this.previewElement.className = 'slide-preview-container';
        this.previewElement.innerHTML = `
            <div class="preview-header">
                <h3>Live Slide Preview</h3>
                <div class="preview-controls">
                    <button class="laser-toggle-btn" id="laser-toggle">🔴 Laser Off</button>
                    <button class="video-toggle-btn" id="video-toggle">📹 Video Off</button>
                </div>
            </div>
            <div class="preview-content">
                <div class="preview-chart" id="preview-chart"></div>
                <div class="preview-title" id="preview-title">Loading...</div>
            </div>
            <div class="video-controls-panel" id="video-controls-panel">
                <div class="video-control-group">
                    <label for="video-type">Video Source</label>
                    <select id="video-type">
                        <option value="none">No Video</option>
                        <option value="youtube">YouTube</option>
                        <option value="vimeo">Vimeo</option>
                        <option value="twitch">Twitch Live</option>
                        <option value="webcam">Webcam Stream</option>
                        <option value="jitsi">Jitsi Meet</option>
                    </select>
                </div>
                <div class="video-control-group" id="url-group">
                    <label for="video-url">Video URL</label>
                    <input type="text" id="video-url" placeholder="Enter YouTube, Vimeo, or Twitch URL">
                </div>
                <div class="video-control-group" id="room-group" style="display: none;">
                    <label for="room-id">Room ID</label>
                    <input type="text" id="room-id" placeholder="Enter room ID (optional for webcam)">
                </div>
                <div>
                    <button class="video-action-btn" id="start-video">Start Video</button>
                    <button class="video-action-btn stop" id="stop-video">Stop Video</button>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .slide-preview-container {
                background: #1f1f1f;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                border: 2px solid #333;
                position: relative;
                overflow: hidden;
            }

            .preview-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .preview-header h3 {
                color: #fff;
                margin: 0;
                font-size: 18px;
            }

            .laser-toggle-btn {
                background: #333;
                color: #fff;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }

            .laser-toggle-btn:hover {
                background: #555;
            }

            .laser-toggle-btn.active {
                background: #ff4444;
                box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
            }

            .video-toggle-btn {
                background: #333;
                color: #fff;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
                margin-left: 10px;
            }

            .video-toggle-btn:hover {
                background: #555;
            }

            .video-toggle-btn.active {
                background: #44aa44;
                box-shadow: 0 0 10px rgba(68, 170, 68, 0.5);
            }

            .video-controls-panel {
                background: #2a2a2a;
                border-radius: 8px;
                padding: 15px;
                margin-top: 15px;
                border: 1px solid #444;
                display: none;
            }

            .video-controls-panel.active {
                display: block;
            }

            .video-control-group {
                margin-bottom: 15px;
            }

            .video-control-group label {
                color: #fff;
                display: block;
                margin-bottom: 5px;
                font-size: 14px;
            }

            .video-control-group select,
            .video-control-group input {
                width: 100%;
                padding: 8px;
                border: 1px solid #555;
                border-radius: 4px;
                background: #333;
                color: #fff;
                font-size: 14px;
            }

            .video-action-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                margin-right: 10px;
                margin-bottom: 10px;
            }

            .video-action-btn:hover {
                background: #0056b3;
            }

            .video-action-btn.stop {
                background: #dc3545;
            }

            .video-action-btn.stop:hover {
                background: #c82333;
            }

            .preview-content {
                position: relative;
                background: #2a2a2a;
                border-radius: 8px;
                padding: 20px;
                min-height: 300px;
                border: 1px solid #444;
            }

            .preview-chart {
                width: 100%;
                height: 250px;
                margin-bottom: 15px;
            }

            .preview-title {
                color: #fff;
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 6px;
            }

            @media (max-width: 768px) {
                .slide-preview-container {
                    margin: 15px 0;
                    padding: 15px;
                }

                .preview-chart {
                    height: 200px;
                }

                .preview-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }
            }
        `;
        document.head.appendChild(style);

        this.container.appendChild(this.previewElement);

        // Initialize chart
        this.initChart();
        this.setupLaserToggle();
        this.setupVideoControls();
    }

    initChart() {
        const chartElement = this.previewElement.querySelector('#preview-chart');
        this.chartInstance = echarts.init(chartElement, 'dark', {
            renderer: 'canvas',
            useDirtyRect: false
        });

        // Handle resize
        new ResizeObserver(() => {
            if (this.chartInstance) {
                this.chartInstance.resize();
            }
        }).observe(chartElement);
    }

    setupLaserOverlay() {
        const previewContent = this.previewElement.querySelector('.preview-content');
        this.laserOverlay = new LaserOverlay(previewContent);
        this.laserOverlay.setColor('#ff4444', '#ff6666'); // Red laser for controller

        // Override laser overlay to send points to API
        const originalAddLaserPoint = this.laserOverlay.addLaserPoint.bind(this.laserOverlay);
        this.laserOverlay.addLaserPoint = (x, y, intensity) => {
            // Call original method to show locally
            originalAddLaserPoint(x, y, intensity);

            // Send to server if laser is active
            if (this.isLaserActive) {
                this.sendLaserPoint(x, y, intensity);
            }
        };
    }

    async sendLaserPoint(x, y, intensity) {
        try {
            const containerRect = this.previewElement.querySelector('.preview-content').getBoundingClientRect();

            await fetch('/api/laser/point', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    x: x,
                    y: y,
                    intensity: intensity,
                    container_width: containerRect.width,
                    container_height: containerRect.height,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.error('Error sending laser point:', error);
        }
    }

    setupLaserToggle() {
        const toggleBtn = this.previewElement.querySelector('#laser-toggle');

        toggleBtn.addEventListener('click', () => {
            this.isLaserActive = !this.isLaserActive;

            if (this.isLaserActive) {
                toggleBtn.textContent = '🔴 Laser On';
                toggleBtn.classList.add('active');
                this.laserOverlay.container.style.pointerEvents = 'auto';
                this.setLaserActiveOnServer(true);
            } else {
                toggleBtn.textContent = '🔴 Laser Off';
                toggleBtn.classList.remove('active');
                this.laserOverlay.container.style.pointerEvents = 'none';
                this.laserOverlay.laserTrails = []; // Clear existing trails
                this.setLaserActiveOnServer(false);
                this.clearLaserPointsOnServer();
            }
        });
    }

    async setLaserActiveOnServer(active) {
        try {
            await fetch('/api/laser/active', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ active: active })
            });
        } catch (error) {
            console.error('Error setting laser active on server:', error);
        }
    }

    async clearLaserPointsOnServer() {
        try {
            await fetch('/api/laser/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        } catch (error) {
            console.error('Error clearing laser points on server:', error);
        }
    }

    setupVideoControls() {
        const videoToggleBtn = this.previewElement.querySelector('#video-toggle');
        const videoControlsPanel = this.previewElement.querySelector('#video-controls-panel');
        const videoTypeSelect = this.previewElement.querySelector('#video-type');
        const urlGroup = this.previewElement.querySelector('#url-group');
        const roomGroup = this.previewElement.querySelector('#room-group');
        const startVideoBtn = this.previewElement.querySelector('#start-video');
        const stopVideoBtn = this.previewElement.querySelector('#stop-video');

        // Toggle video controls panel
        videoToggleBtn.addEventListener('click', () => {
            const isActive = videoControlsPanel.classList.toggle('active');
            videoToggleBtn.textContent = isActive ? '📹 Video On' : '📹 Video Off';
            videoToggleBtn.classList.toggle('active', isActive);
        });

        // Update form fields based on video type
        videoTypeSelect.addEventListener('change', () => {
            const videoType = videoTypeSelect.value;

            if (videoType === 'webcam' || videoType === 'jitsi') {
                urlGroup.style.display = 'none';
                roomGroup.style.display = 'block';

                if (videoType === 'webcam') {
                    this.previewElement.querySelector('#room-id').placeholder = 'Room ID (auto-generated if empty)';
                } else {
                    this.previewElement.querySelector('#room-id').placeholder = 'Jitsi room name';
                }
            } else if (videoType === 'none') {
                urlGroup.style.display = 'none';
                roomGroup.style.display = 'none';
            } else {
                urlGroup.style.display = 'block';
                roomGroup.style.display = 'none';

                const urlInput = this.previewElement.querySelector('#video-url');
                switch (videoType) {
                    case 'youtube':
                        urlInput.placeholder = 'Enter YouTube URL (e.g., https://youtube.com/watch?v=...)';
                        break;
                    case 'vimeo':
                        urlInput.placeholder = 'Enter Vimeo URL (e.g., https://vimeo.com/123456789)';
                        break;
                    case 'twitch':
                        urlInput.placeholder = 'Enter Twitch channel URL (e.g., https://twitch.tv/username)';
                        break;
                }
            }
        });

        // Start video stream
        startVideoBtn.addEventListener('click', () => {
            this.startVideoStream();
        });

        // Stop video stream
        stopVideoBtn.addEventListener('click', () => {
            this.stopVideoStream();
        });
    }

    async startVideoStream() {
        try {
            const videoType = this.previewElement.querySelector('#video-type').value;
            const videoUrl = this.previewElement.querySelector('#video-url').value;
            const roomId = this.previewElement.querySelector('#room-id').value;

            if (videoType === 'none') {
                alert('Please select a video source type');
                return;
            }

            if ((videoType === 'youtube' || videoType === 'vimeo' || videoType === 'twitch') && !videoUrl) {
                alert('Please enter a video URL');
                return;
            }

            if (videoType === 'jitsi' && !roomId) {
                alert('Please enter a Jitsi room name');
                return;
            }

            const response = await fetch('/api/video/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: videoType,
                    url: videoUrl,
                    room_id: roomId
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                console.log('Video stream started:', result.video_state);

                // Update UI to show active state
                const videoToggleBtn = this.previewElement.querySelector('#video-toggle');
                videoToggleBtn.textContent = '📹 Video Active';
                videoToggleBtn.classList.add('active');

                // Show generated room ID for webcam
                if (videoType === 'webcam' && result.video_state.room_id) {
                    this.previewElement.querySelector('#room-id').value = result.video_state.room_id;
                    alert(`Webcam room created: ${result.video_state.room_id}`);
                }
            } else {
                alert('Error starting video: ' + result.message);
            }
        } catch (error) {
            console.error('Error starting video stream:', error);
            alert('Error starting video stream');
        }
    }

    async stopVideoStream() {
        try {
            const response = await fetch('/api/video/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            if (result.status === 'success') {
                console.log('Video stream stopped');

                // Update UI to show inactive state
                const videoToggleBtn = this.previewElement.querySelector('#video-toggle');
                videoToggleBtn.textContent = '📹 Video Off';
                videoToggleBtn.classList.remove('active');
            }
        } catch (error) {
            console.error('Error stopping video stream:', error);
            alert('Error stopping video stream');
        }
    }


    async loadCurrentSlide() {
        try {
            const response = await fetch('/api/current-slide');
            const slideData = await response.json();

            // Only update if slide actually changed
            if (!this.currentSlideData || this.currentSlideData.id !== slideData.id) {
                this.currentSlideData = slideData;
                this.renderSlide(slideData);
            }
        } catch (error) {
            console.error('Error loading current slide for preview:', error);
        }
    }

    renderSlide(slideData) {
        const titleElement = this.previewElement.querySelector('#preview-title');
        titleElement.textContent = slideData.title;

        if (!this.chartInstance) return;

        this.chartInstance.clear();

        const baseOption = {
            animation: false, // Disable animations for preview
            textStyle: {
                fontSize: 12
            },
            title: {
                show: false // Hide title in preview as it's shown separately
            }
        };

        let option = {};

        switch(slideData.chart_type) {
            case 'line':
                option = {
                    ...baseOption,
                    tooltip: { trigger: 'axis' },
                    xAxis: {
                        type: 'category',
                        data: slideData.data.xAxis,
                        axisLabel: { fontSize: 10 }
                    },
                    yAxis: {
                        type: 'value',
                        axisLabel: { fontSize: 10 }
                    },
                    series: [{
                        data: slideData.data.series,
                        type: 'line',
                        smooth: true,
                        lineStyle: { width: 2 },
                        itemStyle: { borderWidth: 1 }
                    }]
                };
                break;

            case 'bar':
                option = {
                    ...baseOption,
                    tooltip: { trigger: 'axis' },
                    xAxis: {
                        type: 'category',
                        data: slideData.data.xAxis,
                        axisLabel: { fontSize: 10 }
                    },
                    yAxis: {
                        type: 'value',
                        axisLabel: { fontSize: 10 }
                    },
                    series: [{
                        data: slideData.data.series,
                        type: 'bar',
                        itemStyle: {
                            borderRadius: [2, 2, 0, 0],
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#83bff6' },
                                { offset: 1, color: '#188df0' }
                            ])
                        }
                    }]
                };
                break;

            case 'pie':
                option = {
                    ...baseOption,
                    tooltip: {
                        trigger: 'item',
                        formatter: '{b}: {c} ({d}%)'
                    },
                    legend: {
                        orient: 'horizontal',
                        bottom: 0,
                        textStyle: { fontSize: 10 }
                    },
                    series: [{
                        type: 'pie',
                        radius: '60%',
                        center: ['50%', '45%'],
                        data: slideData.data
                    }]
                };
                break;

            case 'scatter':
                option = {
                    ...baseOption,
                    tooltip: {
                        trigger: 'item',
                        formatter: 'X: {c[0]}<br/>Y: {c[1]}'
                    },
                    xAxis: {
                        type: 'value',
                        axisLabel: { fontSize: 10 }
                    },
                    yAxis: {
                        type: 'value',
                        axisLabel: { fontSize: 10 }
                    },
                    series: [{
                        symbolSize: 8,
                        data: slideData.data,
                        type: 'scatter',
                        itemStyle: {
                            color: '#c23531',
                            opacity: 0.8
                        }
                    }]
                };
                break;
        }

        if (Object.keys(option).length > 0) {
            this.chartInstance.setOption(option, true);
        }
    }

    startPolling() {
        // Poll every 3 seconds to stay in sync with presentation
        setInterval(() => {
            this.loadCurrentSlide();
        }, 3000);
    }

    destroy() {
        if (this.chartInstance) {
            this.chartInstance.dispose();
        }
        if (this.laserOverlay) {
            this.laserOverlay.destroy();
        }
        if (this.previewElement && this.previewElement.parentNode) {
            this.previewElement.parentNode.removeChild(this.previewElement);
        }
    }
}

// Export for use in other scripts
window.SlidePreview = SlidePreview;