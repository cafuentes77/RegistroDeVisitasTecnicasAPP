import jwt from "jsonwebtoken";

export const generarTokens = (usuario) => {
  const payload = {
    id: usuario._id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};
