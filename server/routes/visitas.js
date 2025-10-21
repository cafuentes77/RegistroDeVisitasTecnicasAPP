// server/routes/visitas.js
import express from 'express';
import multer from 'multer';
import Visita from '../models/Visita.js';
import { sendVisitEmail } from '../utils/sendEmail.js';
import cloudinary from '../utils/cloudinary.js';
import { unlink } from 'fs/promises';
import path from 'path';

const router = express.Router();

// Configuración de Multer: guarda temporalmente en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Función para subir archivos a Cloudinary
const uploadFilesToCloudinary = async (files) => {
  const urls = [];
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'visitas_clientes',
        resource_type: 'auto'
      });
      urls.push(result.secure_url);
      // Elimina el archivo temporal
      await unlink(file.path);
    } catch (error) {
      console.error('Error al subir a Cloudinary:', error);
      // Opcional: eliminar archivo temporal incluso si falla
      await unlink(file.path).catch(() => {});
    }
  }
  return urls;
};

// Crear visita
router.post('/', upload.array('fotos', 10), async (req, res) => {
  try {
    let fotosUrls = [];
    if (req.files && req.files.length > 0) {
      fotosUrls = await uploadFilesToCloudinary(req.files);
    }

    const emailsNotificacion = JSON.parse(req.body.emailsNotificacion)
      .filter(email => email.trim() !== '');

    const visita = new Visita({
      rutEmpresa: req.body.rutEmpresa,
      nombreEmpresa: req.body.nombreEmpresa,
      tipoVisita: req.body.tipoVisita,
      comentario: req.body.comentario,
      fotos: fotosUrls,
      emailsNotificacion
    });

    await visita.save();

    await sendVisitEmail(emailsNotificacion, visita, 'creación');

    res.status(201).json(visita);
  } catch (error) {
    console.error('Error al crear visita:', error);
    res.status(400).json({ error: error.message });
  }
});

// Actualizar visita
router.put('/:id', upload.array('fotos', 10), async (req, res) => {
  try {
    const visitaExistente = await Visita.findById(req.params.id);
    if (!visitaExistente) return res.status(404).json({ error: 'Visita no encontrada' });

    let nuevasFotosUrls = [];
    if (req.files && req.files.length > 0) {
      nuevasFotosUrls = await uploadFilesToCloudinary(req.files);
    }

    const todasFotos = [...visitaExistente.fotos, ...nuevasFotosUrls];

    const emailsNotificacion = JSON.parse(req.body.emailsNotificacion)
      .filter(email => email.trim() !== '');

    const updatedData = {
      rutEmpresa: req.body.rutEmpresa,
      nombreEmpresa: req.body.nombreEmpresa,
      tipoVisita: req.body.tipoVisita,
      comentario: req.body.comentario,
      fotos: todasFotos,
      emailsNotificacion
    };

    const visitaActualizada = await Visita.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    await sendVisitEmail(visitaActualizada.emailsNotificacion, visitaActualizada, 'actualización');

    res.json(visitaActualizada);
  } catch (error) {
    console.error('Error al actualizar visita:', error);
    res.status(400).json({ error: error.message });
  }
});

// Obtener todas las visitas
router.get('/', async (req, res) => {
  try {
    const visitas = await Visita.find();
    res.json(visitas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;