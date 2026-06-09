const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Middleware IMPORTANT - doit être avant les routes
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Route de test GET
app.get('/api/test', (req, res) => {
    res.json({ message: 'API fonctionne' });
});

// Route pour les demandes anonymes POST
app.post('/api/submit-anonymous-case', (req, res) => {
    console.log('\n🕵️ Demande anonyme reçue');
    console.log('Body reçu:', req.body);
    
    const country = req.body.country || 'non spécifié';
    const description = req.body.description || 'non spécifié';
    
    console.log('Pays:', country);
    console.log('Description:', description);
    
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

// Démarrage - Version compatible avec Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});