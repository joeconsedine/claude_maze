class PresentationController {
    constructor() {
        console.log('🚀 PresentationController constructor called');
        this.chart = null;
        this.currentSlide = null;
        this.currentSlideId = null;
        this.slideCounter = document.getElementById('slide-counter');
        this.slideTitle = document.getElementById('slide-title');
        this.chartContainer = document.getElementById('chart');

        console.log('🔧 Initializing chart...');
        this.initChart();
        console.log('📥 Loading initial slide...');
        this.loadCurrentSlide();
        console.log('🔄 Starting polling...');
        this.startPolling();
        console.log('✅ PresentationController initialized');
    }

    initChart() {
        this.chart = echarts.init(this.chartContainer, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });

        window.addEventListener('resize', () => {
            this.chart.resize();
        });
    }

    async loadCurrentSlide() {
        try {
            console.log('🔄 loadCurrentSlide() called at', new Date().toISOString());
            const response = await fetch('/api/current-slide');
            const slideData = await response.json();
            console.log('📡 Received slide data:', slideData);
            console.log('🆔 Current stored ID:', this.currentSlideId, 'New ID:', slideData.id);

            // Only re-render if the slide has actually changed
            if (this.currentSlideId !== slideData.id) {
                console.log('🎬 Slide changed! Rendering new slide:', slideData.id);
                this.currentSlideId = slideData.id;
                this.currentSlide = slideData;
                this.renderSlide(slideData);
            } else {
                console.log('➡️ Same slide, just updating counter');
                // Just update the counter without re-rendering the chart
                this.updateSlideCounter();
            }
        } catch (error) {
            console.error('❌ Error loading slide:', error);
        }
    }

    async updateSlideCounter() {
        try {
            const response = await fetch('/api/slides');
            const data = await response.json();
            this.slideCounter.textContent = `${data.current_index + 1} / ${data.total}`;
        } catch (error) {
            console.error('Error updating slide counter:', error);
        }
    }

    renderSlide(slideData) {
        this.slideTitle.textContent = slideData.title;
        this.updateSlideCounter();

        this.chart.clear();

        switch(slideData.chart_type) {
            case 'line':
                this.renderLineChart(slideData.data);
                break;
            case 'bar':
                this.renderBarChart(slideData.data);
                break;
            case 'pie':
                this.renderPieChart(slideData.data);
                break;
            case 'scatter':
                this.renderScatterChart(slideData.data);
                break;
            default:
                console.error('Unknown chart type:', slideData.chart_type);
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
                animationDuration: 2000,
                animationEasing: 'cubicOut'
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
                animationDuration: 2000,
                animationEasing: 'bounceOut'
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
                animationEasing: 'elasticOut',
                animationDuration: 2000
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
                animationDuration: 2000,
                animationEasing: 'cubicOut'
            }]
        };

        this.chart.setOption(option, true);
    }

    startPolling() {
        console.log('🔁 Starting polling every 2 seconds');
        // Poll for changes every 2 seconds to sync with control panel
        // ONLY loads current slide - NEVER calls next/previous automatically
        setInterval(() => {
            console.log('⏰ Polling interval triggered');
            this.loadCurrentSlide();
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PresentationController();
});