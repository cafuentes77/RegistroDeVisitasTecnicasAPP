// server/utils/sendEmail.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendVisitEmail = async (emails, visita, tipo = 'actualización') => {
  const isCreacion = tipo === 'creación';
  const subject = isCreacion
    ? `✅ Nueva visita registrada - ${visita.nombreEmpresa}`
    : `🔄 Actualización de visita - ${visita.nombreEmpresa}`;

  const actionText = isCreacion ? 'registrada' : 'actualizada';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emails.join(','),
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background: #f9f9f9;">
        <h2 style="color: #2563eb;">Visita ${actionText}</h2>
        <p><strong>RUT:</strong> ${visita.rutEmpresa}</p>
        <p><strong>Empresa:</strong> ${visita.nombreEmpresa}</p>
        <p><strong>Comentario:</strong> ${visita.comentario}</p>
        ${visita.fotos && visita.fotos.length > 0 ? `
        <p><strong>Fotos adjuntas:</strong></p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
          ${visita.fotos.map(foto => `<img src="${foto.startsWith('http') ? foto : `http://localhost:5000${foto}`}" width="120" style="border-radius: 4px; border: 1px solid #ddd;">`).join('')}
        </div>
        ` : ''}
        <p style="font-size: 0.9em; color: #666; margin-top: 20px;">
          <em>Fecha: ${new Date().toLocaleString('es-ES')}</em>
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Correos enviados (${tipo}) a:`, emails);
  } catch (error) {
    console.error(`❌ Error al enviar correos (${tipo}):`, error.message);
  }
};