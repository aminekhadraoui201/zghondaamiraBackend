import "dotenv/config"; // ⚡ charge .env avant tout
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import rendezVousRoutes from "./src/routes/rendezVousRoutes.js";


const app = express();

app.use(cors({
  origin: [
    
    "https://zghondaavocat.fr",        // site principal
    "https://www.zghondaavocat.fr",    // www
    "http://localhost:8080",            // frontend local
  ], // si tu l’héberges sur Render
  
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Error :", err));

// Routes CRUD rendez-vous + Calendly
app.use("/api/rendezvous", rendezVousRoutes);



// Lancer serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur running sur port ${PORT}`));

export default app; // ⚠️ export default pour pouvoir l'importer ailleurs
