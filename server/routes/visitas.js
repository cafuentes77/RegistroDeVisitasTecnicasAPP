// server/routes/visitas.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import Visita from '../models/Visita.js';
import { sendVisitEmail } from '../utils/sendEmail.js';

const router = express.Router();

// Configuración de Multer para subir fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Crear visita
router.post('/', upload.array('fotos', 10), async (req, res) => {
  try {
    const fotos = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const emailsNotificacion = JSON.parse(req.body.emailsNotificacion)
      .filter(email => email.trim() !== ''); // Elimina correos vacíos

    const visita = new Visita({
      rutEmpresa: req.body.rutEmpresa,
      nombreEmpresa: req.body.nombreEmpresa,
      comentario: req.body.comentario,
      fotos,
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

    const nuevasFotos = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const todasFotos = [...visitaExistente.fotos, ...nuevasFotos];

    const updatedData = {
      ...req.body,
      fotos: todasFotos,
      emailsNotificacion: JSON.parse(req.body.emailsNotificacion)
    };

    const visitaActualizada = await Visita.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    // Enviar correos
    await sendVisitEmail(visitaActualizada.emailsNotificacion, visitaActualizada, 'actualización');

    res.json(visitaActualizada);
  } catch (error) {
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