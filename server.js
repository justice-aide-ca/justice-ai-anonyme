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
        res.json([{ code: "fr", name: "France" }, { code: "ca", name: "Canada" }, { code: "us", name: "USA" }]);
    }
});

app.post('/api/submit-anonymous-case', (req, res) => {
    const { country, caseType, description } = req.body;
    
    console.log('\n Demande anonyme recue');
    console.log('Pays:', country);
    console.log('Type:', caseType);
    console.log('Description:', description);
    
    const reference = 'REF_' + Date.now().toString(36).toUpperCase();
    
    res.json({
        success: true,
        message: 'Votre demande anonyme a bien ete recue',
        reference: reference,
        date: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log('Serveur demarre sur http://localhost:' + PORT);
});