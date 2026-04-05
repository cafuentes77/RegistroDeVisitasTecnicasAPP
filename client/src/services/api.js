// client/src/services/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://api.segurpro.cl"
    : "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE_URL,
});
