import forgotPassword from './_forgot-password.js';
import sendPasswordChangedEmail from './_send-password-changed-email.js';
import welcomeEmail from './_welcome-email.js';

export default async function handler(req, res) {
  const url = req.url || '';
  if (url.includes('send-password-changed-email')) return sendPasswordChangedEmail(req, res);
  if (url.includes('welcome-email')) return welcomeEmail(req, res);
  return forgotPassword(req, res);
}
