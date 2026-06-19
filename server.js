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

2. DOCUMENTS À PRÉPARER
   - Liste les documents et preuves à rassembler, en fonction du type de situation (licenciement, divorce, logement, accident, consommation, etc.).
   - Exemple : contrats, relevés bancaires, courriers, photos, témoignages, etc.

3. CONSEILS JURIDIQUES PRATIQUES
   - Donne des conseils clairs et concrets, adaptés au pays et au type de situation.
   - Indique les démarches à suivre, les délais à respecter.

4. RECOMMANDATION FINALE
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
            max_tokens: 900
        });
        aiResponse = completion.choices[0].message.content;
        console.log('✅ IA a répondu en', promptLang);
    } catch (err) {
        console.error('❌ Erreur IA:', err.message);
        aiResponse = "Service IA indisponible. Réponse sous 24h.";
    }

    res.json({
        success: true,
        message: 'Votre demande a bien été reçue',
        reference: reference,
        aiResponse: aiResponse,
        date: new Date().toISOString()
    });
});