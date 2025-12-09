import mongoose from "mongoose";

const rendezVousSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },

  email: { type: String, required: true },
  telephone: { type: String, required: true },
  adresseWebsite: { type: String },

  matiere: { type: [String], required: true },

  service: {
    id: String,
    label: String,
    duration: String,
    price: Number
  },

  date: { type: Date, required: true },
  message: { type: String },

  fichiers: [{ type: String }],

  statutPaiement: { type: String, default: "non payé" },
  paymentIntentId: { type: String }
}, { timestamps: true });

const RendezVous = mongoose.model("RendezVous", rendezVousSchema);

export default RendezVous;
