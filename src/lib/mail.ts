import "server-only";
import nodemailer from "nodemailer";

/**
 * Envoi d'e-mails par SMTP (boîte mail OVH, Brevo, etc.).
 *
 * Variables d'environnement :
 *   SMTP_HOST   serveur d'envoi, ex. ssl0.ovh.net ou smtp-relay.brevo.com
 *   SMTP_PORT   465 (SSL, par défaut) ou 587
 *   SMTP_USER   identifiant, ex. contact@lilalink.fr
 *   SMTP_PASS   mot de passe de la boîte ou clé SMTP
 *   MAIL_FROM   expéditeur affiché (défaut : « Lilalink <SMTP_USER> »)
 * Sans SMTP_HOST, rien n'est envoyé : l'e-mail est seulement écrit dans les logs.
 */

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transport: nodemailer.Transporter | null = null;
function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transport;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type NewRequestMail = { gpName: string; clientName: string; kg: number; route: string; url: string; settingsUrl: string };

export async function sendNewRequestEmail(to: string, m: NewRequestMail): Promise<{ ok: boolean; error?: string }> {
  const subject = `Nouvelle demande : ${m.kg} kg ${m.route}`;
  const text = [
    `Bonjour ${m.gpName},`,
    "",
    `${m.clientName} souhaite envoyer ${m.kg} kg avec vous sur votre trajet ${m.route}.`,
    "",
    `Ouvrez la demande pour répondre : ${m.url}`,
    "",
    "Répondez vite : les clients choisissent souvent le premier GP qui répond.",
    "",
    "—",
    "Lilalink",
    `Ne plus recevoir ces e-mails : ${m.settingsUrl}`,
  ].join("\n");
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f3f3f3;font-family:Arial,Helvetica,sans-serif;color:#000">
<div style="max-width:520px;margin:0 auto;padding:24px 16px">
  <div style="background:#000;color:#fff;font-weight:700;font-size:22px;padding:16px 20px;border-radius:12px 12px 0 0">Lilalink</div>
  <div style="background:#fff;padding:24px 20px;border-radius:0 0 12px 12px">
    <p style="margin:0 0 6px;color:#5e5e5e">Bonjour ${esc(m.gpName)},</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.2">Nouvelle demande de ${esc(m.clientName)}</h1>
    <p style="margin:0 0 4px"><b>${m.kg} kg</b> sur votre trajet</p>
    <p style="margin:0 0 20px;font-size:18px;font-weight:700">${esc(m.route)}</p>
    <a href="${esc(m.url)}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px">Voir la demande</a>
    <p style="margin:20px 0 0;color:#5e5e5e;font-size:14px">Répondez vite : les clients choisissent souvent le premier GP qui répond.</p>
  </div>
  <p style="text-align:center;color:#8a8a8a;font-size:12px;margin:16px 0 0">Vous recevez cet e-mail car vous l'avez demandé dans votre Espace GP.<br><a href="${esc(m.settingsUrl)}" style="color:#8a8a8a">Ne plus recevoir ces e-mails</a></p>
</div></body></html>`;

  if (!mailConfigured()) {
    console.info(`[e-mail non configuré] ${to} : ${subject}`);
    return { ok: false, error: "non configuré" };
  }
  try {
    await getTransport().sendMail({
      from: process.env.MAIL_FROM || `Lilalink <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.info(`[e-mail] envoyé à ${to}`);
    return { ok: true };
  } catch (e) {
    console.error(`[e-mail] échec vers ${to} :`, e);
    return { ok: false, error: "L'e-mail n'a pas pu être envoyé." };
  }
}
