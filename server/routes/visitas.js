// server/routes/visitas.js
import express from "express";
import multer from "multer";
import Visita from "../models/Visita.js";
import { sendVisitEmail } from "../utils/sendEmail.js";
import { extractPublicId } from "../utils/extractPublicId.js";
import cloudinary from "../utils/cloudinary.js";
import { unlink } from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { requireAuth } from "../middleware/auth.js";

dotenv.config();

const router = express.Router();

// Correos por defecto desde .env (solo para BCC)
const CORREOS_POR_DEFECTO = process.env.CORREOS_POR_DEFECTO
  ? process.env.CORREOS_POR_DEFECTO.split(",").map((email) => email.trim())
  : [];

// Validación: solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // aceptar archivo
  } else {
    cb(
      new Error("Solo se permiten imágenes (JPEG, PNG, GIF, WEBP, etc.)"),
      false
    );
  }
};

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  }, // Límite de 10MB por archivo
});

// Subir archivos a Cloudinary
const uploadFilesToCloudinary = async (files) => {
  const urls = [];
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "visitas_clientes",
        resource_type: "auto",
      });
      urls.push(result.secure_url);
      await unlink(file.path);
    } catch (error) {
      console.error("Error al subir a Cloudinary:", error);
      await unlink(file.path).catch(() => {});
    }
  }
  return urls;
};

// Genera un folio único: V-YYYYMMDD-XXXXX
const generarFolio = () => {
  const fecha = new Date();
  const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, ""); // 20251116
  const random = Math.floor(10000 + Math.random() * 90000); // 5 dígitos
  return `V-${fechaStr}-${random}`;
};

// Crear visita
router.post("/", requireAuth, upload.array("fotos", 10), async (req, res) => {
  try {
    let fotosUrls = [];
    if (req.files && req.files.length > 0) {
      fotosUrls = await uploadFilesToCloudinary(req.files);
    }

    const emailsUsuario = JSON.parse(req.body.emailsNotificacion).filter(
      (email) => email.trim() !== ""
    );

    const visita = new Visita({
      folio: generarFolio(),
      folioEditado: false,
      rutEmpresa: req.body.rutEmpresa,
      nombreEmpresa: req.body.nombreEmpresa,
      tipoVisita: req.body.tipoVisita,
      comentario: req.body.comentario,
      fotos: fotosUrls,
      emailsNotificacion: emailsUsuario, // Solo los del cliente
      creador: req.user.id,
    });

    await visita.save();

    // ✅ Envía: cliente en "To", tus correos en "Bcc"
    await sendVisitEmail(
      emailsUsuario,
      CORREOS_POR_DEFECTO,
      visita,
      "creación"
    );

    res.status(201).json(visita);
  } catch (error) {
    console.error("❌ Error al crear visita:", error);
    res.status(400).json({ error: error.message });
  }
});

// Actualizar visita
router.put("/:id", requireAuth, upload.array("fotos", 10), async (req, res) => {
  try {
    const visitaExistente = await Visita.findById(req.params.id);
    if (!visitaExistente)
      return res.status(404).json({ error: "Visita no encontrada" });
    if (
      visitaExistente.creador.toString() !== req.user.id &&
      req.user.rol !== "administrador"
    ) {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    let nuevasFotosUrls = [];
    if (req.files && req.files.length > 0) {
      nuevasFotosUrls = await uploadFilesToCloudinary(req.files);
    }

    const todasFotos = [...visitaExistente.fotos, ...nuevasFotosUrls];

    const emailsUsuario = JSON.parse(req.body.emailsNotificacion).filter(
      (email) => email.trim() !== ""
    );

    let folioActualizado = visitaExistente.folio;
    let folioEditadoActualizado = visitaExistente.folioEditado;

    if (req.body.folio && req.body.folio.trim() !== visitaExistente.folio) {
      // En producción: solo si NO ha sido editado antes
      if (process.env.NODE_ENV === "production") {
        if (!visitaExistente.folioEditado) {
          folioActualizado = req.body.folio.trim();
          folioEditadoActualizado = true;
        }
      } else {
        // En desarrollo: siempre se permite editar
        folioActualizado = req.body.folio.trim();
        folioEditadoActualizado = true;
      }
    }

    const updatedData = {
      folio: folioActualizado,
      folioEditado: folioEditadoActualizado,
      rutEmpresa: req.body.rutEmpresa,
      nombreEmpresa: req.body.nombreEmpresa,
      tipoVisita: req.body.tipoVisita,
      comentario: req.body.comentario,
      fotos: todasFotos,
      emailsNotificacion: emailsUsuario,
    };

    const visitaActualizada = await Visita.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    // ✅ Envía: cliente en "To", tus correos en "Bcc"
    await sendVisitEmail(
      emailsUsuario,
      CORREOS_POR_DEFECTO,
      visitaActualizada,
      "actualización"
    );

    res.json(visitaActualizada);
  } catch (error) {
    console.error("❌ Error al actualizar visita:", error);
    res.status(400).json({ error: error.message });
  }
});

// Obtener todas las visitas
router.get("/", requireAuth, async (req, res) => {
  try {
    const visitas = await Visita.find().sort({ createdAt: -1 });
    res.json(visitas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id);
    if (!visita) {
      return res.status(404).json({ error: "Visita no encontrada" });
    }

    // Validación de permisos
    const tienePermiso =
      req.user.rol === "administrador" ||
      (visita.creador && visita.creador.toString() === req.user.id);

    if (!tienePermiso) {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    // 1. Enviar correo de eliminación (opcional)
    await sendVisitEmail(
      [], // ← Sin emails de la visita
      CORREOS_POR_DEFECTO,
      visita.toObject(),
      "eliminación"
    );

    // 2. Eliminar fotos de Cloudinary
    if (visita.fotos && visita.fotos.length > 0) {
      const deletePromises = visita.fotos.map(async (fotoUrl) => {
        const publicId = extractPublicId(fotoUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
            console.log(`✅ Foto eliminada de Cloudinary: ${publicId}`);
          } catch (err) {
            console.error(`❌ Error al eliminar foto: ${publicId}`, err);
          }
        }
      });
      await Promise.all(deletePromises);
    }

    // 3. Eliminar visita de la BD
    await Visita.findByIdAndDelete(req.params.id);
    res.json({ message: "Visita y fotos eliminadas con éxito" });
  } catch (error) {
    console.error("Error al eliminar visita:", error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware para errores de Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Error de Multer (ej: archivo demasiado grande)
    return res.status(400).json({ error: error.message });
  } else if (error.message.includes("Solo se permiten imágenes")) {
    // Error personalizado
    return res.status(400).json({ error: error.message });
  }
  // Otros errores
  next(error);
});

// Cerrar visita (marcar como resuelta)
router.post("/:id/cerrar", requireAuth, async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id);
    if (!visita) {
      return res.status(404).json({ error: "Visita no encontrada" });
    }
    if (
      visita.creador.toString() !== req.user.id &&
      req.user.rol !== "administrador"
    ) {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    if (visita.resuelta) {
      return res.status(400).json({ error: "La visita ya está resuelta" });
    }

    // Marcar como resuelta
    visita.resuelta = true;
    visita.fechaResolucion = new Date();
    await visita.save();

    // Enviar correo a TODOS: cliente + correos por defecto
    const todosLosCorreos = [
      ...visita.emailsNotificacion,
      ...CORREOS_POR_DEFECTO,
    ].filter((email) => email.trim() !== "");

    if (todosLosCorreos.length > 0) {
      await sendVisitEmail(
        [...visita.emailsNotificacion], // To: cliente
        CORREOS_POR_DEFECTO, // Bcc: internos
        visita.toObject(),
        "resolución"
      );
    }

    res.json(visita);
  } catch (error) {
    console.error("Error al cerrar visita:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
