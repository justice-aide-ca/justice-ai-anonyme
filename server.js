const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.get('/api/countries', (req, res) => {
    try {
        const data = fs.readFileSync('./data/countries.json', 'utf8');
        const json = JSON.parse(data);
        res.json(json.countries);
    } catch (err) {
        res.json([{ code: "fr", name: "France" }, { code: "ca", name: Canada }]);
    }
});

// Route pour l'abonnement Stripe
app.post('/api/create-subscription', async (req, res) => {
    const { userId, successUrl, cancelUrl } = req.body;
    
    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe non configuré' });
    }
    
    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            }],
            success_url: successUrl || 'https://justice-ai-anonyme-2.onrender.com/success',
            cancel_url: cancelUrl || 'https://justice-ai-anonyme-2.onrender.com/cancel',
            metadata: { userId }
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error('Erreur Stripe:', error);
        res.status(500).json({ error: error.message });
    }
});