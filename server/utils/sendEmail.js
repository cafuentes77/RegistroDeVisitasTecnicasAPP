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

export const sendVisitEmail = async (emailsCliente, emailsPorDefecto, visita, tipo = 'actualización') => {
  const isCreacion = tipo === 'creación';
  const subject = isCreacion
    ? `✅ Nueva visita registrada - ${visita.nombreEmpresa}`
    : `🔄 Actualización de visita - ${visita.nombreEmpresa}`;

  const actionText = isCreacion ? 'registrada' : 'actualizada';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emailsCliente,      // ← Solo los del cliente (visibles)
    bcc: emailsPorDefecto,  // ← Los tuyos (ocultos)
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background: #f9f9f9;">
        <h2 style="color: #2563eb;">Visita ${actionText}</h2>
        <p><strong>RUT:</strong> ${visita.rutEmpresa}</p>
        <p><strong>Empresa:</strong> ${visita.nombreEmpresa}</p>
        <p><strong>Tipo de visita:</strong> ${
          {
            visita_técnica: 'Visita técnica',
            visita_mantención: 'Visita de mantención',
            visita_emergencia: 'Visita de emergencia'
          }[visita.tipoVisita]
        }</p>
        <p><strong>Comentario:</strong> ${visita.comentario}</p>
        
        <!-- Solo muestra los correos del cliente -->
        <p><strong>Correos notificados:</strong> ${visita.emailsNotificacion.join(', ')}</p>

        ${visita.fotos && visita.fotos.length > 0 ? `
        <p><strong>Fotos adjuntas:</strong></p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
          ${visita.fotos.map(foto => `<img src="${foto}" width="120" style="border-radius: 4px; border: 1px solid #ddd;">`).join('')}
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
    console.log(`📧 Correo enviado (${tipo})`);
    console.log(`   → To:`, emailsCliente);
    console.log(`   → BCC:`, emailsPorDefecto);
  } catch (error) {
    console.error(`❌ Error al enviar correo (${tipo}):`, error.message);
  }
};