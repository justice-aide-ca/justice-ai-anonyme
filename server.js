const express = require('express');
const { countries } = require('countries-list');

const app = express();

app.use(express.json());

app.get('/api/countries', (req, res) => {
  const countryList = Object.entries(countries)
    .map(([code, country]) => ({
      code: code.toLowerCase(),
      name: country.name
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json(countryList);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});