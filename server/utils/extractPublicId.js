// server/utils/extractPublicId.js
export const extractPublicId = (url) => {
  try {
    const lastPart = url.split('/').pop(); // "v1712345678_carpeta_nombre.jpg"
    const withoutVersion = lastPart.replace(/^v\d+_/, ''); // "carpeta_nombre.jpg"
    const publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf('.')); // "carpeta_nombre"
    return publicId;
  } catch (e) {
    console.error('Error extrayendo public_id:', url);
    return null;
  }
};