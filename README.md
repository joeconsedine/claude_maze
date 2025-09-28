# Claude Maze - ECharts Presentation System

A Flask-based presentation system that recreates and extends the ECharts demo functionality with server-side slide control.

## Features

- **Multi-user Authentication**: PostgreSQL-based user system with organizations
- **Role-based Access Control**: Admin and standard user roles
- **Seat Management**: Organization-based seat limits for standard users
- **Server-controlled Presentations**: Centralized slide control with real-time sync
- **Multiple Chart Types**: Line, Bar, Pie, Scatter with ECharts
- **Interactive Features**: Laser pointer overlay, video streaming
- **Data Upload**: Custom slide creation from CSV/JSON/Excel files
- **Heroku Ready**: Production deployment configuration included

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

3. **Set up PostgreSQL database:**
   ```bash
   # Create database (adjust connection details as needed)
   createdb claude_maze

   # Set environment variables (optional, defaults to local PostgreSQL)
   export DATABASE_URL="postgresql://username:password@localhost/claude_maze"
   export SECRET_KEY="your-secret-key-here"
   ```

4. **Initialize the database:**
   ```bash
   python init_db.py
   ```

5. **Run the application:**
   ```bash
   python app.py
   ```

6. **Visit:** `http://localhost:5000`

### Default Login Credentials

After running `init_db.py`, you can use these test accounts:

- **Admin**: `admin` / `admin123` (can control presentations)
- **Standard**: `user` / `user123` (viewer only)

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