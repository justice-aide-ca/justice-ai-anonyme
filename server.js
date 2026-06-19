// Version 100% gratuite - Sans Stripe;
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// === OpenAI ===
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// === Middleware ===
app.use(express.json());
app.use(express.static('public'));

// === Route pays ===
app.get('/api/countries', (req, res) => {
    res.json([
        { code: "fr", name: "France" },
        { code: "ca", name: "Canada" },
        { code: "us", name: "États-Unis" },
        { code: "ma", name: "Maroc" },
        { code: "dz", name: "Algérie" },
        { code: "tn", name: "Tunisie" },
        { code: "sn", name: "Sénégal" },
        { code: "ci", name: "Côte d'Ivoire" },
        { code: "cm", name: "Cameroun" },
        { code: "be", name: "Belgique" },
        { code: "ch", name: "Suisse" },
        { code: "de", name: "Allemagne" },
        { code: "es", name: "Espagne" },
        { code: "it", name: "Italie" },
        { code: "pt", name: "Portugal" },
        { code: "gb", name: "Royaume-Uni" },
        { code: "br", name: "Brésil" },
        { code: "mx", name: "Mexique" },
        { code: "in", name: "Inde" },
        { code: "cn", name: "Chine" },
        { code: "jp", name: "Japon" },
        { code: "kr", name: "Corée du Sud" },
        { code: "ru", name: "Russie" }
    ]);
});

// === Route demande anonyme + IA ===
app.post('/api/submit-anonymous-case', async (req, res) => {
    const { country, caseType, description } = req.body;

    console.log('📋 Demande reçue:', country, caseType);

    const reference = 'REF_' + Date.now().toString(36).toUpperCase();

    let aiResponse = "Service IA en cours d'activation...";

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Tu es un conseiller juridique professionnel." },
                { role: "user", content: `Pays: ${country}\nSituation: ${description}\n\nDonne des conseils juridiques pratiques en français.` }
            ],
            max_tokens: 600
        });
        aiResponse = completion.choices[0].message.content;
        console.log('✅ IA a répondu');
    } catch (err) {
        console.error('❌ Erreur IA:', err.message);
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

// === Accueil ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === Gestion propre du port ===
const server = app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log('🤖 IA conseillère activée');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PORT} est déjà utilisé.`);
        console.log(`💡 Essaie de libérer le port ou utilise un autre port.`);
    } else {
        console.error('❌ Erreur serveur:', err);
    }
});

// === Gestion de l'arrêt propre ===
process.on('SIGINT', () => {
    console.log('🛑 Arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement.');
        process.exit(0);
    });
});