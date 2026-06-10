const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialiser OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Structure pour stocker les abonnements (temporaire)
const subscriptions = {};

// Vérifier le statut d'un abonnement
async function checkSubscriptionStatus(userId) {
    const sub = subscriptions[userId];
    if (!sub) return { isActive: false, message: 'Aucun abonnement trouvé' };
    
    const now = new Date();
    const expiryDate = new Date(sub.expiryDate);
    
    if (expiryDate < now) {
        return { isActive: false, message: 'Abonnement expiré' };
    }
    
    return {
        isActive: true,
        expiryDate: expiryDate,
        message: `Abonnement valide jusqu'au ${expiryDate.toLocaleDateString()}`
    };
}

// Route pour les pays
app.get('/api/countries', (req, res) => {
    try {
        const data = fs.readFileSync('./data/countries.json', 'utf8');
        const json = JSON.parse(data);
        res.json(json.countries);
    } catch (err) {
        res.json([
            { code: "fr", name: "France" },
            { code: "ca", name: "Canada" },
            { code: "us", name: "USA" }
        ]);
    }
});

// Vérifier l'accès
app.post('/api/check-access', async (req, res) => {
    const { userId } = req.body;
    
    const users = global.users || {};
    if (!users[userId]) {
        users[userId] = { firstVisit: new Date(), hasActiveSubscription: false };
        global.users = users;
    }
    
    const firstVisit = new Date(users[userId].firstVisit);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - firstVisit.getFullYear()) * 12 + (now.getMonth() - firstVisit.getMonth());
    
    const subscriptionStatus = await checkSubscriptionStatus(userId);
    const hasActiveSubscription = subscriptionStatus.isActive;
    
    const isFree = monthsDiff < 4;
    const hasAccess = isFree || hasActiveSubscription;
    
    let message = '';
    if (isFree) {
        const monthsLeft = 4 - monthsDiff;
        message = `🎁 Période gratuite : ${monthsLeft} mois restant${monthsLeft > 1 ? 's' : ''}.`;
    } else if (hasActiveSubscription) {
        message = `✅ ${subscriptionStatus.message}`;
    } else {
        message = '🔒 Période gratuite terminée. Abonnez-vous pour continuer.';
    }
    
    res.json({ hasAccess, message });
});

// Route avec IA
app.post('/api/submit-anonymous-case', async (req, res) => {
    const { country, caseType, description } = req.body;
    
    console.log('\n📋 Nouvelle demande anonyme reçue');
    console.log(`🌍 Pays: ${country}`);
    console.log(`⚖️ Type: ${caseType}`);
    console.log(`📝 Description: ${description.substring(0, 100)}...`);
    
    const reference = 'REF_' + Date.now().toString(36).toUpperCase();
    
    const prompt = `Tu es un conseiller juridique professionnel.
    
Pays: ${country}
Type: ${caseType}
Description: ${description}

Réponds avec:
1. RÉSUMÉ de la situation
2. CONSEILS JURIDIQUES pratiques
3. PROCHAINES ÉTAPES à suivre
4. AVERTISSEMENT légal`;

    let aiResponse = null;
    
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Tu es un conseiller juridique professionnel." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 800
        });
        
        aiResponse = completion.choices[0].message.content;
        console.log('✅ Réponse IA générée');
        
    } catch (error) {
        console.error('❌ Erreur IA:', error.message);
        aiResponse = "⚠️ Service IA indisponible. Un conseiller vous répondra sous 24h.";
    }
    
    // Sauvegarder la demande
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
        aiResponse
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

// Accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log('🤖 IA conseillère activée');
});