app.post('/api/submit-anonymous-case', async (req, res) => {
    const { country, caseType, description } = req.body;

    console.log('📋 Demande reçue:', country, caseType);

    const reference = 'REF_' + Date.now().toString(36).toUpperCase();

    let aiResponse = "Service IA en cours d'activation...";

    const prompt = `
Tu es un conseiller juridique professionnel, bienveillant et précis.

Le pays concerné est : ${country}.
Le type de situation est : ${caseType}.
Voici la description de l'utilisateur :
"${description}"

Réponds avec la structure suivante, en français :

1. RÉSUMÉ DE LA SITUATION
   - Reformule la situation en 2-3 phrases.

2. CONSEILS JURIDIQUES PRATIQUES
   - Donne des conseils clairs et concrets, adaptés au pays et au type de situation.
   - Indique les démarches à suivre, les documents à préparer, les délais à respecter.

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
            max_tokens: 800
        });
        aiResponse = completion.choices[0].message.content;
        console.log('✅ IA a répondu');
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