// Centralized runtime configuration for the frontend.
// Use Vite's `import.meta.env` (must have VITE_ prefix) to access values.
const get = (key, fallback = '') => import.meta.env[key] ?? fallback

export const APP_NAME = get('VITE_APP_NAME', 'InferiaApp')
export const API_BASE = get('VITE_API_BASE_URL', '/v1')

export default {
  APP_NAME,
  API_BASE
}
