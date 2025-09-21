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
                </div>
            </div>
            <div class="preview-content">
                <div class="preview-chart" id="preview-chart"></div>
                <div class="preview-title" id="preview-title">Loading...</div>
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

    }

    setupLaserToggle() {
        const toggleBtn = this.previewElement.querySelector('#laser-toggle');

        toggleBtn.addEventListener('click', () => {
            this.isLaserActive = !this.isLaserActive;

            if (this.isLaserActive) {
                toggleBtn.textContent = '🔴 Laser On';
                toggleBtn.classList.add('active');
                this.laserOverlay.container.style.pointerEvents = 'auto';
            } else {
                toggleBtn.textContent = '🔴 Laser Off';
                toggleBtn.classList.remove('active');
                this.laserOverlay.container.style.pointerEvents = 'none';
                this.laserOverlay.laserTrails = []; // Clear existing trails
            }
        });
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