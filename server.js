require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Route demande anonyme + IA
app.post('/api/submit-anonymous-case', async (req, res) => {
    const { country, caseType, description, language } = req.body;

    console.log('📋 Demande reçue:', country, caseType, 'Langue:', language);

    const reference = 'REF_' + Date.now().toString(36).toUpperCase();

    let aiResponse = "Service IA en cours d'activation...";

    const languageNames = {
        fr: 'français',
        en: 'anglais',
        es: 'espagnol',
        de: 'allemand',
        ar: 'arabe',
        pt: 'portugais',
        it: 'italien',
        ru: 'russe',
        zh: 'chinois',
        ja: 'japonais',
        ko: 'coréen'
    };

    const promptLang = languageNames[language] || 'français';

    const prompt = `
Tu es un conseiller juridique professionnel, bienveillant et précis.

Le pays concerné est : ${country}.
Le type de situation est : ${caseType}.
Voici la description de l'utilisateur :
"${description}"

Réponds dans la langue suivante : ${promptLang}.

Structure ta réponse comme suit :

1. RÉSUMÉ DE LA SITUATION
   - Reformule la situation en 2-3 phrases dans la langue choisie.

2. CONSEILS JURIDIQUES PRATIQUES
   - Donne des conseils clairs et concrets, adaptés au pays et au type de situation.
   - Indique les démarches à suivre, les délais à respecter.

3. RECOMMANDATION FINALE
   - Recommande vivement de consulter un avocat spécialisé pour un accompagnement personnalisé.

Sois clair, structuré, empathique et pratique.
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Tu es un conseiller juridique professionnel." },
                { role: "user", content: prompt }
            ],
            max_tokens: 700
        });
        aiResponse = completion.choices[0].message.content;
        console.log('✅ IA a répondu en', promptLang);
    } catch (err) {
        console.error('❌ Erreur IA:', err.message);
        aiResponse = "Service IA indisponible. Réponse sous 24h.";
    }

    // Sauvegarde
    let demandes = [];
    try {
        const data = fs.readFileSync('./data/demandes.json', 'utf8');
        demandes = JSON.parse(data);
    } catch (err) {
        demandes = [];
    }

    demandes.push({
        reference,
        date: new Date().toISOString(),
        country,
        caseType,
        description,
        aiResponse,
        language
    });

    fs.writeFileSync('./data/demandes.json', JSON.stringify(demandes, null, 2));

    res.json({
        success: true,
        message: 'Votre demande a bien été reçue',
        reference: reference,
        aiResponse: aiResponse,
        date: new Date().toISOString()
    });
});

// ===== ROUTE ADMIN : RÉCUPÉRER TOUTES LES DEMANDES =====
app.get('/api/admin/demandes', (req, res) => {
    try {
        const data = fs.readFileSync('./data/demandes.json', 'utf8');
        const demandes = JSON.parse(data);
        res.json(demandes);
    } catch (err) {
        console.error('❌ Erreur lecture demandes:', err.message);
        res.json([]);
    }
});

// ===== PAGE ADMIN (avec mot de passe) =====
app.get('/admin', (req, res) => {
    const password = req.query.password;
    if (password !== 'justice2026') {
        res.send(`
            <h1 style="text-align:center; margin-top:50px;">🔒 Accès refusé</h1>
            <p style="text-align:center;">Mot de passe incorrect.</p>
            <p style="text-align:center;"><a href="/">Retour à l'accueil</a></p>
        `);
        return;
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

process.on('SIGINT', () => {
    console.log('🛑 Arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement.');
        process.exit(0);
    });
});