// server/models/Visita.js
import { Schema, model } from 'mongoose';

const VisitaSchema = new Schema({
  rutEmpresa: { type: String, required: true },
  nombreEmpresa: { type: String, required: true },
  tipoVisita: {
    type: String,
    enum: ['visita_técnica', 'visita_mantención', 'visita_emergencia'],
    required: true
  },
  comentario: { type: String, required: true },
  fotos: [{ type: String }], // URLs de Cloudinary
  emailsNotificacion: {
    type: [String],
    validate: [arrayLimit, '{PATH} excede el límite de 5 correos'],
    required: true
  }
}, { timestamps: true });

function arrayLimit(val) {
  return val.length <= 5;
}

export default model('Visita', VisitaSchema);