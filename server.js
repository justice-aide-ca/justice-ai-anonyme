const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static('public'));

// Route pays
app.get('/api/countries', (req, res) => {
    res.json([
        { code: "fr", name: "France" },
        { code: "ca", name: "Canada" },
        { code: "us", name: "USA" }
    ]);
});

// Route demande anonyme avec IA
app.post('/api/submit-anonymous-case', async (req, res) => {
    const { country, caseType, description } = req.body;
    
    console.log('Demande reçue:', country, caseType);
    
    const reference = 'REF_' + Date.now().toString(36).toUpperCase();
    
    let aiResponse = "Service IA en cours d'activation...";
    
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Tu es un conseiller juridique professionnel." },
                { role: "user", content: `Pays: ${country}\nSituation: ${description}\n\nDonne des conseils juridiques pratiques en français.` }
            ],
            max_tokens: 500
        });
        aiResponse = completion.choices[0].message.content;
    } catch (err) {
        console.error('Erreur IA:', err.message);
    }
    
    res.json({
        success: true,
        message: 'Votre demande a bien été reçue',
        reference: reference,
        aiResponse: aiResponse,
        date: new Date().toISOString()
    });
});

// Route abonnement Stripe
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
            success_url: successUrl || 'https://justice-ai.onrender.com/success',
            cancel_url: cancelUrl || 'https://justice-ai.onrender.com/cancel',
            metadata: { userId }
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error('Erreur Stripe:', error);
        res.status(500).json({ error: error.message });
    }
});

// Accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Pages success et cancel
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.get('/cancel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cancel.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});