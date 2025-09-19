# Claude Maze - ECharts Presentation System

A Flask-based presentation system that recreates and extends the ECharts demo functionality with server-side slide control.

## Features

- Server-controlled slide progression (no user navigation)
- Multiple chart types: Line, Bar, Pie, Scatter
- Auto-advancing slides with smooth animations
- Modular Jinja templates for each chart type
- Responsive design

## Setup

1. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On macOS/Linux
   # or
   venv\Scripts\activate     # On Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Visit:** `http://localhost:5000`

## Project Structure

```
claude_maze/
├── app.py                      # Flask server with slide controller
├── requirements.txt            # Python dependencies
├── templates/
│   ├── index.html             # Main presentation page
│   └── charts/                # Individual chart type templates
│       ├── line_chart.html
│       ├── bar_chart.html
│       ├── pie_chart.html
│       └── scatter_chart.html
└── static/
    ├── css/
    │   └── style.css          # Presentation styling
    └── js/
        └── presentation.js    # Frontend controller
```

## API Endpoints

- `GET /` - Main presentation page
- `GET /api/current-slide` - Get current slide data
- `GET /api/next-slide` - Advance to next slide
- `GET /api/previous-slide` - Go to previous slide
- `GET /api/goto-slide/<index>` - Jump to specific slide

## Future Development

Phase 2 will include:
- User-built presentations
- Custom slide structures
- User-provided data sources
- Custom visual interfaces and vector elements