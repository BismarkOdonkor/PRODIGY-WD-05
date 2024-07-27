const apiKey = 'ca2256ce3a39a06f1962e03ff4368b43'; // Replace with your OpenWeatherMap API key
const getWeatherButton = document.getElementById('get-weather');
const getLocationButton = document.getElementById('get-location');
const toggleUnitButton = document.getElementById('toggle-unit');
const locationInput = document.getElementById('location-input');
const weatherInfo = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast');
const loadingIndicator = document.getElementById('loading');
const locationElement = document.getElementById('location');
const weatherIconElement = document.getElementById('weather-icon');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('wind-speed');
const uvIndexElement = document.getElementById('uv-index');
const visibilityElement = document.getElementById('visibility');
const sunriseElement = document.getElementById('sunrise');
const sunsetElement = document.getElementById('sunset');
const alertsElement = document.getElementById('alerts');
const shareButton = document.getElementById('share-button');
const historyList = document.getElementById('history-list');
const weatherGraph = document.getElementById('weather-graph');

let isMetric = true;

// Load user preferences from local storage
document.addEventListener('DOMContentLoaded', () => {
    const savedUnit = localStorage.getItem('unit');
    const savedLocation = localStorage.getItem('location');

    if (savedUnit) {
        isMetric = savedUnit === 'metric';
        toggleUnitButton.textContent = isMetric ? '°C' : '°F';
    }

    if (savedLocation) {
        locationInput.value = savedLocation;
        fetchWeather(savedLocation);
    }

    loadSearchHistory();
});

getWeatherButton.addEventListener('click', () => {
    const location = locationInput.value;
    if (location) {
        localStorage.setItem('location', location);
        fetchWeather(location);
        addToSearchHistory(location);
    }
});

getLocationButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoordinates(latitude, longitude);
        }, () => {
            alert('Unable to retrieve your location.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
});

toggleUnitButton.addEventListener('click', () => {
    isMetric = !isMetric;
    localStorage.setItem('unit', isMetric ? 'metric' : 'imperial');
    toggleUnitButton.textContent = isMetric ? '°C' : '°F';
    displayWeather();
});

shareButton.addEventListener('click', () => {
    const weatherInfoText = `
        Weather in ${locationElement.textContent}:
        ${temperatureElement.textContent}, ${descriptionElement.textContent}
    `;
    if (navigator.share) {
        navigator.share({
            title: 'Weather Info',
            text: weatherInfoText,
        }).then(() => {
            console.log('Weather info shared successfully');
        }).catch((error) => {
            console.error('Error sharing:', error);
        });
    } else {
        alert('Sharing not supported in this browser. Copy this text to share:\n' + weatherInfoText);
    }
});

function fetchWeather(location) {
    showLoading();
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=${isMetric ? 'metric' : 'imperial'}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('City not found');
            }
            return response.json();
        })
        .then(data => {
            fetchForecast(data.coord.lat, data.coord.lon);
            displayWeather(data);
            displayWeatherGraph(data.name);
        })
        .catch(error => {
            alert(error.message);
        })
        .finally(() => {
            hideLoading();
        });
}

function fetchWeatherByCoordinates(lat, lon) {
    showLoading();
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${isMetric ? 'metric' : 'imperial'}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Unable to retrieve weather data');
            }
            return response.json();
        })
        .then(data => {
            fetchForecast(data.coord.lat, data.coord.lon);
            displayWeather(data);
            displayWeatherGraph(data.name);
        })
        .catch(error => {
            alert(error.message);
        })
        .finally(() => {
            hideLoading();
        });
}

function fetchForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${isMetric ? 'metric' : 'imperial'}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayForecast(data.list);
        });
}

function displayWeather(data) {
    if (data) {
        locationElement.textContent = `${data.name}, ${data.sys.country}`;
        temperatureElement.textContent = `Temperature: ${data.main.temp} ${isMetric ? '°C' : '°F'}`;
        descriptionElement.textContent = `Condition: ${data.weather[0].description}`;
        humidityElement.textContent = `Humidity: ${data.main.humidity}%`;
        windSpeedElement.textContent = `Wind Speed: ${data.wind.speed} ${isMetric ? 'm/s' : 'mph'}`;
        uvIndexElement.textContent = `UV Index: ${data.uvi || 'N/A'}`;
        visibilityElement.textContent = `Visibility: ${(data.visibility / 1000).toFixed(1)} km`;
        sunriseElement.textContent = `Sunrise: ${formatTime(data.sys.sunrise)}`;
        sunsetElement.textContent = `Sunset: ${formatTime(data.sys.sunset)}`;
        weatherIconElement.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
        
        // Display alerts if available
        alertsElement.textContent = data.alerts ? data.alerts[0].description : '';

        // Lazy load background image based on weather condition
        document.body.style.backgroundImage = `url('https://source.unsplash.com/1600x900/?${data.weather[0].description}')`;
    }
    
    weatherInfo.style.display = 'block';
}

function displayForecast(forecast) {
    forecastContainer.innerHTML = ''; // Clear previous forecast
    forecast.forEach(item => {
        if (item.dt_txt.includes("15:00:00")) { // Only show forecasts at 3 PM
            const forecastItem = document.createElement('div');
            forecastItem.classList.add('forecast-item');
            forecastItem.innerHTML = `
                <p>${formatDate(item.dt_txt)}</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather Icon" />
                <p>${item.weather[0].description}</p>
                <p>${item.main.temp} ${isMetric ? '°C' : '°F'}</p>
            `;
            forecastContainer.appendChild(forecastItem);
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1} - ${date.getHours()}:00`;
}

function formatTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showLoading() {
    loadingIndicator.style.display = 'block';
    weatherInfo.style.display = 'none';
    forecastContainer.innerHTML = '';
    weatherGraph.innerHTML = '';
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
}

// Search History Feature
function addToSearchHistory(location) {
    const historyItem = document.createElement('li');
    historyItem.textContent = location;
    historyItem.onclick = () => {
        locationInput.value = location;
        fetchWeather(location);
    };
    historyList.appendChild(historyItem);
    saveSearchHistory();
}

function loadSearchHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    history.forEach(location => {
        addToSearchHistory(location);
    });
}

function saveSearchHistory() {
    const history = Array.from(historyList.children).map(item => item.textContent);
    localStorage.setItem('searchHistory', JSON.stringify(history));
}

// ...

function displayWeatherGraph(location) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=${isMetric ? 'metric' : 'imperial'}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const labels = data.list.map(item => formatDate(item.dt_txt));
            const temperatures = data.list.map(item => item.main.temp);

            // Create the chart only if the canvas is visible
            if (weatherGraph.offsetParent !== null) {
                new Chart(weatherGraph, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Temperature',
                            data: temperatures,
                            borderColor: '#4CAF50',
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: false
                            }
                        }
                    }
                });
            }
        });
}

// ...