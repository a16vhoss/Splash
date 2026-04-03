import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Resend client – initialised from env. When the key is missing (e.g. in
// local dev or preview deploys) every send degrades to a console.log.
// ---------------------------------------------------------------------------

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = 'Splash <noreply@splash.app>';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://splash.app';

// ---------------------------------------------------------------------------
// Private helper
// ---------------------------------------------------------------------------

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log(`[email] (no RESEND_API_KEY) to=${to} subject="${subject}"`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[email] Resend error:', error);
    }
  } catch (err) {
    console.error('[email] Failed to send:', err);
  }
}

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

function layout(body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="max-width:500px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#0284C7;padding:24px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Splash</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
            <span style="color:#a1a1aa;font-size:12px;">&copy; Splash — Reserva tu autolavado</span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;color:#71717a;font-size:14px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;color:#18181b;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

function detailsTable(rows: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${rows}</table>`;
}

// ---------------------------------------------------------------------------
// Public email functions
// ---------------------------------------------------------------------------

/** Email to client after a booking is confirmed. */
export async function sendBookingConfirmationClient(
  email: string,
  data: {
    carWashName: string;
    serviceName: string;
    fecha: string;
    hora: string;
    precio: string;
    direccion: string;
  },
) {
  const html = layout(`
    <h2 style="margin:0 0 8px;color:#18181b;font-size:18px;">¡Tu cita está confirmada!</h2>
    <p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.5;">
      Hemos reservado tu cita en <strong>${data.carWashName}</strong>. Aquí tienes los detalles:
    </p>
    ${detailsTable(
      row('Autolavado', data.carWashName) +
      row('Servicio', data.serviceName) +
      row('Fecha', data.fecha) +
      row('Hora', data.hora) +
      row('Precio', data.precio) +
      row('Dirección', data.direccion),
    )}
    <p style="margin:16px 0 0;color:#52525b;font-size:13px;line-height:1.5;">
      Si necesitas cancelar o modificar tu cita, hazlo desde la sección <em>Mis Citas</em> en la app.
    </p>
  `);

  await sendEmail({
    to: email,
    subject: `Tu cita en ${data.carWashName} esta confirmada`,
    html,
  });
}

/** Email to admin when a new booking is created. */
export async function sendBookingConfirmationAdmin(
  email: string,
  data: {
    clientName: string;
    serviceName: string;
    fecha: string;
    hora: string;
    precio: string;
  },
) {
  const html = layout(`
    <h2 style="margin:0 0 8px;color:#18181b;font-size:18px;">Nueva cita agendada</h2>
    <p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.5;">
      Un cliente ha reservado una cita. Revisa los detalles:
    </p>
    ${detailsTable(
      row('Cliente', data.clientName) +
      row('Servicio', data.serviceName) +
      row('Fecha', data.fecha) +
      row('Hora', data.hora) +
      row('Precio', data.precio),
    )}
  `);

  await sendEmail({
    to: email,
    subject: `Nueva cita: ${data.clientName} - ${data.serviceName}`,
    html,
  });
}

/** Email on cancellation — sent to client or admin depending on context. */
export async function sendCancellationEmail(
  email: string,
  data: {
    carWashName: string;
    serviceName: string;
    fecha: string;
    hora: string;
    motivo: string;
    isAdmin: boolean;
  },
) {
  const subject = data.isAdmin
    ? `Cita cancelada: ${data.serviceName} — ${data.fecha}`
    : `Tu cita en ${data.carWashName} fue cancelada`;

  const html = layout(`
    <h2 style="margin:0 0 8px;color:#DC2626;font-size:18px;">Cita cancelada</h2>
    <p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.5;">
      ${data.isAdmin ? 'Una cita ha sido cancelada.' : 'Lamentamos informarte que tu cita ha sido cancelada.'}
    </p>
    ${detailsTable(
      row('Autolavado', data.carWashName) +
      row('Servicio', data.serviceName) +
      row('Fecha', data.fecha) +
      row('Hora', data.hora) +
      row('Motivo', data.motivo),
    )}
  `);

  await sendEmail({ to: email, subject, html });
}

/** Reminder email sent ~2 hours before the appointment. */
export async function sendReminderEmail(
  email: string,
  data: {
    carWashName: string;
    serviceName: string;
    fecha: string;
    hora: string;
    direccion: string;
  },
) {
  const html = layout(`
    <h2 style="margin:0 0 8px;color:#18181b;font-size:18px;">⏰ Tu cita es en 2 horas</h2>
    <p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.5;">
      Solo un recordatorio de que tienes una cita próxima en <strong>${data.carWashName}</strong>.
    </p>
    ${detailsTable(
      row('Autolavado', data.carWashName) +
      row('Servicio', data.serviceName) +
      row('Fecha', data.fecha) +
      row('Hora', data.hora) +
      row('Dirección', data.direccion),
    )}
    <p style="margin:16px 0 0;color:#52525b;font-size:13px;line-height:1.5;">
      ¡Te esperamos!
    </p>
  `);

  await sendEmail({
    to: email,
    subject: 'Recordatorio: tu cita es en 2 horas',
    html,
  });
}

/** Review-request email sent after an appointment is completed. */
export async function sendReviewRequestEmail(
  email: string,
  data: {
    carWashName: string;
    appointmentId: string;
  },
) {
  const reviewUrl = `${APP_URL}/calificar/${data.appointmentId}`;

  const html = layout(`
    <h2 style="margin:0 0 8px;color:#18181b;font-size:18px;">¿Cómo fue tu experiencia?</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.5;">
      Nos encantaría saber qué te pareció tu visita a <strong>${data.carWashName}</strong>.
      Tu opinión nos ayuda a mejorar.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${reviewUrl}" style="display:inline-block;background:#0284C7;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;">
          Calificar mi experiencia
        </a>
      </td></tr>
    </table>
    <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;text-align:center;">
      Si el botón no funciona, copia y pega este enlace: ${reviewUrl}
    </p>
  `);

  await sendEmail({
    to: email,
    subject: `Como fue tu experiencia en ${data.carWashName}?`,
    html,
  });
}
