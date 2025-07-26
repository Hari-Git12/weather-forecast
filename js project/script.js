// ✅ Use your actual WeatherAPI.com API key here
const API_KEY = 'c84d6d9e7b7947acaac115414252607';

const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const cityInput = document.getElementById('cityInput');
const resultDiv = document.getElementById('weatherResult');
const dropdown = document.getElementById('recentDropdown');

const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// 🔁 Load dropdown
function updateDropdown() {
  dropdown.innerHTML = '<option disabled selected>Recent Searches</option>';
  recentCities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    dropdown.appendChild(option);
  });
  dropdown.classList.toggle('hidden', recentCities.length === 0);
}

// 💾 Save city
function saveRecentCity(city) {
  if (!recentCities.includes(city)) {
    recentCities.unshift(city);
    if (recentCities.length > 5) recentCities.pop();
    localStorage.setItem('recentCities', JSON.stringify(recentCities));
  }
  updateDropdown();
}

// 🖼 Display weather data
function displayWeather(data) {
  try {
    const { location, current, forecast } = data;

    const currentHTML = `
      <h2 class="text-xl font-semibold">${location.name}, ${location.country}</h2>
      <img src="https:${current.condition.icon}" alt="${current.condition.text}" class="mx-auto" />
      <p class="text-lg">${current.temp_c}°C - ${current.condition.text}</p>
      <p>Humidity: ${current.humidity}% | Wind: ${current.wind_kph} km/h</p>
    `;

    let forecastHTML = `<h3 class="mt-4 font-bold">5-Day Forecast</h3><div class="grid grid-cols-2 gap-2 mt-2">`;
    forecast.forecastday.forEach(day => {
      forecastHTML += `
        <div class="bg-gray-100 p-2 rounded shadow">
          <p class="font-semibold">${day.date}</p>
          <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" class="mx-auto" />
          <p>${day.day.avgtemp_c}°C</p>
          <p>💧 ${day.day.avghumidity}% | 💨 ${day.day.maxwind_kph} km/h</p>
        </div>
      `;
    });
    forecastHTML += '</div>';

    resultDiv.innerHTML = currentHTML + forecastHTML;

  } catch (e) {
    resultDiv.innerHTML = `<p class="text-red-500 text-sm">Display error. Try another city.</p>`;
    console.error("Display Error:", e);
  }
}

// 🌐 Fetch weather with fallback
async function fetchWeather(city) {
  try {
    if (!city || city.trim() === "") throw new Error("City name is empty");

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=5`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'API error');
    }

    displayWeather(data);
    saveRecentCity(city);

  } catch (err) {
    console.warn(`Error for "${city}":`, err.message);

    try {
      const fallback = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=Hyderabad&days=5`);
      const fallbackData = await fallback.json();

      if (!fallback.ok || fallbackData.error) {
        throw new Error(fallbackData.error?.message || 'Fallback failed');
      }

      displayWeather(fallbackData);
      resultDiv.innerHTML += `<p class="text-red-500 text-sm mt-2">City not found or API error. Showing Hyderabad instead.</p>`;
    } catch (fallbackErr) {
      resultDiv.innerHTML = `<p class="text-red-600">🚫 Severe error. Weather data could not be loaded.</p>`;
      console.error("Fallback Error:", fallbackErr.message);
    }
  }
}

// 🔘 Search button
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }
  fetchWeather(city);
});

// 🔽 Dropdown
dropdown.addEventListener('change', (e) => {
  fetchWeather(e.target.value);
});

// 📍 Geolocation
geoBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const locationQuery = `${latitude},${longitude}`;
      fetchWeather(locationQuery);
    }, () => {
      alert("Location access denied. Please allow location access.");
    });
  } else {
    alert("Geolocation not supported in this browser.");
  }
});

// 🚀 On page load
if (recentCities.length) {
  fetchWeather(recentCities[0]);
} else {
  fetchWeather("Hyderabad");
}
updateDropdown();
