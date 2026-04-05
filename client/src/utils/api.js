// client/src/utils/api.js
import axios from "axios";

// Detectar entorno con Vite
const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://api.segurpro.cl"
    : "http://localhost:3001";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api; // ← ¡Exportación por defecto!
