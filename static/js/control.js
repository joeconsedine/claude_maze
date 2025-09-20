class ControlPanel {
    constructor() {
        this.currentSlideTitle = document.getElementById('current-slide-title');
        this.slideCounter = document.getElementById('slide-counter');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.slidesContainer = document.getElementById('slides-container');

        this.slides = [];
        this.currentIndex = 0;
        this.totalSlides = 0;

        this.initEventListeners();
        this.loadSlides();
        this.startPolling();
    }

    initEventListeners() {
        this.prevBtn.addEventListener('click', () => this.previousSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
    }

    async loadSlides() {
        try {
            const response = await fetch('/api/slides');
            const data = await response.json();

            this.slides = data.slides;
            this.currentIndex = data.current_index;
            this.totalSlides = data.total;

            this.updateDisplay();
            this.renderSlideList();
        } catch (error) {
            console.error('Error loading slides:', error);
        }
    }

    async previousSlide() {
        try {
            const response = await fetch('/api/previous-slide');
            const slideData = await response.json();
            this.loadSlides(); // Refresh to get updated current index
        } catch (error) {
            console.error('Error going to previous slide:', error);
        }
    }

    async nextSlide() {
        try {
            const response = await fetch('/api/next-slide');
            const slideData = await response.json();
            this.loadSlides(); // Refresh to get updated current index
        } catch (error) {
            console.error('Error going to next slide:', error);
        }
    }

    async gotoSlide(index) {
        try {
            const response = await fetch(`/api/goto-slide/${index}`);
            const slideData = await response.json();
            this.loadSlides(); // Refresh to get updated current index
        } catch (error) {
            console.error('Error going to slide:', error);
        }
    }

    updateDisplay() {
        if (this.slides.length > 0 && this.currentIndex < this.slides.length) {
            const currentSlide = this.slides[this.currentIndex];
            this.currentSlideTitle.textContent = currentSlide.title;
            this.slideCounter.textContent = `Slide ${this.currentIndex + 1} of ${this.totalSlides}`;

            // Update navigation button states
            this.prevBtn.disabled = false;
            this.nextBtn.disabled = false;
        }
    }

    renderSlideList() {
        this.slidesContainer.innerHTML = '';

        this.slides.forEach((slide, index) => {
            const slideItem = document.createElement('div');
            slideItem.className = `slide-item ${index === this.currentIndex ? 'current' : ''}`;

            slideItem.innerHTML = `
                <div class="slide-info">
                    <div class="slide-title">${slide.title}</div>
                    <div class="slide-type">${this.formatChartType(slide.chart_type)}</div>
                </div>
                <button class="goto-btn" onclick="controlPanel.gotoSlide(${index})">
                    ${index === this.currentIndex ? 'Current' : 'Go to'}
                </button>
            `;

            this.slidesContainer.appendChild(slideItem);
        });
    }

    formatChartType(type) {
        const typeMap = {
            'line': 'Line Chart',
            'bar': 'Bar Chart',
            'pie': 'Pie Chart',
            'scatter': 'Scatter Plot'
        };
        return typeMap[type] || type;
    }

    startPolling() {
        // Poll every 2 seconds to sync with any external changes
        setInterval(() => {
            this.loadSlides();
        }, 2000);
    }
}

// Make controlPanel globally accessible for the goto buttons
let controlPanel;

document.addEventListener('DOMContentLoaded', () => {
    controlPanel = new ControlPanel();
});