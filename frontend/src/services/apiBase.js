// Falls back to localhost for local single-machine dev; set VITE_API_BASE_URL
// (e.g. in a .env file) to reach a backend on another host, such as when
// testing from a phone or another computer on the network.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
