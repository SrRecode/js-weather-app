import { fetchWeather } from './api.js';
import {
  UNITS,
  formatTemperature,
  windDirection,
  openWeatherIconUrl,
  formatTime,
} from './weather.js';

const KEY_STORAGE = 'js-weather-app.apikey';
const RECENTS_STORAGE = 'js-weather-app.recents';
const UNIT_STORAGE = 'js-weather-app.units';

const form = document.getElementById('search-form');
const cityInput = document.getElementById('city');
const unitsSelect = document.getElementById('units');
const apiKeyInput = document.getElementById('apikey');
const errorEl = document.getElementById('error');
const recentsEl = document.getElementById('recents');
const resultEl = document.getElementById('result');

const field = {
  city: document.getElementById('r-city'),
  desc: document.getElementById('r-desc'),
  icon: document.getElementById('r-icon'),
  temp: document.getElementById('r-temp'),
  feels: document.getElementById('r-feels'),
  humidity: document.getElementById('r-humidity'),
  wind: document.getElementById('r-wind'),
  pressure: document.getElementById('r-pressure'),
  sunrise: document.getElementById('r-sunrise'),
  sunset: document.getElementById('r-sunset'),
  updated: document.getElementById('r-updated'),
};

apiKeyInput.value = localStorage.getItem(KEY_STORAGE) ?? '';
unitsSelect.value = localStorage.getItem(UNIT_STORAGE) ?? 'metric';

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  resultEl.hidden = true;
}

function clearError() {
  errorEl.hidden = true;
  errorEl.textContent = '';
}

function renderRecents(cities) {
  recentsEl.replaceChildren(
    ...cities.map((city) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = city;
      button.addEventListener('click', () => {
        cityInput.value = city;
        form.requestSubmit();
      });
      li.append(button);
      return li;
    }),
  );
}

function pushRecent(city) {
  const key = city.toLowerCase();
  const cities = (JSON.parse(localStorage.getItem(RECENTS_STORAGE)) ?? []).filter(
    (item) => item.toLowerCase() !== key,
  );
  cities.unshift(city);
  const trimmed = cities.slice(0, 6);
  localStorage.setItem(RECENTS_STORAGE, JSON.stringify(trimmed));
  renderRecents(trimmed);
}

function render(weather, units) {
  const place = weather.country ? `${weather.city}, ${weather.country}` : weather.city;
  field.city.textContent = place;
  field.desc.textContent = weather.description;
  field.icon.src = openWeatherIconUrl(weather.icon);
  field.icon.alt = weather.description;
  field.temp.textContent = formatTemperature(weather.temperature, units);
  field.feels.textContent = `Feels like ${formatTemperature(weather.feelsLike, units)}`;
  field.humidity.textContent = `${weather.humidity}%`;

  const dir = windDirection(weather.windDeg);
  field.wind.textContent = `${weather.windSpeed} ${UNITS[units].speed}${dir ? ` ${dir}` : ''}`;

  field.pressure.textContent = `${weather.pressure} hPa`;
  field.sunrise.textContent = formatTime(weather.sunrise, weather.timezoneOffset);
  field.sunset.textContent = formatTime(weather.sunset, weather.timezoneOffset);
  field.updated.textContent = formatTime(weather.updatedAt, weather.timezoneOffset);

  resultEl.hidden = false;
}

apiKeyInput.addEventListener('change', () => {
  const value = apiKeyInput.value.trim();
  if (value) localStorage.setItem(KEY_STORAGE, value);
  else localStorage.removeItem(KEY_STORAGE);
});

unitsSelect.addEventListener('change', () => {
  localStorage.setItem(UNIT_STORAGE, unitsSelect.value);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const city = cityInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const units = unitsSelect.value;

  if (!apiKey) {
    document.getElementById('key-panel').open = true;
    showError('Add your OpenWeather API key first (open the panel above).');
    return;
  }

  const button = form.querySelector('.search__button');
  button.disabled = true;
  button.textContent = '…';

  try {
    const weather = await fetchWeather({ city, apiKey, units });
    render(weather, units);
    pushRecent(city);
  } catch (error) {
    showError(error.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Search';
  }
});

renderRecents(JSON.parse(localStorage.getItem(RECENTS_STORAGE)) ?? []);
