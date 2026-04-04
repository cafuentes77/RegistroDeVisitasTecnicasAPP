const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://segurpro-backend.onrender.com" // ← ¡Esta debe ser la URL real!
    : "http://localhost:3001";
