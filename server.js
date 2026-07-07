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
app.use(express.static('public'));// Route pour le conseil juridique
app.post('/api/conseil', async (req, res) => {
  try {
    const { situation, lang, country, category } = req.body;
    if (!situation) {
      return res.status(400).json({ error: 'Le champ "situation" est requis.' });
    }

    const langue = lang || 'fr';
    const juridiction = country || 'fr';
    const categorie = category || 'general';

    // Mapping des catégories en termes compréhensibles
    const categoriesNoms = {
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
    const categorieNom = categoriesNoms[categorie] || 'général';

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

Voici la situation de la personne : "${situation}".

Réponds en suivant strictement cette structure.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.5, // Plus faible pour plus de cohérence
      max_tokens: 800   // Augmenté pour des réponses plus détaillées
    });

    const reponse = completion.choices[0].message.content;
    res.json({ conseil: reponse });
  } catch (error) {
    console.error('Erreur OpenAI :', error);
    res.status(500).json({ error: 'Erreur lors de la génération du conseil.' });
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