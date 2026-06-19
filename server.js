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

---

1. RÉSUMÉ DE LA SITUATION
   - Reformule la situation en 2-3 phrases.

---

2. CONSEIL POUR UNE RÉSOLUTION AMIABLE (Sans passer devant le juge)
   - Propose des démarches concrètes : négociation, médiation, lettre recommandée, etc.
   - Indique les documents à préparer.
   - Mentionne les délais à respecter et les bonnes pratiques.
   - Donne des conseils pour désamorcer le conflit.

---

3. SI LA RÉSOLUTION AMIABLE ÉCHOUE (Évolution possible)
   - Explique comment reconnaître les signes d’échec de la voie amiable.
   - Indique les prochaines étapes possibles avant d’aller en justice.
   - Mentionne les délais à surveiller (prescription, délais de recours).

---

4. QUE FAIRE SI L’AFFAIRE VA DEVANT LE JUGE (Préparation)
   - Liste les preuves à rassembler dès maintenant (pour être prêt).
   - Explique comment structurer sa défense.
   - Donne des conseils sur l’attitude à adopter en audience.

---

5. AVERTISSEMENT LÉGAL
   - Rappelle que ce conseil ne remplace pas l’avis d’un avocat.
   - Recommande de consulter un professionnel si la situation s’aggrave.

Sois clair, structuré, empathique et pratique.
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Tu es un conseiller juridique professionnel." },
                { role: "user", content: prompt }
            ],
            max_tokens: 1100
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