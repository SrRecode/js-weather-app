// Pure helpers for talking to the OpenWeather Current Weather API.
// No network calls happen here, so everything is straightforward to test.

export const API_BASE = 'https://api.openweathermap.org/data/2.5/weather';

export const UNITS = {
  metric: { symbol: '°C', speed: 'm/s', label: 'Celsius' },
  imperial: { symbol: '°F', speed: 'mph', label: 'Fahrenheit' },
  standard: { symbol: 'K', speed: 'm/s', label: 'Kelvin' },
};

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/**
 * Build the request URL for current weather.
 * @param {{ city: string, apiKey: string, units?: string, lang?: string }} options
 */
export function buildRequestUrl({ city, apiKey, units = 'metric', lang = 'en' }) {
  if (!city || !String(city).trim()) throw new Error('Enter a city name');
  if (!apiKey || !String(apiKey).trim()) throw new Error('An OpenWeather API key is required');
  if (!UNITS[units]) throw new Error(`Unknown units: ${units}`);

  const params = new URLSearchParams({
    q: String(city).trim(),
    appid: String(apiKey).trim(),
    units,
    lang,
  });
  return `${API_BASE}?${params.toString()}`;
}

/** Format a numeric temperature for display, e.g. 21.6 -> "22°". */
export function formatTemperature(value, units = 'metric') {
  const symbol = (UNITS[units] ?? UNITS.metric).symbol;
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return `${Math.round(value)}${symbol}`;
}

/** Convert a wind bearing in degrees to a 16-point compass direction. */
export function windDirection(deg) {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return '';
  const index = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS[index];
}

/** Public URL for an OpenWeather icon code. */
export function openWeatherIconUrl(icon, scale = 2) {
  if (!icon) return '';
  return `https://openweathermap.org/img/wn/${icon}@${scale}x.png`;
}

/**
 * Normalize an OpenWeather "current weather" payload into a flat shape the UI
 * can render without knowing the API's structure.
 */
export function describeWeather(data) {
  if (!data || !data.main || !Array.isArray(data.weather) || data.weather.length === 0) {
    throw new Error('Unexpected weather response');
  }
  const { main, weather, wind, sys, name, dt, timezone } = data;
  const first = weather[0];
  return {
    city: name ?? '',
    country: sys?.country ?? '',
    temperature: main.temp,
    feelsLike: main.feels_like,
    tempMin: main.temp_min,
    tempMax: main.temp_max,
    humidity: main.humidity,
    pressure: main.pressure,
    description: first.description ?? '',
    main: first.main ?? '',
    icon: first.icon ?? '',
    windSpeed: wind?.speed ?? 0,
    windDeg: wind?.deg ?? null,
    sunrise: sys?.sunrise ?? null,
    sunset: sys?.sunset ?? null,
    updatedAt: dt ?? null,
    timezoneOffset: timezone ?? 0,
  };
}

/** Map an HTTP status from the API to a human-friendly message. */
export function weatherError(status) {
  if (status === 401) return 'Invalid API key. New keys can take up to a few hours to activate.';
  if (status === 404) return 'City not found. Check the spelling and try again.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'The weather service is unavailable right now. Try again shortly.';
  return 'Could not fetch the weather. Please check your connection and try again.';
}

/** Format a unix timestamp + offset into a local "HH:MM" string. */
export function formatTime(unixSeconds, timezoneOffsetSeconds = 0) {
  if (typeof unixSeconds !== 'number') return '—';
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
