// server.js
import "dotenv/config"; // ⚡ charge .env avant tout

import app from "./app.js"; // ton app express

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Serveur running sur port ${PORT}`));
