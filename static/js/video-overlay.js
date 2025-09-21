class VideoOverlay {
    constructor(containerElement) {
        this.container = containerElement;
        this.overlayElement = null;
        this.videoElement = null;
        this.currentType = 'none';
        this.currentUrl = '';
        this.currentRoomId = '';

        this.init();
    }

    init() {
        this.createVideoOverlay();
        this.startPolling();
    }

    createVideoOverlay() {
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'video-overlay';
        this.overlayElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            height: 240px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 12px;
            border: 2px solid #333;
            z-index: 2000;
            display: none;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

        this.container.appendChild(this.overlayElement);

        // Add resize handle
        this.addResizeHandle();
    }

    addResizeHandle() {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'video-resize-handle';
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            background: #555;
            cursor: se-resize;
            border-radius: 12px 0 12px 0;
        `;

        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(window.getComputedStyle(this.overlayElement).width, 10);
            startHeight = parseInt(window.getComputedStyle(this.overlayElement).height, 10);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const width = startWidth + e.clientX - startX;
            const height = startHeight + e.clientY - startY;

            // Maintain aspect ratio
            const aspectRatio = 4/3;
            const newWidth = Math.max(200, Math.min(600, width));
            const newHeight = newWidth / aspectRatio;

            this.overlayElement.style.width = newWidth + 'px';
            this.overlayElement.style.height = newHeight + 'px';
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });

        this.overlayElement.appendChild(resizeHandle);
    }

    showVideo(type, url, roomId = '') {
        this.currentType = type;
        this.currentUrl = url;
        this.currentRoomId = roomId;

        this.overlayElement.innerHTML = '';
        this.addResizeHandle();

        switch (type) {
            case 'youtube':
                this.showYouTubeVideo(url);
                break;
            case 'vimeo':
                this.showVimeoVideo(url);
                break;
            case 'twitch':
                this.showTwitchStream(url);
                break;
            case 'webcam':
                this.showWebcamStream(roomId);
                break;
            case 'jitsi':
                this.showJitsiMeet(roomId);
                break;
            default:
                this.hideVideo();
                return;
        }

        this.overlayElement.style.display = 'block';
    }

    showYouTubeVideo(url) {
        const videoId = this.extractYouTubeId(url);
        if (!videoId) {
            console.error('Invalid YouTube URL');
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 10px;
        `;
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

        this.overlayElement.appendChild(iframe);
    }

    showVimeoVideo(url) {
        const videoId = this.extractVimeoId(url);
        if (!videoId) {
            console.error('Invalid Vimeo URL');
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 10px;
        `;
        iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

        this.overlayElement.appendChild(iframe);
    }

    showTwitchStream(url) {
        const channel = this.extractTwitchChannel(url);
        if (!channel) {
            console.error('Invalid Twitch URL');
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 10px;
        `;
        iframe.src = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&muted=true`;

        this.overlayElement.appendChild(iframe);
    }

    showWebcamStream(roomId) {
        // Simple WebRTC implementation using PeerJS
        const videoContainer = document.createElement('div');
        videoContainer.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
        `;

        videoContainer.innerHTML = `
            <div style="margin-bottom: 10px;">📹 Webcam Stream</div>
            <div style="font-size: 12px; margin-bottom: 10px;">Room: ${roomId}</div>
            <video id="webcam-video" autoplay muted style="width: 100%; height: 150px; background: #000; border-radius: 8px;"></video>
            <div style="margin-top: 10px; font-size: 11px;">Presenter webcam will appear here</div>
        `;

        this.overlayElement.appendChild(videoContainer);
        this.initWebcam();
    }

    showJitsiMeet(roomId) {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 10px;
        `;
        iframe.src = `https://meet.jit.si/${roomId}`;
        iframe.allow = 'camera; microphone; fullscreen; display-capture';

        this.overlayElement.appendChild(iframe);
    }

    async initWebcam() {
        try {
            const video = document.getElementById('webcam-video');
            if (video && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240 },
                    audio: false
                });
                video.srcObject = stream;
            }
        } catch (error) {
            console.log('Webcam access not available:', error);
        }
    }

    hideVideo() {
        this.overlayElement.style.display = 'none';
        this.overlayElement.innerHTML = '';
        this.addResizeHandle();
        this.currentType = 'none';
    }

    extractYouTubeId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    extractVimeoId(url) {
        const regex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
        const match = url.match(regex);
        return match ? match[3] : null;
    }

    extractTwitchChannel(url) {
        const regex = /twitch\.tv\/([a-zA-Z0-9_]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    async pollVideoState() {
        try {
            const response = await fetch('/api/video/state');
            const data = await response.json();

            if (data.active && data.type !== this.currentType) {
                this.showVideo(data.type, data.url, data.room_id);
            } else if (!data.active && this.currentType !== 'none') {
                this.hideVideo();
            }
        } catch (error) {
            console.error('Error polling video state:', error);
        }
    }

    startPolling() {
        // Poll video state every 2 seconds
        setInterval(() => {
            this.pollVideoState();
        }, 2000);
    }

    destroy() {
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
    }
}

// Export for use in other scripts
window.VideoOverlay = VideoOverlay;