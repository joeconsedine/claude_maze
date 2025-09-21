// LiveKit Integration for Main Presentation View
class LiveKitIntegration {
    constructor() {
        this.room = null;
        this.isConnected = false;
        this.isStreamVisible = false;

        this.initializeElements();
        this.setupEventListeners();
        this.addStreamToggleToPresentation();
    }

    initializeElements() {
        this.overlay = document.getElementById('livekitOverlay');
        this.presenterStream = document.getElementById('presenterStream');
        this.toggleStreamBtn = document.getElementById('toggleStreamView');
        this.joinStreamBtn = document.getElementById('joinStreamBtn');
        this.leaveStreamBtn = document.getElementById('leaveStreamBtn');
        this.streamStatus = document.getElementById('streamStatus');
    }

    setupEventListeners() {
        this.toggleStreamBtn.addEventListener('click', () => this.toggleStreamVisibility());
        this.joinStreamBtn.addEventListener('click', () => this.joinStream());
        this.leaveStreamBtn.addEventListener('click', () => this.leaveStream());
    }

    addStreamToggleToPresentation() {
        // Add a floating toggle button to the main presentation
        const toggleButton = document.createElement('button');
        toggleButton.id = 'floatingStreamToggle';
        toggleButton.innerHTML = '📺 Live Stream';
        toggleButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(0, 123, 255, 0.9);
            color: white;
            border: none;
            border-radius: 25px;
            padding: 12px 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        `;

        toggleButton.addEventListener('mouseenter', () => {
            toggleButton.style.background = 'rgba(0, 123, 255, 1)';
            toggleButton.style.transform = 'scale(1.05)';
        });

        toggleButton.addEventListener('mouseleave', () => {
            toggleButton.style.background = 'rgba(0, 123, 255, 0.9)';
            toggleButton.style.transform = 'scale(1)';
        });

        toggleButton.addEventListener('click', () => this.toggleStreamVisibility());

        document.body.appendChild(toggleButton);
        this.floatingToggle = toggleButton;
    }

    toggleStreamVisibility() {
        this.isStreamVisible = !this.isStreamVisible;

        if (this.isStreamVisible) {
            this.overlay.style.display = 'block';
            this.overlay.style.cssText += `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                height: 240px;
                z-index: 999;
                background: rgba(42, 42, 42, 0.95);
                border-radius: 12px;
                padding: 15px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            `;

            // Style the stream container
            const streamContainer = this.overlay.querySelector('.stream-container');
            streamContainer.style.cssText = `
                height: 100%;
                display: flex;
                flex-direction: column;
                gap: 8px;
            `;

            // Style the video
            this.presenterStream.style.cssText = `
                flex: 1;
                width: 100%;
                background: #1f1f1f;
                border-radius: 8px;
                object-fit: cover;
            `;

            // Style the controls
            const controls = this.overlay.querySelector('.stream-controls');
            controls.style.cssText = `
                display: flex;
                gap: 5px;
            `;

            const buttons = controls.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.style.cssText = `
                    flex: 1;
                    padding: 6px 8px;
                    border: none;
                    border-radius: 4px;
                    background: #007bff;
                    color: white;
                    cursor: pointer;
                    font-size: 11px;
                    transition: background 0.2s;
                `;
            });

            // Style the status
            this.streamStatus.style.cssText = `
                font-size: 10px;
                text-align: center;
                color: #ccc;
                padding: 4px;
            `;

            this.floatingToggle.innerHTML = '❌ Hide Stream';

            // Auto-join if not connected
            if (!this.isConnected) {
                this.joinStream();
            }
        } else {
            this.overlay.style.display = 'none';
            this.floatingToggle.innerHTML = '📺 Live Stream';
        }
    }

    updateStatus(message, type = 'info') {
        this.streamStatus.textContent = message;
        this.streamStatus.style.color = type === 'error' ? '#ff6b6b' :
                                        type === 'success' ? '#51cf66' : '#ccc';

        // Update floating button based on connection status
        if (this.isConnected) {
            this.floatingToggle.style.background = 'rgba(40, 167, 69, 0.9)';
        } else {
            this.floatingToggle.style.background = 'rgba(0, 123, 255, 0.9)';
        }
    }

    async joinStream() {
        try {
            this.updateStatus('Connecting...', 'info');
            this.joinStreamBtn.disabled = true;

            // Load LiveKit client if not already loaded
            if (typeof LiveKitClient === 'undefined') {
                await this.loadLiveKitClient();
            }

            // Get token from backend
            const response = await fetch('/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room: 'presentation-room',
                    identity: `viewer-${Date.now()}`
                })
            });

            const tokenData = await response.json();
            if (tokenData.error) {
                throw new Error(tokenData.error);
            }

            // Connect to LiveKit room
            this.room = new LiveKitClient.Room();

            this.room.on(LiveKitClient.RoomEvent.Connected, () => {
                this.isConnected = true;
                this.updateStatus('Connected', 'success');
                this.joinStreamBtn.style.display = 'none';
                this.leaveStreamBtn.style.display = 'block';
            });

            this.room.on(LiveKitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track.kind === LiveKitClient.Track.Kind.Video) {
                    track.attach(this.presenterStream);
                    this.updateStatus('Receiving video', 'success');
                }
            });

            this.room.on(LiveKitClient.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                if (track.kind === LiveKitClient.Track.Kind.Video) {
                    track.detach();
                    this.updateStatus('Video ended', 'info');
                }
            });

            this.room.on(LiveKitClient.RoomEvent.Disconnected, () => {
                this.isConnected = false;
                this.updateStatus('Disconnected', 'error');
                this.joinStreamBtn.style.display = 'block';
                this.leaveStreamBtn.style.display = 'none';
                this.joinStreamBtn.disabled = false;
            });

            await this.room.connect(tokenData.url, tokenData.token);

        } catch (error) {
            console.error('Error joining stream:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');
            this.joinStreamBtn.disabled = false;
        }
    }

    async leaveStream() {
        if (this.room) {
            await this.room.disconnect();
            this.room = null;
        }
    }

    async loadLiveKitClient() {
        return new Promise((resolve, reject) => {
            if (typeof LiveKitClient !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/livekit-client/dist/livekit-client.umd.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// Initialize LiveKit integration when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.livekitIntegration = new LiveKitIntegration();
});