const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/submit-anonymous-case', async (req, res) => {
    const { country, caseType, description } = req.body;
    
    console.log('\n📋 Nouvelle demande anonyme reçue');
    console.log('Pays:', country);
    console.log('Type:', caseType);
    console.log('Description:', description.substring(0, 100));
    
    const reference = 'REF_' + Date.now().toString(36).toUpperCase();
    
    // Générer un conseil IA
    let aiResponse = null;
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Tu es un conseiller juridique professionnel. Réponds en français." },
                { role: "user", content: `Pays: ${country}\nType: ${caseType}\nSituation: ${description}\n\nDonne des conseils juridiques pratiques en quelques paragraphes.` }
            ],
            max_tokens: 600
        });
        aiResponse = completion.choices[0].message.content;
        console.log('✅ Conseil IA généré');
    } catch (error) {
        console.error('❌ Erreur IA:', error.message);
        aiResponse = "⚠️ Le service de conseil IA est temporairement indisponible. Un conseiller vous répondra sous 24h.";
    }
    
    res.json({
        success: true,
        message: 'Votre demande a bien été reçue',
        reference: reference,
        aiResponse: aiResponse,
        date: new Date().toISOString()
    });
});