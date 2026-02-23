// Vercel Serverless Function for MP Webhook 
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // MP Webhooks generally don't strictly require CORS if coming from MP IPs, but nice to have.
    const payment = req.query;
    console.log("Webhook Notification MP:", payment);

    // In production, you would fetch payment info from MP using payment.id,
    // verify the payment status, and then update your database.
    return res.status(200).send('OK');
}
