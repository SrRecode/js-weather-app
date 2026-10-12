# Weather App

A small, dependency-free weather app. Enter a city and see the current
conditions — temperature, feels-like, humidity, wind, pressure and sunrise/sunset.
Powered by the [OpenWeather Current Weather API](https://openweathermap.org/current).

## Features

- Search current weather for any city by name
- Metric (°C), Imperial (°F) and Standard (K) units
- Feels-like temperature, humidity, wind speed with compass direction, pressure
- Sunrise, sunset and last-updated times, adjusted to the city's timezone
- Recent-city chips for one-tap repeat searches
- Your API key is stored **only in your browser** (`localStorage`) — never in the repo
- Clear, human-friendly error messages for invalid keys, unknown cities and rate limits

## Getting started

No build step and no dependencies are required for the app itself — the only
prerequisite is a free OpenWeather API key.

1. Create a free API key at <https://openweathermap.org/api>.
2. Serve the folder over HTTP (ES modules do not load from `file://`):

   ```bash
   npm start        # runs: npx --yes serve .
   ```

   Or use any static server, e.g. `python -m http.server`.
3. Open the served URL, expand **OpenWeather API key**, paste your key, then search.

> Newly created OpenWeather keys can take up to a couple of hours to become active.
> If you get an "Invalid API key" message right after signing up, wait and retry.

## Project layout

```
index.html          Markup and structure
styles.css          Styling (dark theme, responsive)
src/weather.js      Pure helpers: URL building, formatting, response normalization
src/api.js          fetchWeather() — network layer with an injectable fetch
src/ui.js           DOM wiring: form, settings, rendering, recents
test/weather.test.js  Unit tests (node:test)
```

The logic is split so that everything except `ui.js` is platform-agnostic and
testable in Node — no DOM or network needed for the test suite.

## Tests

```bash
npm test          # runs: node --test
```

Covers URL construction and validation, temperature formatting, wind-direction
conversion, payload normalization, error mapping and the `fetchWeather` flow
(using an injected fake fetch — no real network calls).

## How it works

`buildRequestUrl()` assembles the OpenWeather request and validates its inputs.
`fetchWeather()` performs the request and hands the raw payload to
`describeWeather()`, which flattens it into a simple object. `ui.js` renders that
object and maps failures through `weatherError(status)` for readable messages.

## License

MIT
