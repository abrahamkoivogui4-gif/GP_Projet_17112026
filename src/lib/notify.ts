import "server-only";

/**
 * Point d'entrée unique pour prévenir un utilisateur (demande reçue, acceptée, refusée…).
 * Version 1 : écrit dans les logs du serveur.
 * Pour brancher WhatsApp Business ou un fournisseur de SMS plus tard, il suffit de remplacer
 * le corps de cette fonction : tout le reste de l'application l'appelle déjà au bon moment.
 */
export async function notify(phone: string, message: string) {
  console.info(`[notification] ${phone} : ${message}`);
}
