const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Route pour obtenir la liste des pays
app.get('/api/countries', (req, res) => {
    try {
        const data = fs.readFileSync('./data/countries.json', 'utf8');
        const json = JSON.parse(data);
        res.json(json.countries);
    } catch (err) {
        console.error('Erreur lecture pays:', err);
        res.json([{ code: "fr", name: "France" }, { code: "ca", name: "Canada" }, { code: "us", name: "USA" }]);
    }
});

// Route pour les demandes anonymes
app.post('/api/submit-anonymous-case', (req, res) => {
    console.log('\n🕵️ Demande anonyme reçue');
    console.log('Pays:', req.body.country);
    console.log('Description:', req.body.description);
    
    const reference = 'REF_' + Date.now().toString(36).toUpperCase();
    
    res.json({
        success: true,
        message: 'Votre demande anonyme a bien été reçue',
        reference: reference
    });
});

// Accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
})