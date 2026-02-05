# MediFlow - Eye Hospital Operations Dashboard

A clean, professional hospital operations dashboard inspired by modern healthcare SaaS products. Built with Flask backend and responsive Bootstrap frontend.

## Features

- **Real-time Dashboard**: Live hospital status and analytics
- **Patient Distribution**: Visual breakdown of patient flow across departments
- **Wait Time Analysis**: Comprehensive waiting time statistics
- **Simulation Controls**: Generate realistic hospital activity data
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

### Backend
- **Python Flask**: RESTful API endpoints
- **SQLite**: Lightweight database for data storage

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom styling with specified color palette
- **Bootstrap 5**: Responsive grid system and components
- **JavaScript (Vanilla)**: Interactive functionality
- **Chart.js**: Data visualization

## Color Palette

- **Page Background**: #F1F5F9
- **Sidebar Background**: #F8FAFC
- **Primary Blue**: #0EA5E9
- **Secondary Teal**: #14B8A6
- **Heading Text**: #0F172A
- **Secondary Text**: #64748B
- **Card Background**: #FFFFFF
- **Border Light**: #E5E7EB
- **Success Green**: #22C55E
- **Danger Red**: #EF4444

## Project Structure

```
MediFlow/
├── app.py                    # Flask backend application
├── requirements.txt          # Python dependencies
├── templates/
│   └── index.html           # Main dashboard template
└── static/
    ├── css/style.css        # Custom styles
    └── js/dashboard.js      # Frontend JavaScript
```

## Installation & Setup

### Prerequisites
- Python 3.7+
- pip (Python package manager)

### Steps

1. **Clone or download the project**
   ```bash
   cd /path/to/your/projects/folder
   # Place the project files in a folder named 'MediFlow'
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open in browser**
   - Navigate to `http://127.0.0.1:5000/`
   - The dashboard will load with real-time hospital data

## API Endpoints

- `GET /`: Main dashboard page
- `GET /api/overview`: Overview statistics (total patients, wait times, etc.)
- `GET /api/patient-distribution`: Patient distribution data for charts
- `GET /api/wait-times`: Wait time analysis data
- `POST /api/simulate`: Trigger hospital activity simulation
- `POST /api/reset`: Reset dashboard data to initial state

## Sample API Responses

### Overview Data
```json
{
  "total_patients": 145,
  "avg_wait_time": 23.5,
  "active_staff": 12,
  "occupancy": 78
}
```

### Patient Distribution
```json
{
  "labels": ["Screening", "Imaging", "Reception", "Pharmacy"],
  "data": [25, 18, 32, 15]
}
```

### Wait Times
```json
{
  "total_patients": 145,
  "avg_wait": 23.5,
  "max_wait": 45,
  "min_wait": 5
}
```

## Layout Structure

### Root Layout
- Flex container with fixed sidebar and scrollable main content
- Sidebar: 260px width, fixed position
- Main content: Margin-left 260px, padding 32px

### Sidebar
- Fixed width: 260px
- Full height: 100vh
- Background: #F8FAFC
- Navigation menu with active state highlighting
- Simulation controls at bottom

### Main Content
- Header section with title and system status
- Statistics cards in Bootstrap grid (4 cards per row)
- Charts section with patient distribution and wait time analysis

## Features

- **Responsive Design**: Bootstrap grid system ensures compatibility across devices
- **Real-time Updates**: Dashboard auto-refreshes every 30 seconds
- **Interactive Charts**: Chart.js visualizations with smooth animations
- **Simulation Controls**: Generate realistic hospital data or reset to defaults
- **Clean UI**: Medical-grade typography and professional styling
- **Toast Notifications**: User feedback for actions and errors

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and demonstration purposes.
