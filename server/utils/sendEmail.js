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

export const sendUpdateEmail = async (emails, visita) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emails.join(','),
    subject: `Actualización de visita - ${visita.nombreEmpresa}`,
    html: `
      <h2>Visita actualizada</h2>
      <p><strong>RUT:</strong> ${visita.rutEmpresa}</p>
      <p><strong>Empresa:</strong> ${visita.nombreEmpresa}</p>
      <p><strong>Comentario:</strong> ${visita.comentario}</p>
      <p><strong>Fotos:</strong></p>
      ${visita.fotos.map(foto => `<img src="${foto}" width="200" style="margin:5px;">`).join('')}
      <p><em>Actualizado el: ${new Date().toLocaleString()}</em></p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correos enviados correctamente');
  } catch (error) {
    console.error('Error al enviar correos:', error);
  }
};