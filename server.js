const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/api/countries', (req, res) => {
    try {
        const data = fs.readFileSync('./data/countries.json', 'utf8');
        const json = JSON.parse(data);
        res.json(json.countries);
    } catch (err) {
        res.json([{ code: "fr", name: "France" }, { code: "ca", name: "Canada" }]);
    }
});

app.post('/api/submit-anonymous-case', (req, res) => {
    const { country, caseType, description } = req.body;
    console.log('Demande reçue:', country, caseType, description);
    res.json({
        success: true,
        message: 'Demande reçue',
        reference: 'REF_' + Date.now(),
        aiResponse: 'Votre demande a bien été reçue. Un conseiller vous répondra sous 24h.'
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);