import { buildRequestUrl, describeWeather, weatherError } from './weather.js';

/**
 * Fetch current weather and return the normalized object.
 * `fetchImpl` is injectable so the function can be unit tested without a network.
 * @param {{ city: string, apiKey: string, units?: string, lang?: string }} options
 * @param {typeof fetch} [fetchImpl]
 */
export async function fetchWeather(options, fetchImpl = fetch) {
  const url = buildRequestUrl(options);
  let response;
  try {
    response = await fetchImpl(url);
  } catch {
    throw new Error(weatherError(0));
  }
  if (!response.ok) {
    throw new Error(weatherError(response.status));
  }
  const data = await response.json();
  return describeWeather(data);
}
