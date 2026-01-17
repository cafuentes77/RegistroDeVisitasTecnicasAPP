// server/utils/sendEmail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVisitEmail = async (
  emailsCliente,
  emailsPorDefecto,
  visita,
  tipo = "actualización",
) => {
  const isCreacion = tipo === "creación";
  const isEliminacion = tipo === "eliminación";
  const isResolucion = tipo === "resolución";
  const subject = isResolucion
    ? `✅ Visita RESUELTA - ${visita.nombreEmpresa}`
    : isEliminacion
      ? `🗑️ Visita ELIMINADA - ${visita.nombreEmpresa}`
      : isCreacion
        ? `✅ Nueva visita registrada - ${visita.nombreEmpresa}`
        : `🔄 Actualización de visita - ${visita.nombreEmpresa}`;

  const actionText = isResolucion
    ? "resuelta"
    : isEliminacion
      ? "eliminada"
      : isCreacion
        ? "registrada"
        : "actualizada";

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emailsCliente,
    bcc: emailsPorDefecto,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background: #f9f9f9;">
        <h2 style="color: ${
          isEliminacion ? "#dc2626" : isCreacion ? "#059669" : "#2563eb"
        };">
          Visita ${actionText}
        </h2>
        <p><strong>Folio:</strong> ${visita.folio}</p>
        <p><strong>RUT:</strong> ${visita.rutEmpresa}</p>
        <p><strong>Empresa:</strong> ${visita.nombreEmpresa}</p>
        <p><strong>Tipo de visita:</strong> ${
          {
            visita_tecnica: "Visita técnica",
            visita_mantencion: "Visita de mantención",
            visita_emergencia: "Visita de emergencia",
          }[visita.tipoVisita] || "No especificado"
        }</p>
        ${
          !isEliminacion
            ? `<p><strong>Comentario:</strong> ${visita.comentario}</p>`
            : ""
        }
            ${
              isResolucion
                ? `
      <p><strong>¡Visita resuelta con éxito!</strong></p>
      <p><strong>Fecha de resolución:</strong> ${new Date(
        visita.fechaResolucion,
      ).toLocaleString("es-ES")}</p>
    `
                : ""
            }
${
  visita.fotos && visita.fotos.length > 0
    ? `
  <p><strong>Fotos adjuntas:</strong></p>
  <div style="margin-top: 10px;">
    ${visita.fotos
      .map(
        (foto) => `
      <a href="${foto}" target="_blank" style="display: inline-block; margin: 6px; text-decoration: none;">
        <img src="${foto}" width="150" style="border: 1px solid #ddd; border-radius: 4px; max-width: 100%;">
      </a>
    `,
      )
      .join("")}
  </div>
`
    : ""
}

        <p><strong>Correos Notificados:</strong> ${
          visita.emailsNotificacion.join(", ") || "Ninguno"
        }</p>
         <p style="font-size: 0.9em; color: #666; margin-top: 20px;">
          <em>Fecha y hora: ${
            tipo === "creación"
              ? new Date(visita.createdAt).toLocaleString("es-ES")
              : new Date().toLocaleString("es-ES")
          }</em>
        </p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
          <em>Este correo fue generado automáticamente por SegurPro.<br>
          Por favor, no responda a este mensaje.</em>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Correo enviado (${tipo})`);
  } catch (error) {
    console.error(`❌ Error al enviar correo (${tipo}):`, error.message);
  }
};
