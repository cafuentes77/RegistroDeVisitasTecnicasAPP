// server/utils/sendEmail.js
import { Resend } from "resend";

// Inicializa Resend con tu API Key
const resend = new Resend(process.env.RESEND_API_KEY);

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

  const senderEmail = process.env.SENDER_EMAIL || "serviciotecnico@segurpro.cl";

  // Normaliza correos destinatarios
  const toEmails = Array.isArray(emailsCliente)
    ? emailsCliente.filter((email) => email?.trim())
    : [emailsCliente].filter((email) => email?.trim());

  // BCC: correos por defecto + remitente
  const bccEmails = [
    ...emailsPorDefecto.filter((email) => email?.trim()),
    senderEmail,
  ].filter(Boolean);

  // ✅ ZONA HORARIA DE CHILE
  const now = new Date();
  const fechaFormateada = now.toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const fechaCreacion = isCreacion
    ? new Date(visita.createdAt).toLocaleString("es-CL", {
        timeZone: "America/Santiago",
        hour12: false,
      })
    : null;

  const fechaResolucionFormateada =
    isResolucion && visita.fechaResolucion
      ? new Date(visita.fechaResolucion).toLocaleString("es-CL", {
          timeZone: "America/Santiago",
          hour12: false,
        })
      : null;

  // ✅ COMENTARIO CON SALTOS DE LÍNEA (compatible con Gmail)
  const comentarioFormateado = (visita.comentario || "").replace(/\n/g, "<br>");

  const htmlContent = `
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
          ? `<p><strong>Comentario:</strong><br>
             <div style="font-family: Arial, sans-serif; line-height: 1.5; margin-top: 8px;">${comentarioFormateado}</div>
            </p>`
          : ""
      }
      ${
        isResolucion
          ? `
      <p><strong>¡Visita resuelta con éxito!</strong></p>
      <p><strong>Fecha de resolución:</strong> ${fechaResolucionFormateada}</p>
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
        Array.isArray(visita.emailsNotificacion)
          ? visita.emailsNotificacion.join(", ") || "Ninguno"
          : "Ninguno"
      }</p>
      <p style="font-size: 0.9em; color: #666; margin-top: 20px;">
        <em>Fecha y hora: ${isCreacion ? fechaCreacion : fechaFormateada}</em>
      </p>
      
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
        <em>Este correo fue generado automáticamente por Segurpro.<br>
        Por favor, no responda a este mensaje.</em>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: `Servicio Técnico Segurpro <${senderEmail}>`,
      to: toEmails,
      bcc: bccEmails.length > 0 ? bccEmails : undefined,
      subject: subject,
      html: htmlContent,
    });
    console.log(`📧 Correo enviado vía Resend (${tipo})`);
  } catch (error) {
    console.error(
      `❌ Error al enviar correo con Resend (${tipo}):`,
      error.message,
    );
    if (error?.data) {
      console.error("Detalles del error:", error.data);
    }
  }
};
