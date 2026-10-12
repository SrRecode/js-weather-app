import test from 'node:test';
import assert from 'node:assert/strict';

import {
  API_BASE,
  buildRequestUrl,
  formatTemperature,
  windDirection,
  openWeatherIconUrl,
  describeWeather,
  weatherError,
  formatTime,
} from '../src/weather.js';
import { fetchWeather } from '../src/api.js';

const SAMPLE = {
  name: 'London',
  sys: { country: 'GB', sunrise: 1600000000, sunset: 1600040000 },
  main: { temp: 15.4, feels_like: 14.1, temp_min: 14, temp_max: 17, humidity: 72, pressure: 1012 },
  weather: [{ main: 'Clouds', description: 'overcast clouds', icon: '04d' }],
  wind: { speed: 4.6, deg: 220 },
  dt: 1600020000,
  timezone: 3600,
};

test('buildRequestUrl validates and encodes input', () => {
  const url = buildRequestUrl({ city: 'New York', apiKey: 'key123', units: 'imperial' });
  assert.ok(url.startsWith(API_BASE));
  assert.match(url, /q=New\+York/);
  assert.match(url, /appid=key123/);
  assert.match(url, /units=imperial/);
});

test('buildRequestUrl throws on missing city / key and bad units', () => {
  assert.throws(() => buildRequestUrl({ city: '', apiKey: 'k' }), /city name/);
  assert.throws(() => buildRequestUrl({ city: 'Paris', apiKey: '' }), /API key/);
  assert.throws(() => buildRequestUrl({ city: 'Paris', apiKey: 'k', units: 'kelvins' }), /Unknown units/);
});

test('formatTemperature rounds and adds the unit symbol', () => {
  assert.equal(formatTemperature(15.6, 'metric'), '16°C');
  assert.equal(formatTemperature(15.6, 'imperial'), '16°F');
  assert.equal(formatTemperature(NaN), '—');
});

test('windDirection maps degrees to compass points', () => {
  assert.equal(windDirection(0), 'N');
  assert.equal(windDirection(90), 'E');
  assert.equal(windDirection(180), 'S');
  assert.equal(windDirection(225), 'SW');
  assert.equal(windDirection(359), 'N');
  assert.equal(windDirection(NaN), '');
});

test('openWeatherIconUrl builds a scaled icon url', () => {
  assert.equal(openWeatherIconUrl('04d'), 'https://openweathermap.org/img/wn/04d@2x.png');
  assert.equal(openWeatherIconUrl(''), '');
});

test('describeWeather flattens the payload', () => {
  const w = describeWeather(SAMPLE);
  assert.equal(w.city, 'London');
  assert.equal(w.country, 'GB');
  assert.equal(w.temperature, 15.4);
  assert.equal(w.description, 'overcast clouds');
  assert.equal(w.icon, '04d');
  assert.equal(w.humidity, 72);
  assert.equal(w.windDeg, 220);
});

test('describeWeather rejects malformed payloads', () => {
  assert.throws(() => describeWeather(null), /Unexpected weather response/);
  assert.throws(() => describeWeather({ main: {} }), /Unexpected weather response/);
});

test('weatherError maps status codes to messages', () => {
  assert.match(weatherError(401), /Invalid API key/);
  assert.match(weatherError(404), /City not found/);
  assert.match(weatherError(429), /Too many requests/);
  assert.match(weatherError(503), /unavailable/);
});

test('formatTime applies the timezone offset', () => {
  assert.equal(formatTime(0, 0), '00:00');
  assert.equal(formatTime(3600, 3600), '02:00');
  assert.equal(formatTime(undefined), '—');
});

test('fetchWeather returns normalized data on success', async () => {
  const fake = async () => ({ ok: true, status: 200, json: async () => SAMPLE });
  const w = await fetchWeather({ city: 'London', apiKey: 'k' }, fake);
  assert.equal(w.city, 'London');
});

test('fetchWeather surfaces API errors and network failures', async () => {
  const notFound = async () => ({ ok: false, status: 404, json: async () => ({}) });
  await assert.rejects(() => fetchWeather({ city: 'Nowhere', apiKey: 'k' }, notFound), /City not found/);

  const boom = async () => { throw new Error('offline'); };
  await assert.rejects(() => fetchWeather({ city: 'London', apiKey: 'k' }, boom), /check your connection/);
});
