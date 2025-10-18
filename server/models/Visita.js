// server/models/Visita.js
import { Schema, model } from 'mongoose';

const VisitaSchema = new Schema({
  rutEmpresa: { type: String, required: true },
  nombreEmpresa: { type: String, required: true },
  comentario: { type: String, required: true },
  fotos: [{ type: String }], // URLs o paths de las fotos
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