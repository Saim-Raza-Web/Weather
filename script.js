const apiKey = 'bd5e378503939ddaee76f12ad7a97608'; // OpenWeatherMap API key for testing
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

const searchBox = document.querySelector('.input_box');
const searchBtn = document.querySelector('.search-btn');
const locationBtn = document.querySelector('.location-btn');
const weatherIcon = document.querySelector('.weather-icon');
const tempElement = document.querySelector('.temp');
const countryElement = document.querySelector('.country');
const humidityElement = document.querySelector('.humidity');
const windElement = document.querySelector('.wind');
const suggestionsDropdown = document.getElementById('suggestions');
const timeElement = document.getElementById('current-time');
const dateElement = document.getElementById('current-date');

let currentTimezone = null;

// Popular cities for suggestions
const popularCities = [
    { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
    { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
    { name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
    { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
    { name: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
    { name: 'Singapore', country: 'SG', lat: 1.3521, lon: 103.8198 },
    { name: 'Hong Kong', country: 'HK', lat: 22.3193, lon: 114.1694 },
    { name: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 },
    { name: 'Mumbai', country: 'IN', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi', country: 'IN', lat: 28.7041, lon: 77.1025 },
    { name: 'Karachi', country: 'PK', lat: 24.8607, lon: 67.0011 },
    { name: 'Lahore', country: 'PK', lat: 31.5204, lon: 74.3587 },
    { name: 'Islamabad', country: 'PK', lat: 33.6844, lon: 73.0479 },
    { name: 'Peshawar', country: 'PK', lat: 34.0151, lon: 71.5249 },
    { name: 'Quetta', country: 'PK', lat: 30.1798, lon: 66.9750 },
    { name: 'Faisalabad', country: 'PK', lat: 31.4504, lon: 73.1350 },
    { name: 'Beijing', country: 'CN', lat: 39.9042, lon: 116.4074 },
    { name: 'Shanghai', country: 'CN', lat: 31.2304, lon: 121.4737 },
    { name: 'Moscow', country: 'RU', lat: 55.7558, lon: 37.6173 },
    { name: 'Istanbul', country: 'TR', lat: 41.0082, lon: 28.9784 },
    { name: 'Cairo', country: 'EG', lat: 30.0444, lon: 31.2357 },
    { name: 'Bangkok', country: 'TH', lat: 13.7563, lon: 100.5018 },
    { name: 'Seoul', country: 'KR', lat: 37.5665, lon: 126.9780 },
    { name: 'Jakarta', country: 'ID', lat: -6.2088, lon: 106.8456 },
    { name: 'Manila', country: 'PH', lat: 14.5995, lon: 120.9842 },
    { name: 'Mexico City', country: 'MX', lat: 19.4326, lon: -99.1332 },
    { name: 'São Paulo', country: 'BR', lat: -23.5505, lon: -46.6333 },
    { name: 'Buenos Aires', country: 'AR', lat: -34.6037, lon: -58.3816 },
    { name: 'Cape Town', country: 'ZA', lat: -33.9249, lon: 18.4241 },
    { name: 'Toronto', country: 'CA', lat: 43.6532, lon: -79.3832 },
    { name: 'Vancouver', country: 'CA', lat: 49.2827, lon: -123.1207 },
    { name: 'Berlin', country: 'DE', lat: 52.5200, lon: 13.4050 },
    { name: 'Rome', country: 'IT', lat: 41.9028, lon: 12.4964 },
    { name: 'Madrid', country: 'ES', lat: 40.4168, lon: -3.7038 },
    { name: 'Amsterdam', country: 'NL', lat: 52.3676, lon: 4.9041 },
    { name: 'Barcelona', country: 'ES', lat: 41.3851, lon: 2.1734 },
    { name: 'Milan', country: 'IT', lat: 45.4642, lon: 9.1900 },
    { name: 'Prague', country: 'CZ', lat: 50.0755, lon: 14.4378 },
    { name: 'Vienna', country: 'AT', lat: 48.2082, lon: 16.3738 },
    { name: 'Athens', country: 'GR', lat: 37.9838, lon: 23.7275 },
    { name: 'Stockholm', country: 'SE', lat: 59.3293, lon: 18.0686 },
    { name: 'Oslo', country: 'NO', lat: 59.9139, lon: 10.7522 },
    { name: 'Copenhagen', country: 'DK', lat: 55.6761, lon: 12.5683 },
    { name: 'Helsinki', country: 'FI', lat: 60.1699, lon: 24.9384 },
    { name: 'Warsaw', country: 'PL', lat: 52.2297, lon: 21.0122 },
    { name: 'Budapest', country: 'HU', lat: 47.4979, lon: 19.0402 },
    { name: 'Dublin', country: 'IE', lat: 53.3498, lon: -6.2603 },
    { name: 'Lisbon', country: 'PT', lat: 38.7223, lon: -9.1393 },
    { name: 'Zurich', country: 'CH', lat: 47.3769, lon: 8.5417 },
    { name: 'Brussels', country: 'BE', lat: 50.8503, lon: 4.3517 }
];

// Function to update time and date
function updateDateTime(timezoneOffset = null) {
    const now = new Date();
    let localTime = now;
    
    if (timezoneOffset !== null) {
        // Convert to city's timezone
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        localTime = new Date(utc + (timezoneOffset * 1000));
    }
    
    // Format time
    const hours = localTime.getHours().toString().padStart(2, '0');
    const minutes = localTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Format date
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[localTime.getDay()];
    const day = localTime.getDate();
    const monthName = months[localTime.getMonth()];
    const year = localTime.getFullYear();
    
    const dateString = `${dayName}, ${monthName} ${day}`;
    
    // Update display
    timeElement.textContent = timeString;
    dateElement.textContent = dateString;
}

// Function to start time updates
function startTimeUpdates() {
    updateDateTime(currentTimezone);
    setInterval(() => {
        updateDateTime(currentTimezone);
    }, 1000); // Update every second
}

// Recent searches functionality
let recentSearches = JSON.parse(localStorage.getItem('recentWeatherSearches')) || [];

// Function to add city to recent searches
function addToRecentSearches(city) {
    // Remove if already exists
    recentSearches = recentSearches.filter(search => search !== city);
    // Add to beginning
    recentSearches.unshift(city);
    // Keep only last 5
    recentSearches = recentSearches.slice(0, 5);
    // Save to localStorage
    localStorage.setItem('recentWeatherSearches', JSON.stringify(recentSearches));
}

// Function to get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
                    );
                    const data = await response.json();
                    updateWeatherDisplay(data);
                    addToRecentSearches(data.name);
                } catch (error) {
                    showError('Could not get weather for your location');
                }
            },
            (error) => {
                let errorMessage = 'Location access denied. Please enable location services.';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please enable location services in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable. Please try searching manually.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Please try again.';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred. Please try searching manually.';
                        break;
                }
                
                showError(errorMessage);
                
                // Auto-hide error message after 5 seconds
                setTimeout(() => {
                    hideError();
                }, 5000);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser');
        setTimeout(() => {
            hideError();
        }, 5000);
    }
}

// Function to filter cities based on input
function filterCities(query) {
    if (!query || query.length < 2) return [];
    
    const lowercaseQuery = query.toLowerCase();
    let results = popularCities.filter(city => 
        city.name.toLowerCase().includes(lowercaseQuery) ||
        city.country.toLowerCase().includes(lowercaseQuery)
    ).slice(0, 6);
    
    // Add recent searches if no results or as additional results
    if (results.length < 6) {
        const recentResults = recentSearches
            .filter(city => city.toLowerCase().includes(lowercaseQuery))
            .slice(0, 6 - results.length);
        
        recentResults.forEach(cityName => {
            if (!results.find(r => r.name === cityName)) {
                results.unshift({ name: cityName, country: 'Recent', isRecent: true });
            }
        });
    }
    
    return results.slice(0, 6);
}

// Function to display suggestions
function displaySuggestions(suggestions) {
    suggestionsDropdown.innerHTML = '';
    
    if (suggestions.length === 0) {
        suggestionsDropdown.classList.remove('active');
        return;
    }
    
    suggestions.forEach((city, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        
        if (city.isRecent) {
            suggestionItem.innerHTML = `
                <span class="city-name">🕐 ${city.name}</span>
                <span class="country-name">Recent search</span>
            `;
            suggestionItem.style.background = 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.05))';
        } else {
            suggestionItem.innerHTML = `
                <span class="city-name">${city.name}</span>
                <span class="country-name">${city.country}</span>
            `;
        }
        
        suggestionItem.addEventListener('click', () => {
            searchBox.value = city.name;
            suggestionsDropdown.classList.remove('active');
            selectedSuggestionIndex = -1;
            checkWeather(city.name);
            addToRecentSearches(city.name);
        });
        
        suggestionsDropdown.appendChild(suggestionItem);
    });
    
    // Position the dropdown below the input field
    const inputRect = searchBox.getBoundingClientRect();
    suggestionsDropdown.style.top = (inputRect.bottom + 5) + 'px';
    suggestionsDropdown.style.left = inputRect.left + 'px';
    suggestionsDropdown.style.width = inputRect.width + 'px';
    
    suggestionsDropdown.classList.add('active');
}

let selectedSuggestionIndex = -1;
let filteredSuggestions = [];

// Function to handle keyboard navigation
function handleKeyboardNavigation(e) {
    const items = suggestionsDropdown.querySelectorAll('.suggestion-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
        updateSelectedSuggestion(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        updateSelectedSuggestion(items);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && items[selectedSuggestionIndex]) {
            const cityName = items[selectedSuggestionIndex].querySelector('.city-name').textContent;
            searchBox.value = cityName;
            suggestionsDropdown.classList.remove('active');
            selectedSuggestionIndex = -1;
            checkWeather(cityName);
        } else {
            checkWeather(searchBox.value.trim());
        }
    } else if (e.key === 'Escape') {
        suggestionsDropdown.classList.remove('active');
        selectedSuggestionIndex = -1;
    }
}

// Function to update selected suggestion styling
function updateSelectedSuggestion(items) {
    items.forEach((item, index) => {
        if (index === selectedSuggestionIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// Event listeners for suggestions
searchBox.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    filteredSuggestions = filterCities(query);
    selectedSuggestionIndex = -1;
    displaySuggestions(filteredSuggestions);
});

searchBox.addEventListener('keydown', handleKeyboardNavigation);

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        suggestionsDropdown.classList.remove('active');
        selectedSuggestionIndex = -1;
    }
});

// Show suggestions when input is focused
searchBox.addEventListener('focus', () => {
    const query = searchBox.value.trim();
    if (query.length >= 2) {
        filteredSuggestions = filterCities(query);
        displaySuggestions(filteredSuggestions);
    }
});

// Location button event listener
locationBtn.addEventListener('click', () => {
    suggestionsDropdown.classList.remove('active');
    selectedSuggestionIndex = -1;
    getCurrentLocation();
});

// Search button event listener
searchBtn.addEventListener('click', () => {
    const city = searchBox.value.trim();
    if (city) {
        suggestionsDropdown.classList.remove('active');
        selectedSuggestionIndex = -1;
        checkWeather(city);
        addToRecentSearches(city);
    }
});

async function checkWeather(city) {
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(`${apiUrl}?q=${city}&units=metric&appid=${apiKey}`);
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        updateWeatherDisplay(data);
        addToRecentSearches(data.name);
    } catch (error) {
        showError(error.message);
        resetWeatherDisplay();
    } finally {
        showLoading(false);
    }
}

function updateWeatherDisplay(data) {
    // Add updating classes for animations
    weatherIcon.classList.add('updating');
    tempElement.classList.add('updating');
    countryElement.classList.add('updating');
    document.querySelector('.details').classList.add('updating');
    
    // Update timezone for accurate local time
    currentTimezone = data.timezone;
    
    // Update values with slight delay for smooth animation
    setTimeout(() => {
        tempElement.textContent = `${Math.round(data.main.temp)}°c`;
        countryElement.textContent = data.name;
        humidityElement.textContent = `${data.main.humidity}%`;
        windElement.textContent = `${data.wind.speed} km/h`;
        
        // Update weather icon based on weather condition
        const weatherCondition = data.weather[0].main.toLowerCase();
        updateWeatherIcon(weatherCondition);
        
        // Update time with new timezone
        updateDateTime(currentTimezone);
    }, 300);
    
    // Remove updating classes after animation
    setTimeout(() => {
        weatherIcon.classList.remove('updating');
        tempElement.classList.remove('updating');
        countryElement.classList.remove('updating');
        document.querySelector('.details').classList.remove('updating');
    }, 1000);
}

function updateWeatherIcon(condition) {
    const iconMap = {
        'clear': '☀️',
        'clouds': '☁️',
        'rain': '🌧️',
        'drizzle': '🌦️',
        'thunderstorm': '⛈️',
        'snow': '❄️',
        'mist': '🌫️',
        'fog': '🌫️',
        'haze': '🌫️'
    };
    
    weatherIcon.textContent = iconMap[condition] || '🌤️';
}

function showLoading(show) {
    if (show) {
        searchBtn.disabled = true;
        searchBtn.style.opacity = '0.5';
        weatherIcon.textContent = '⏳';
    } else {
        searchBtn.disabled = false;
        searchBtn.style.opacity = '1';
    }
}

function showError(message) {
    hideError();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const mainDiv = document.querySelector('.main_div');
    mainDiv.insertBefore(errorDiv, document.querySelector('.weather'));
}

function hideError() {
    const errorElement = document.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function resetWeatherDisplay() {
    tempElement.textContent = '22°c';
    countryElement.textContent = 'Jhang';
    humidityElement.textContent = '50%';
    windElement.textContent = '15 km/h';
    weatherIcon.textContent = '🌤️';
}

// Event listeners
searchBtn.addEventListener('click', () => {
    checkWeather(searchBox.value.trim());
});

searchBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        checkWeather(searchBox.value.trim());
    }
});

// Load weather for default city on page load
window.addEventListener('load', () => {
    startTimeUpdates();
    checkWeather('London');
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .weather {
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .input_box:focus {
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
    }
    
    .weather-icon.updating {
        animation: spin 0.6s ease-in-out;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(0.8); }
        100% { transform: rotate(360deg) scale(1); }
    }
    
    .temp.updating {
        animation: pulse 0.4s ease-in-out;
    }
    
    .country.updating {
        animation: slideInFromTop 0.5s ease-out;
    }
    
    .details.updating .col {
        animation: slideInFromBottom 0.6s ease-out;
        animation-fill-mode: both;
    }
    
    .details.updating .col:nth-child(1) {
        animation-delay: 0.1s;
    }
    
    .details.updating .col:nth-child(2) {
        animation-delay: 0.2s;
    }
`;
document.head.appendChild(style);
