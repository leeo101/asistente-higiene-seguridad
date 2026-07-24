import createStripeSubscription from './_create-stripe-subscription.js';
import verifyPayment from './_verify-payment.js';
import subscriptionHandlerModule from './_subscription-handler.js';

export default async function handler(req, res) {
  const url = req.url || '';
  if (url.includes('create-stripe-subscription')) return createStripeSubscription(req, res);
  if (url.includes('verify-payment')) return verifyPayment(req, res);
  return subscriptionHandlerModule(req, res);
}
