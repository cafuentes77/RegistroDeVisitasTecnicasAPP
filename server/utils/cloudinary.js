import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import https from "https";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// 👇 Solución universal para ES Modules + SSL
if (process.env.NODE_ENV === "development") {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  // Aplica el agente a las propiedades que SÍ existen
  if (
    cloudinary.uploader &&
    typeof cloudinary.uploader._setAgent === "function"
  ) {
    // Versión más reciente: usa _setAgent
    cloudinary.uploader._setAgent(agent);
    cloudinary.api._setAgent(agent);
  } else if (cloudinary.uploader) {
    // Versión anterior: asigna directamente
    cloudinary.uploader._agent = agent;
    cloudinary.api._agent = agent;
  }
}

// server/utils/cloudinary.js (agrega esto al final)
const extractPublicId = (url) => {
  if (!url) return null;
  try {
    // Ej: https://res.cloudinary.com/.../v1234567890/nombre.jpg
    const match = url.match(/\/v\d+\/(.+)\./);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
};

export { extractPublicId };
export default cloudinary;
