# Professional Weather App

A modern, responsive weather application built with HTML, CSS, and JavaScript.

## Features

- **Real-time Weather Data**: Fetches current weather information from OpenWeatherMap API
- **Modern Glassmorphism Design**: Beautiful frosted glass effect with gradient backgrounds
- **Dynamic Weather Icons**: Emoji-based weather icons that change based on conditions
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Search Functionality**: Search for weather in any city worldwide
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages for invalid inputs
- **Smooth Animations**: Professional transitions and hover effects

## Setup Instructions

1. **Get API Key**:
   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Get your free API key
   - Replace `YOUR_API_KEY_HERE` in `script.js` with your actual API key

2. **Files Structure**:
   ```
   Weather/
   ├── Weather_Project.html    # Main HTML file
   ├── Weather.css            # Styling
   ├── script.js              # JavaScript functionality
   ├── search.png             # Search icon
   └── README.md              # This file
   ```

3. **Usage**:
   - Open `Weather_Project.html` in your web browser
   - Enter a city name in the search box
   - Press Enter or click the search button
   - View current weather conditions

## Weather Conditions Supported

- ☀️ Clear/Sunny
- ☁️ Cloudy
- 🌧️ Rain
- 🌦️ Drizzle
- ⛈️ Thunderstorm
- ❄️ Snow
- 🌫️ Mist/Fog/Haze

## Technical Features

- **Glassmorphism UI**: Modern frosted glass effect with backdrop blur
- **Gradient Backgrounds**: Beautiful purple-blue gradient
- **Responsive Grid**: Flexbox-based layout that adapts to screen size
- **Smooth Transitions**: CSS animations for better UX
- **API Integration**: Async/await for weather data fetching
- **Error Management**: Comprehensive error handling with user feedback

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers

## Customization

You can easily customize:
- Color schemes in `Weather.css`
- Weather icons in the `iconMap` object in `script.js`
- API endpoints for additional weather data
- Animation speeds and effects
