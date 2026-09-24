require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'cle-non-configuree'
});

// =========================================================================
// CONFIGURATION CORS RESTREINTE
// =========================================================================
const ALLOWED_ORIGINS = [
    'https://justice-aide-ca.github.io',
    'https://justice-ai-anonyme-u4sn.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json({ limit: '100kb' })); // Protection contre les payloads surdimensionnés
app.use(express.static('public'));

// =========================================================================
// 1. ENDPOINT DE SANTÉ (Healthcheck & Préchauffage Render)
// =========================================================================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'justice-ai-backend',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// =========================================================================
// 2. ROUTE CONSEIL JURIDIQUE AVEC VALIDATION STRICTE
// =========================================================================
const CATEGORIES_VALIDEES = {
    general: 'général',
    famille: 'droit de la famille',
    travail: 'droit du travail',
    logement: 'droit du logement',
    consommation: 'droit de la consommation',
    penal: 'droit pénal',
    etrangers: 'droit des étrangers',
    affaires: 'droit des affaires',
    fiscalite: 'fiscalité',
    propriete: 'propriété intellectuelle',
    sante: 'droit de la santé',
    environnement: 'droit de l\'environnement',
    successions: 'successions et héritage'
};

app.post('/api/conseil', async (req, res) => {
    try {
        const { situation, lang, country, category } = req.body;

        // Validation du type et présence
        if (typeof situation !== 'string') {
            return res.status(400).json({
                error: 'Le champ "situation" est invalide ou absent.'
            });
        }

        const texteNettoye = situation.trim();

        // Validation des longueurs
        if (texteNettoye.length < 20) {
            return res.status(400).json({
                error: 'La description doit contenir au moins 20 caractères pour permettre une analyse pertinente.'
            });
        }

        if (texteNettoye.length > 4000) {
            return res.status(400).json({
                error: 'La description ne doit pas dépasser 4 000 caractères.'
            });
        }

        // Assainissement des paramètres annexes
        const langue = (typeof lang === 'string' && lang.length <= 5) ? lang.toLowerCase() : 'fr';
        const juridiction = (typeof country === 'string' && country.length <= 5) ? country.toLowerCase() : 'fr';
        const categorieCle = (typeof category === 'string' && CATEGORIES_VALIDEES[category]) ? category : 'general';
        const categorieNom = CATEGORIES_VALIDEES[categorieCle];

        const systemPrompt = `Tu es un assistant juridique virtuel empathique et précis.
La personne qui s'adresse à toi se trouve dans la juridiction "${juridiction}" et parle la langue "${langue}".
La catégorie juridique concernée est : "${categorieNom}".

Ta mission est de fournir une **première orientation juridique** structurée, utile et rassurante.
Respecte scrupuleusement les règles suivantes :

1. **Structure de la réponse** :
   - Commence par un **résumé** en une phrase qui reformule la situation et identifie le problème juridique principal.
   - Ensuite, sous le titre "🔍 Éléments clés", liste les points juridiques importants (3 à 5 maximum).
   - Sous le titre "📋 Démarches possibles", décris les étapes concrètes que la personne peut entreprendre (2 à 4 démarches).
   - Sous le titre "⚠️ Points de vigilance", mentionne les pièges à éviter ou les délais à respecter.
   - Termine par une **phrase d'espoir** et le rappel que tu n'es pas un avocat.

2. **Ton et style** :
   - Empathique, clair, sans jargon inutile.
   - Utilise des **émojis** pour rendre la lecture plus agréable.
   - Écris en **français** si la langue est "fr", sinon dans la langue correspondante.

3. **Limites** :
   - Ne donne pas de conseil définitif, mais des pistes.
   - Rappelle toujours de consulter un professionnel du droit local.

Voici la situation de la personne : "${texteNettoye}".

Réponds en suivant strictement cette structure.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.5,
            max_tokens: 800
        });

        const reponse = completion.choices[0].message.content;
        return res.json({ conseil: reponse });

    } catch (error) {
        console.error('Erreur API Conseil :', error.message || error);
        return res.status(500).json({
            error: 'Le service d\'analyse est momentanément saturé. Merci de réessayer dans un instant.'
        });
    }
});

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

// Pages légales
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));

// Accueil Render
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const server = app.listen(PORT, () => {
    console.log(`🚀 Serveur actif sur le port ${PORT}`);
}).on('error', (err) => {
    console.error('❌ Erreur serveur:', err);
});

process.on('SIGINT', () => {
    server.close(() => process.exit(0));
});
