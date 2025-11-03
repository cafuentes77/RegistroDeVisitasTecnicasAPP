// server/models/Visita.js
import { Schema, model } from 'mongoose';

const validarRutBackend = (rut) => {
  if (!rut) return false;
  let rutLimpio = rut.replace(/[.-]/g, '');
  if (rutLimpio.length < 2) return false;
  let dv = rutLimpio.slice(-1).toUpperCase();
  let cuerpo = rutLimpio.slice(0, -1);
  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  let dvEsperado = 11 - (suma % 11);
  dvEsperado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

  return dv === dvEsperado;
};

const VisitaSchema = new Schema({
  rutEmpresa: {     type: String,
    required: true,
    validate: {
      validator: validarRutBackend,
      message: 'RUT inválido'
    } },
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