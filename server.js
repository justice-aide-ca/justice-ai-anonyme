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

app.post('/api/submit-anonymous-case', async (req, res) => {
    const { country, caseType, description } = req.body;
    
    console.log('\n📋 Nouvelle demande reçue');
    console.log('Pays:', country);
    console.log('Type:', caseType);
    console.log('Description:', description);
    
    const reference = 'REF_' + Date.now().toString(36).toUpperCase();
    
    let aiResponse = null;
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
        console.log('✅ IA a répondu');
    } catch (error) {
        console.error('❌ Erreur IA:', error.message);
        aiResponse = "Service IA indisponible. Réponse sous 24h.";
    }
    
    res.json({
        success: true,
        message: 'Votre demande a bien été reçue',
        reference: reference,
        aiResponse: aiResponse,
        date: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Route pour créer une session d'abonnement Stripe
app.post('/api/create-subscription', async (req, res) => {
    const { userId, successUrl, cancelUrl } = req.body;
    
    // Vérifie que Stripe est configuré
    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe non configuré' });
    }
    
    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: process.env.STRIPE_PRICE_ID || 'price_1RANDOM', // Remplace par ton vrai price ID
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

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});