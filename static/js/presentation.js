class PresentationController {
    constructor() {
        this.chart = null;
        this.currentSlide = null;
        this.currentSlideId = null;
        this.slideCounter = document.getElementById('slide-counter');
        this.slideTitle = document.getElementById('slide-title') || null;
        this.chartContainer = document.getElementById('chart');
        this.pollCount = 0;
        this.laserOverlay = null;

        console.log('🔧 PresentationController starting - timestamp:', new Date().toISOString());
        console.log('🌐 User Agent:', navigator.userAgent);
        console.log('📍 Page URL:', window.location.href);
        console.log('🔗 Referrer:', document.referrer);

        this.initChart();
        this.initLaserOverlay();
        this.loadCurrentSlide();
        this.startPolling();
    }

    initChart() {
        console.log('📊 Initializing ECharts...');
        this.chart = echarts.init(this.chartContainer, 'dark', {
            renderer: 'canvas',
            useDirtyRect: false
        });

        window.addEventListener('resize', () => {
            this.chart.resize();
        });
        console.log('✅ ECharts initialized');
    }

    async loadCurrentSlide() {
        this.pollCount++;
        const timestamp = new Date().toISOString();

        try {
            console.log(`🔄 [${this.pollCount}] loadCurrentSlide() called at ${timestamp}`);

            const response = await fetch('/api/current-slide');
            const slideData = await response.json();

            console.log(`📡 [${this.pollCount}] Server response:`, slideData);
            console.log(`🆔 [${this.pollCount}] Current stored ID: "${this.currentSlideId}" | New ID: "${slideData.id}"`);
            console.log(`📊 [${this.pollCount}] Current slide index logic: Old slide was unknown, new slide appears to be:`, slideData.title);

            // Check if slide actually changed
            const slideChanged = this.currentSlideId !== slideData.id;
            console.log(`🔍 [${this.pollCount}] Slide changed?: ${slideChanged}`);

            if (slideChanged) {
                console.warn(`🚨 [${this.pollCount}] SLIDE CHANGE DETECTED! Old: "${this.currentSlideId}" → New: "${slideData.id}"`);
                console.warn(`🎬 [${this.pollCount}] Rendering new slide: ${slideData.title}`);

                this.currentSlideId = slideData.id;
                this.currentSlide = slideData;
                this.renderSlide(slideData);
            } else {
                console.log(`➡️ [${this.pollCount}] Same slide (${slideData.id}), updating counter only`);
                this.updateSlideCounter();
            }
        } catch (error) {
            console.error(`❌ [${this.pollCount}] Error loading slide:`, error);
        }
    }

    async updateSlideCounter() {
        try {
            const response = await fetch('/api/slides');
            const data = await response.json();
            const counterText = `${data.current_index + 1} / ${data.total}`;

            console.log(`📋 [${this.pollCount}] Counter update: "${counterText}" (server index: ${data.current_index})`);
            this.slideCounter.textContent = counterText;
        } catch (error) {
            console.error(`❌ [${this.pollCount}] Error updating slide counter:`, error);
        }
    }

    renderSlide(slideData) {
        console.log(`🎨 [${this.pollCount}] RENDERING slide: ${slideData.title} (ID: ${slideData.id})`);
        if (this.slideTitle) {
            this.slideTitle.textContent = slideData.title;
        }
        this.updateSlideCounter();

        this.chart.clear();

        switch(slideData.chart_type) {
            case 'line':
                console.log(`📈 [${this.pollCount}] Rendering line chart`);
                this.renderLineChart(slideData.data);
                break;
            case 'bar':
                console.log(`📊 [${this.pollCount}] Rendering bar chart`);
                this.renderBarChart(slideData.data);
                break;
            case 'pie':
                console.log(`🥧 [${this.pollCount}] Rendering pie chart`);
                this.renderPieChart(slideData.data);
                break;
            case 'scatter':
                console.log(`🔴 [${this.pollCount}] Rendering scatter chart`);
                this.renderScatterChart(slideData.data);
                break;
            case 'radar':
                console.log(`🕸️ [${this.pollCount}] Rendering radar chart`);
                this.renderRadarChart(slideData.data);
                break;
            case 'heatmap':
                console.log(`🔥 [${this.pollCount}] Rendering heatmap chart`);
                this.renderHeatmapChart(slideData.data);
                break;
            case 'treemap':
                console.log(`🌳 [${this.pollCount}] Rendering treemap chart`);
                this.renderTreemapChart(slideData.data);
                break;
            case 'gauge':
                console.log(`⏱️ [${this.pollCount}] Rendering gauge chart`);
                this.renderGaugeChart(slideData.data);
                break;
            default:
                console.error(`❌ [${this.pollCount}] Unknown chart type:`, slideData.chart_type);
        }
    }

    renderLineChart(data) {
        const option = {
            title: {
                text: this.currentSlide.title,
                left: 'center',
                textStyle: {
                    fontSize: 24,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: data.xAxis,
                axisLabel: {
                    fontSize: 14
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    fontSize: 14
                }
            },
            series: [{
                data: data.series,
                type: 'line',
                smooth: true,
                lineStyle: {
                    width: 3
                },
                itemStyle: {
                    borderWidth: 2
                },
                emphasis: {
                    focus: 'series'
                },
                animationDuration: 500,
                animationEasing: 'easeInOutQuart'
            }]
        };

        this.chart.setOption(option, true);
    }

    renderBarChart(data) {
        const option = {
            title: {
                text: this.currentSlide.title,
                left: 'center',
                textStyle: {
                    fontSize: 24,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            xAxis: {
                type: 'category',
                data: data.xAxis,
                axisLabel: {
                    fontSize: 14
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    fontSize: 14
                }
            },
            series: [{
                data: data.series,
                type: 'bar',
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#83bff6' },
                        { offset: 0.5, color: '#188df0' },
                        { offset: 1, color: '#188df0' }
                    ])
                },
                emphasis: {
                    focus: 'series'
                },
                animationDuration: 500,
                animationEasing: 'easeInOutQuart'
            }]
        };

        this.chart.setOption(option, true);
    }

    renderPieChart(data) {
        const option = {
            title: {
                text: this.currentSlide.title,
                left: 'center',
                textStyle: {
                    fontSize: 24,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                textStyle: {
                    fontSize: 14
                }
            },
            series: [{
                name: 'Data Source',
                type: 'pie',
                radius: '50%',
                data: data,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                animationType: 'scale',
                animationEasing: 'easeInOutQuart',
                animationDuration: 500
            }]
        };

        this.chart.setOption(option, true);
    }

    renderScatterChart(data) {
        const option = {
            title: {
                text: this.currentSlide.title,
                left: 'center',
                textStyle: {
                    fontSize: 24,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: 'X: {c[0]}<br/>Y: {c[1]}'
            },
            xAxis: {
                type: 'value',
                splitLine: {
                    lineStyle: {
                        type: 'dashed'
                    }
                },
                axisLabel: {
                    fontSize: 14
                }
            },
            yAxis: {
                type: 'value',
                splitLine: {
                    lineStyle: {
                        type: 'dashed'
                    }
                },
                axisLabel: {
                    fontSize: 14
                }
            },
            series: [{
                symbolSize: 12,
                data: data,
                type: 'scatter',
                itemStyle: {
                    color: '#c23531',
                    opacity: 0.8
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(120, 36, 50, 0.5)',
                        shadowOffsetY: 5,
                        color: '#c23531'
                    }
                },
                animationDuration: 500,
                animationEasing: 'easeInOutQuart'
            }]
        };

        this.chart.setOption(option, true);
    }

    renderRadarChart(data) {
        const option = {
            backgroundColor: '#242424',
            title: { text: this.currentSlide.title, textStyle: { color: '#ffffff' }, left: 'center' },
            radar: {
                indicator: data.indicator || [],
                axisName: { color: '#ffffff' },
                splitLine: { lineStyle: { color: '#404040' } },
                axisLine: { lineStyle: { color: '#404040' } }
            },
            series: [{
                type: 'radar',
                data: data.data || [],
                itemStyle: { color: '#a05195' },
                areaStyle: { opacity: 0.3 },
                animationDuration: 500
            }]
        };
        this.chart.setOption(option, true);
    }

    renderHeatmapChart(data) {
        const option = {
            backgroundColor: '#242424',
            title: { text: this.currentSlide.title, textStyle: { color: '#ffffff' }, left: 'center' },
            tooltip: { position: 'top' },
            grid: { height: '50%', top: '15%' },
            xAxis: {
                type: 'category',
                data: data.xAxis || [],
                axisLabel: { color: '#ffffff' }
            },
            yAxis: {
                type: 'category',
                data: data.yAxis || [],
                axisLabel: { color: '#ffffff' }
            },
            visualMap: {
                min: 0,
                max: 10,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '5%',
                inRange: {
                    color: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600']
                },
                textStyle: { color: '#ffffff' }
            },
            series: [{
                type: 'heatmap',
                data: data.data || [],
                animationDuration: 500
            }]
        };
        this.chart.setOption(option, true);
    }

    renderTreemapChart(data) {
        const option = {
            backgroundColor: '#242424',
            title: { text: this.currentSlide.title, textStyle: { color: '#ffffff' }, left: 'center' },
            series: [{
                type: 'treemap',
                data: data || [],
                levels: [{
                    itemStyle: {
                        borderColor: '#242424',
                        borderWidth: 2,
                        gapWidth: 2
                    }
                }],
                color: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'],
                animationDuration: 500
            }]
        };
        this.chart.setOption(option, true);
    }

    renderGaugeChart(data) {
        const option = {
            backgroundColor: '#242424',
            title: { text: this.currentSlide.title, textStyle: { color: '#ffffff' }, left: 'center' },
            series: [{
                type: 'gauge',
                detail: { formatter: '{value}%', color: '#ffffff' },
                data: [{ value: data.value || 0, name: data.name || 'Progress' }],
                axisLine: {
                    lineStyle: {
                        width: 30,
                        color: [
                            [0.3, '#ff7c43'],
                            [0.7, '#ffa600'],
                            [1, '#a05195']
                        ]
                    }
                },
                pointer: { itemStyle: { color: '#ffffff' } },
                axisTick: { lineStyle: { color: '#ffffff' } },
                splitLine: { lineStyle: { color: '#ffffff' } },
                axisLabel: { color: '#ffffff' },
                title: { color: '#ffffff' },
                animationDuration: 500
            }]
        };
        this.chart.setOption(option, true);
    }


    initLaserOverlay() {
        console.log('🔴 Initializing laser overlay for presentation');
        const presentationContainer = document.getElementById('chart');
        this.laserOverlay = new LaserOverlay(presentationContainer);
        this.laserOverlay.setColor('#00ff88', '#44ff88'); // Green laser for presentation

        // Disable pointer events since this will be controlled remotely
        this.laserOverlay.container.style.pointerEvents = 'none';

        // Start polling for laser updates
        this.startLaserPolling();
    }


    async pollLaserPoints() {
        try {
            const response = await fetch('/api/laser/points');
            const data = await response.json();

            if (data.points && data.points.length > 0) {
                // Clear existing trails and add new ones
                this.laserOverlay.laserTrails = [];

                data.points.forEach(point => {
                    // Scale coordinates from controller to presentation
                    const presentationRect = this.laserOverlay.container.getBoundingClientRect();
                    const scaleX = presentationRect.width / point.container_width;
                    const scaleY = presentationRect.height / point.container_height;

                    const scaledX = point.x * scaleX;
                    const scaledY = point.y * scaleY;

                    // Calculate fade based on age
                    const age = Date.now() / 1000 - point.timestamp;
                    const fadeFactor = Math.max(0, 1 - (age / 5)); // Fade over 5 seconds

                    this.laserOverlay.addLaserPoint(scaledX, scaledY, point.intensity * fadeFactor);
                });
            } else {
                // Clear laser trails if no points
                this.laserOverlay.laserTrails = [];
            }
        } catch (error) {
            console.error('Error polling laser points:', error);
        }
    }

    startLaserPolling() {
        // Poll laser points every 100ms for smooth updates
        setInterval(() => {
            this.pollLaserPoints();
        }, 100);
    }

    startPolling() {
        console.log('🔄 Starting polling every 2 seconds for slide changes');
        console.warn('⚠️ IMPORTANT: Polling is ONLY for sync - it should NEVER cause slides to change automatically');

        setInterval(() => {
            console.log(`⏰ Polling interval triggered (count: ${this.pollCount + 1})`);
            this.loadCurrentSlide();
        }, 2000);
    }
}

// Prevent multiple instances
if (window.presentationController) {
    console.warn('🚨 PresentationController already exists! This might cause issues.');
} else {
    console.log('🆕 Creating new PresentationController instance');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing PresentationController');
    console.log('🕐 Timestamp:', new Date().toISOString());
    window.presentationController = new PresentationController();
});