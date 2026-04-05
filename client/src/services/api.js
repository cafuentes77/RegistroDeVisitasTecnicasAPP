// client/src/services/api.js
import axios from "axios";

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.segurpro.cl"
    : "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE_URL,
});
