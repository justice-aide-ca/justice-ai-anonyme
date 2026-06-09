<! DOCTYPE html >
< html >
< tête >
    < titre > Formulaire Anonyme </ titre >
</ tête >
< corps >
    < h2 > Formulaire Anonyme </ h2 >
    < formulaire id = " monFormulaire " >
        < type d ' entrée = < " texte " nom "= " nom " espace réservé   Votre nom  requis >
        < br >
        < type d'entrée = < < email " nom =  email  espace réservé   Votre email  requis >
        < br >
        < type de bouton = " soumettre " Envoyer  </ bouton >
    </ formulaire >
    < div id = " resultat " > </ div >

    < script >
        formulaire const = document.getelementById('monFormulaire');
        const resultatDiv = document.getElementById('resultat');

        form.addEventListener('soumettre', async (e) => {
            e.preventDefault();
            
                        Données const = {
                nom: document.querySelector('[name="nom"]').value,
                email: document.querySelector('[name="email"]').value
            };
            
                        Essayez {
                réponse const = attendre fetch('http://localhost:3000/api/submit', {
                    méthode: 'POST',
                    en-têtes: { 'Content-Type': 'application/json' },
                    corps: JSON.stringify(data)
                });
                
                                résultat const = wait response.json();
                resultatDiv.innerHTML = < p style = " couleur:green "  ✅ Succès: ' + JSON.stringify(result) + ' </ p > ';
                form.reset();
            } capture (erreur) {
                resultatDiv.innerHTML = < <p style = " couleur:red " > ❌ Erreur: ' + error.message + ' </ p > ';
            }
        });
    </ script >
</ corps >
</ html >