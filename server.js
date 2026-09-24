// server.js — Justice AI Anonyme
// Backend sécurisé pour Render avec CORS strict, limitation de débit et liste synchronisée des pays

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const START_TIME = Date.now();

// 1. Détection de proxy de confiance (Render)
app.set('trust proxy', 1);

// 2. Parsage JSON limité pour prévenir les abus de bande passante
app.use(express.json({ limit: '100kb' }));

// 3. En-têtes de sécurité HTTP stricts
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// 4. Configuration CORS stricte
const ALLOWED_ORIGINS = new Set([
    'https://justice-aide-ca.github.io',
    'https://justice-ai-anonyme-u4sn.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
]);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// 5. Source de référence des pays (synchronisée avec index.html)
const COUNTRIES_REGISTRY = [
    // Amériques
    { code: "ca", name: "Canada", flag: "🇨🇦", emergency: "Police, Ambulances, Pompiers : 911" },
    { code: "us", name: "États-Unis", flag: "🇺🇸", emergency: "Police, Ambulance, Fire : 911" },
    { code: "ht", name: "Haïti", flag: "🇭🇹", emergency: "Police : 114 | Ambulance : 116 | Pompiers : 115" },
    { code: "mx", name: "Mexique", flag: "🇲🇽", emergency: "Urgences générales : 911" },
    { code: "br", name: "Brésil", flag: "🇧🇷", emergency: "Police : 190 | SAMU : 192 | Pompiers : 193" },

    // Europe
    { code: "fr", name: "France", flag: "🇫🇷", emergency: "SAMU : 15 | Police : 17 | Urgences Europe : 112" },
    { code: "be", name: "Belgique", flag: "🇧🇪", emergency: "Secours / Médical : 112 | Police : 101" },
    { code: "ch", name: "Suisse", flag: "🇨🇭", emergency: "Ambulance : 144 | Police : 117 | Pompiers : 118" },
    { code: "lu", name: "Luxembourg", flag: "🇱🇺", emergency: "Secours : 112 | Police : 113" },
    { code: "mc", name: "Monaco", flag: "🇲🇨", emergency: "Pompiers/Ambulance : 18 | Police : 17" },
    { code: "gb", name: "Royaume-Uni", flag: "🇬🇧", emergency: "Urgences : 999 ou 112" },
    { code: "de", name: "Allemagne", flag: "🇩🇪", emergency: "Police : 110 | Secours & Pompiers : 112" },
    { code: "es", name: "Espagne", flag: "🇪🇸", emergency: "Urgences générales : 112 | Police : 091" },
    { code: "it", name: "Italie", flag: "🇮🇹", emergency: "Urgences Europe : 112 | Police : 113" },
    { code: "pt", name: "Portugal", flag: "🇵🇹", emergency: "Numéro national d'urgence : 112" },

    // Afrique du Nord
    { code: "ma", name: "Maroc", flag: "🇲🇦", emergency: "Police : 19 | Gendarmerie : 177 | Pompiers : 15" },
    { code: "dz", name: "Algérie", flag: "🇩🇿", emergency: "Police : 17 ou 1548 | Protection Civile : 14" },
    { code: "tn", name: "Tunisie", flag: "🇹🇳", emergency: "Police : 197 | SAMU : 190 | Protection Civile : 198" },

    // Afrique subsaharienne et centrale
    { code: "sn", name: "Sénégal", flag: "🇸🇳", emergency: "Police : 17 | Pompiers : 18 | SAMU : 15 15" },
    { code: "ci", name: "Côte d'Ivoire", flag: "🇨🇮", emergency: "Police : 170 | Pompiers : 180 | SAMU : 185" },
    { code: "cm", name: "Cameroun", flag: "🇨🇲", emergency: "Police secours : 117 | Pompiers : 118" },
    { code: "cd", name: "RD Congo", flag: "🇨🇩", emergency: "Police secours : 112 | Urgences : 118" },
    { code: "cg", name: "Congo-Brazzaville", flag: "🇨🇬", emergency: "Police : 117 | Pompiers : 118" },
    { code: "ga", name: "Gabon", flag: "🇬🇦", emergency: "Police secours : 177 | Pompiers : 18" },
    { code: "gn", name: "Guinée", flag: "🇬🇳", emergency: "Police secours : 117 | Protection civile : 18" },
    { code: "ml", name: "Mali", flag: "🇲🇱", emergency: "Police : 17 | Pompiers : 18" },
    { code: "bf", name: "Burkina Faso", flag: "🇧🇫", emergency: "Police : 17 | Pompiers : 18" },
    { code: "tg", name: "Togo", flag: "🇹🇬", emergency: "Police secours : 117 | Pompiers : 118" },
    { code: "bj", name: "Bénin", flag: "🇧🇯", emergency: "Police : 117 | Pompiers : 118" },
    { code: "ne", name: "Niger", flag: "🇳🇪", emergency: "Police : 17 | Pompiers : 18" },
    { code: "mg", name: "Madagascar", flag: "🇲🇬", emergency: "Police : 117 | Pompiers : 118" },
    { code: "rw", name: "Rwanda", flag: "🇷🇼", emergency: "Police générale : 112 | Ambulance : 912" },
    { code: "bi", name: "Burundi", flag: "🇧🇮", emergency: "Police : 117 | Urgences médicales : 112" },

    // Asie & reste du monde
    { code: "in", name: "Inde", flag: "🇮🇳", emergency: "Urgences nationales : 112" },
    { code: "cn", name: "Chine", flag: "🇨🇳", emergency: "Police : 110 | Ambulance : 120" },
    { code: "jp", name: "Japon", flag: "🇯🇵", emergency: "Police : 110 | Ambulance : 119" },
    { code: "kr", name: "Corée du Sud", flag: "🇰🇷", emergency: "Police : 112 | Secours : 119" },
    { code: "ru", name: "Russie", flag: "🇷🇺", emergency: "Urgences générales : 112" }
];

const ALLOWED_COUNTRY_CODES = new Set(COUNTRIES_REGISTRY.map(c => c.code));

const ALLOWED_CATEGORIES = new Set([
    'travail',
    'logement',
    'famille',
    'consommation',
    'penal',
    'etrangers',
    'autre'
]);

// 6. Rate Limiting en mémoire avec fenêtre glissante
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitMap = new Map();

function cleanRateLimitMap() {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
            rateLimitMap.delete(ip);
        }
    }
}
setInterval(cleanRateLimitMap, 5 * 60 * 1000);

function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    let record = rateLimitMap.get(ip);
    if (!record || (now - record.startTime > RATE_LIMIT_WINDOW_MS)) {
        record = { count: 1, startTime: now };
        rateLimitMap.set(ip, record);
        return next();
    }

    record.count += 1;
    if (record.count > RATE_LIMIT_MAX_REQUESTS) {
        const remainingSeconds = Math.ceil((record.startTime + RATE_LIMIT_WINDOW_MS - now) / 1000);
        res.setHeader('Retry-After', remainingSeconds);
        return res.status(429).json({
            error: "Limite de requêtes atteinte. Pour préserver le service, veuillez patienter avant de soumettre une nouvelle demande.",
            retryAfter: remainingSeconds
        });
    }

    next();
}

// 7. Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// 8. Endpoints de l'API

// Endpoint de santé
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "Justice AI Anonyme",
        uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000),
        countries_loaded: COUNTRIES_REGISTRY.length,
        timestamp: new Date().toISOString()
    });
});

// Endpoint de la liste complète des pays
app.get('/api/countries', (req, res) => {
    res.status(200).json(COUNTRIES_REGISTRY);
});

// Endpoint d'analyse juridique
app.post('/api/conseil', rateLimiter, async (req, res) => {
    const { country, category, situation, consent } = req.body || {};

    // Validation du consentement explicite
    if (consent !== true) {
        return res.status(400).json({
            error: "Vous devez accepter les conditions d'utilisation et la politique de confidentialité avant de lancer l'analyse."
        });
    }

    // Validation du pays
    if (!country || !ALLOWED_COUNTRY_CODES.has(String(country).toLowerCase())) {
        return res.status(400).json({
            error: "Pays invalide ou non pris en charge."
        });
    }

    // Validation de la catégorie
    if (!category || !ALLOWED_CATEGORIES.has(String(category).toLowerCase())) {
        return res.status(400).json({
            error: "Catégorie juridique manquante ou non valide."
        });
    }

    // Validation de la situation
    if (!situation || typeof situation !== 'string') {
        return res.status(400).json({
            error: "Le descriptif de votre situation est requis."
        });
    }

    const trimmedSituation = situation.trim();
    if (trimmedSituation.length < 20) {
        return res.status(400).json({
            error: "La description est trop courte. Veuillez donner au moins 20 caractères pour permettre une analyse juridique."
        });
    }

    if (trimmedSituation.length > 4000) {
        return res.status(400).json({
            error: "Le texte dépasse la limite maximale autorisée (4 000 caractères)."
        });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("[CRITIQUE] Variable OPENAI_API_KEY absente.");
        return res.status(503).json({
            error: "Service momentanément indisponible. Le service d'analyse juridique est en cours de maintenance."
        });
    }

    const countryObj = COUNTRIES_REGISTRY.find(c => c.code === country.toLowerCase());
    const countryName = countryObj ? countryObj.name : country;

    const systemPrompt = `Tu es Justice AI, un assistant d'information et d'orientation juridique d'urgence.
Tu analyses les situations pour la juridiction : ${countryName}.
Domaine : ${category}.

RÈGLES IMPÉRATIVES DE DÉONTOLOGIE :
1. Rappelle brièvement en préambule que cette réponse est une analyse informative automatisée et ne remplace pas la consultation d'un avocat ou professionnel du droit habilité.
2. Structure clairement ta réponse avec les sections suivantes :
   - Synthèse de la situation juridique
   - Principes et textes de lois applicables dans la juridiction (${countryName})
   - Démarches pratiques et recours recommandés
   - Organismes d'aide juridique gratuite, permanences ou numéros utiles locaux
3. Sois factuel, rigoureux, neutre et bienveillant. N'invente pas d'articles de loi si tu n'es pas certain.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: trimmedSituation }
                ],
                temperature: 0.2,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            console.error(`[API ERROR] OpenAI a renvoyé ${response.status}: ${errData.substring(0, 200)}`);
            return res.status(502).json({
                error: "Une erreur est survenue lors de la communication avec le moteur d'analyse. Veuillez réessayer dans quelques instants."
            });
        }

        const data = await response.json();
        const advice = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

        if (!advice) {
            return res.status(502).json({
                error: "La réponse générée est vide. Veuillez reformuler votre question."
            });
        }

        return res.status(200).json({
            success: true,
            country: countryName,
            category: category,
            advice: advice,
            emergency: countryObj ? countryObj.emergency : null,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("[ERREUR SERVEUR]", err.message);
        return res.status(500).json({
            error: "Impossible de joindre le service d'analyse. Vérifiez votre connexion ou réessayez ultérieurement."
        });
    }
});

// 9. Démarrage du serveur
app.listen(PORT, () => {
    console.log(`[SERVEUR PRÊT] Port: ${PORT} | Pays chargés: ${COUNTRIES_REGISTRY.length}`);
});
