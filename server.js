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
            <p style="text-align:center;"><a href="/">Retour à l’accueil</a></p>
        `);
        return;
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});// Sauvegarde de la demande
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