// server/routes/auth.js
import express from "express";
import Usuario from "../models/Usuario.js";
import { generarTokens } from "../config/jwt.js";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Registro (solo para primera configuración)
router.post("/register", async (req, res) => {
  try {
    const { email, password, nombre } = req.body;

    // Validaciones robustas
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Validar contraseña
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    // 4. 🔒 SEGURIDAD CRÍTICA: Solo permitir registro si NO hay usuarios
    const totalUsuarios = await Usuario.countDocuments();
    if (totalUsuarios > 0) {
      return res.status(403).json({
        error:
          "El registro de nuevos usuarios está desactivado. Contacte al administrador.",
      });
    }

    // 5. Verificar si el email ya existe (por si acaso)
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // 6. Crear usuario (el middleware de Mongoose cifrará la contraseña)
    const nuevoUsuario = new Usuario({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      rol: "administrador", // 👈 El primer usuario es siempre admin
    });

    await nuevoUsuario.save();

    // 7. Responder con éxito (sin exponer datos sensibles)
    res.status(201).json({
      message:
        "Usuario administrador creado exitosamente. Ya puede iniciar sesión.",
    });
  } catch (error) {
    console.error("Error en registro:", error);

    // Evitar filtrar errores internos
    if (error.code === 11000) {
      return res.status(400).json({
        error: "El email ya está registrado",
      });
    }

    res.status(500).json({
      error: "Error interno del servidor. Intente más tarde.",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario || !(await usuario.comparePassword(password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const { accessToken, refreshToken } = generarTokens(usuario);

    // Guardar refresh token en cookie httpOnly
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // No enviar el refresh token al frontend
    res.json({
      accessToken,
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// Refresh token
router.get("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ error: "No autorizado: refresh token no encontrado" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const { accessToken } = generarTokens(usuario);
    res.json({ accessToken });
  } catch (error) {
    console.error("Error en refresh:", error);
    res.status(401).json({ error: "Token de refresh inválido o expirado" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.json({ message: "Sesión cerrada correctamente" });
});

// Verificar sesión actual
router.get("/me", requireAuth, (req, res) => {
  // Esta ruta se usa con el middleware requireAuth
  res.status(200).json({ usuario: req.user });
});

export default router;
