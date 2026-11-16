/* =========================================
   1. DOM ELEMENTS
========================================= */

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");

const weatherLocation = document.getElementById("weatherLocation");
const currentDate = document.getElementById("currentDate");
const temperature = document.getElementById("temperature");
const weatherCondition = document.getElementById("weatherCondition");

const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");

const humidityDetail = document.getElementById("humidityDetail");
const windDetail = document.getElementById("windDetail");
const feelsDetail = document.getElementById("feelsDetail");

const forecastGrid = document.getElementById("forecastGrid");

const recentList = document.getElementById("recentList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const themeToggle = document.getElementById("themeToggle");


/* =========================================
   2. API URLS
========================================= */

const GEOCODING_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";


/* =========================================
   3. APPLICATION DATA
========================================= */

let recentSearches =
    JSON.parse(localStorage.getItem("weatherHistory")) || [];


/* =========================================
   4. DATE FUNCTION
========================================= */

function displayDate() {

    const today = new Date();

    currentDate.textContent = today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

}

displayDate();


/* =========================================
   5. WEATHER CONDITION FUNCTION
========================================= */

function getWeatherInfo(code, isDay = 1) {

    if (code === 0) {
        return {
            text: "Clear Sky",
            icon: isDay
                ? "fa-sun"
                : "fa-moon"
        };
    }

    if (code === 1) {
        return {
            text: "Mainly Clear",
            icon: isDay
                ? "fa-cloud-sun"
                : "fa-cloud-moon"
        };
    }

    if (code === 2) {
        return {
            text: "Partly Cloudy",
            icon: isDay
                ? "fa-cloud-sun"
                : "fa-cloud-moon"
        };
    }

    if (code === 3) {
        return {
            text: "Overcast",
            icon: "fa-cloud"
        };
    }

    if (code === 45 || code === 48) {
        return {
            text: "Foggy",
            icon: "fa-smog"
        };
    }

    if (code >= 51 && code <= 57) {
        return {
            text: "Drizzle",
            icon: "fa-cloud-rain"
        };
    }

    if (code >= 61 && code <= 67) {
        return {
            text: "Rain",
            icon: "fa-cloud-showers-heavy"
        };
    }

    if (code === 71 || code === 73 || code === 75 || code === 77) {
        return {
            text: "Snow",
            icon: "fa-snowflake"
        };
    }

    if (code >= 80 && code <= 82) {
        return {
            text: "Rain Showers",
            icon: "fa-cloud-showers-heavy"
        };
    }

    if (code === 85 || code === 86) {
        return {
            text: "Snow Showers",
            icon: "fa-snowflake"
        };
    }

    if (code >= 95 && code <= 99) {
        return {
            text: "Thunderstorm",
            icon: "fa-cloud-bolt"
        };
    }

    return {
        text: "Unknown Weather",
        icon: "fa-cloud"
    };

}


/* =========================================
   6. SEARCH CITY
========================================= */

async function searchCity(city) {

    try {

        errorMessage.style.display = "none";
        loadingMessage.style.display = "block";

        searchBtn.disabled = true;
        searchBtn.textContent = "Searching...";

        // Get city coordinates

        const geoResponse = await fetch(
            `${GEOCODING_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        if (!geoResponse.ok) {
            throw new Error("Unable to connect to the location service.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please check the spelling and try again.");
        }

        const location = geoData.results[0];

        const latitude = location.latitude;
        const longitude = location.longitude;

        // Get weather information

        const weatherResponse = await fetch(
            `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
        );

        if (!weatherResponse.ok) {
            throw new Error("Unable to fetch weather information.");
        }

        const weatherData = await weatherResponse.json();

        // Display weather information

        displayWeather(location, weatherData);

        // Save recent search

        saveRecentSearch(location.name);

        // Clear input

        cityInput.value = "";

    }

    catch (error) {

        errorMessage.textContent =
            error.message || "Something went wrong. Please try again.";

        errorMessage.style.display = "block";

    }

    finally {

        loadingMessage.style.display = "none";

        searchBtn.disabled = false;

        searchBtn.innerHTML =
            'Search <i class="fa-solid fa-arrow-right"></i>';

    }

}


/* =========================================
   7. DISPLAY CURRENT WEATHER
========================================= */

function displayWeather(location, data) {

    const current = data.current;

    const weatherInfo = getWeatherInfo(
        current.weather_code,
        current.is_day
    );

    // Location

    weatherLocation.textContent =
        `${location.name}, ${location.country}`;

    // Temperature

    temperature.textContent =
        `${Math.round(current.temperature_2m)}°C`;

    // Weather condition

    weatherCondition.textContent = weatherInfo.text;

    // Weather icon

    const mainIcon = document.querySelector(".main-weather-icon");

    mainIcon.innerHTML =
        `<i class="fa-solid ${weatherInfo.icon}"></i>`;

    // Feels like temperature

    const feels = `${Math.round(current.apparent_temperature)}°C`;

    feelsLike.textContent = feels;
    feelsDetail.textContent = feels;

    // Humidity

    const humidityValue =
        `${current.relative_humidity_2m}%`;

    humidity.textContent = humidityValue;
    humidityDetail.textContent = humidityValue;

    // Wind speed

    const wind = `${Math.round(current.wind_speed_10m)} km/h`;

    windSpeed.textContent = wind;
    windDetail.textContent = wind;

    // Display forecast

    displayForecast(data.daily);

}


/* =========================================
   8. DISPLAY 5-DAY FORECAST
========================================= */

function displayForecast(daily) {

    forecastGrid.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {

        const date = new Date(
            daily.time[i] + "T12:00:00"
        );

        const day = date.toLocaleDateString("en-IN", {
            weekday: "short"
        });

        const weatherInfo = getWeatherInfo(
            daily.weather_code[i]
        );

        const maxTemp =
            Math.round(daily.temperature_2m_max[i]);

        const minTemp =
            Math.round(daily.temperature_2m_min[i]);

        const forecastCard = document.createElement("div");

        forecastCard.className = "forecast-card";

        forecastCard.innerHTML = `

            <h3>${day}</h3>

            <div class="forecast-icon">
                <i class="fa-solid ${weatherInfo.icon}"></i>
            </div>

            <p class="forecast-condition">
                ${weatherInfo.text}
            </p>

            <div class="forecast-temperatures">

                <span>${maxTemp}°</span>

                <span class="min-temp">${minTemp}°</span>

            </div>

        `;

        forecastGrid.appendChild(forecastCard);

    }

}


/* =========================================
   9. SEARCH FORM EVENT
========================================= */

searchForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const city = cityInput.value.trim();

    if (city === "") {

        errorMessage.textContent =
            "Please enter a city name.";

        errorMessage.style.display = "block";

        return;

    }

    searchCity(city);

});


/* =========================================
   10. RECENT SEARCHES
========================================= */

function saveRecentSearch(city) {

    recentSearches = recentSearches.filter(
        item => item.toLowerCase() !== city.toLowerCase()
    );

    recentSearches.unshift(city);

    // Keep only the latest 5 searches

    recentSearches = recentSearches.slice(0, 5);

    localStorage.setItem(
        "weatherHistory",
        JSON.stringify(recentSearches)
    );

    displayRecentSearches();

}


function displayRecentSearches() {

    recentList.innerHTML = "";

    if (recentSearches.length === 0) {

        recentList.innerHTML =
            "<p>No recent searches yet.</p>";

        return;

    }

    recentSearches.forEach(city => {

        const chip = document.createElement("button");

        chip.className = "recent-chip";

        chip.textContent = city;

        chip.addEventListener("click", function () {

            searchCity(city);

        });

        recentList.appendChild(chip);

    });

}


// Load recent searches when website opens

displayRecentSearches();


/* =========================================
   11. CLEAR SEARCH HISTORY
========================================= */

clearHistoryBtn.addEventListener("click", function () {

    recentSearches = [];

    localStorage.removeItem("weatherHistory");

    displayRecentSearches();

});


/* =========================================
   12. DARK MODE
========================================= */

function updateThemeIcon() {

    const isDark =
        document.body.classList.contains("dark-mode");

    themeToggle.innerHTML = isDark
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';

}


// Load saved theme

const savedTheme = localStorage.getItem("weatherTheme");

if (savedTheme === "dark") {

    document.body.classList.add("dark-mode");

}

updateThemeIcon();


// Theme toggle button

themeToggle.addEventListener("click", function () {

    document.body.classList.toggle("dark-mode");

    const isDark =
        document.body.classList.contains("dark-mode");

    localStorage.setItem(
        "weatherTheme",
        isDark ? "dark" : "light"
    );

    updateThemeIcon();

});


/* =========================================
   13. INITIAL SETUP
========================================= */

console.log("Weatherly application loaded successfully!");