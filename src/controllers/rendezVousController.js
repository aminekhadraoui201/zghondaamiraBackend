// controllers/rendezVousController.js

import RendezVous from "../models/RendezVous.js";
import Stripe from "stripe";




const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


// // 📌 1. Créer un rendez-vous + créer un paiement Stripe
// export const createRendezVous = async (req, res) => {
//   try {
//     const data = req.body;

//     let paymentIntent = null;
//     let statutPaiement = "non payé";

//     // Si le service est payant, créer PaymentIntent
//     if (data.service?.price > 0) {
//       paymentIntent = await stripe.paymentIntents.create({
//         amount: Math.round(data.service.price * 100),
//         currency: "usd",
//         metadata: { email: data.email },
//       });

//       statutPaiement = "en attente";
//     }

//     // Création du rendez-vous
//     const rdv = await RendezVous.create({
//       ...data,
//       statutPaiement,
//       paymentIntentId: paymentIntent ? paymentIntent.id : null,
//     });

//     res.json({
//       message: "Rendez-vous créé",
//       rendezVous: rdv,
//       clientSecret: paymentIntent ? paymentIntent.client_secret : null,
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Erreur serveur" });
//   }
// };

export const getAll = async (req, res) => {
  try {
    const appointments = await RendezVous.find(); // MongoDB collection
    res.status(200).json(appointments);
  } catch (err) {
    console.error("Erreur getAll :", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des rendez-vous" });
  }
};



// 📌 3. Obtenir un rendez-vous par ID
export const getOne = async (req, res) => {
  try {
    const rdv = await RendezVous.findById(req.params.id);
    res.json(rdv);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};


// 📌 4. Modifier un rendez-vous
export const update = async (req, res) => {
  try {
    const rdv = await RendezVous.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(rdv);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};


// 📌 5. Supprimer un rendez-vous
export const remove = async (req, res) => {
  try {
    await RendezVous.findByIdAndDelete(req.params.id);
    res.json({ message: "Rendez-vous supprimé" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
// Créer un RDV
export const createRendezVous = async (req, res) => {
  try {
    const rdv = new RendezVous(req.body);
    await rdv.save();

    let clientSecret = null;
    if (rdv.service.price > 0) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: rdv.service.price * 100,
        currency: "eur",
        metadata: { rendezVousId: rdv._id.toString() },
      });
      clientSecret = paymentIntent.client_secret;
    }

    res.status(201).json({ rendezVous: rdv, clientSecret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Confirmer un RDV après paiement
export const confirmRendezVous = async (req, res) => {
  try {
    const { id } = req.params;
    const rdv = await RendezVous.findById(id);
    if (!rdv) return res.status(404).json({ error: "RDV introuvable" });

    rdv.isPaid = true;
    await rdv.save();
    res.json({ message: "RDV confirmé", rendezVous: rdv });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Marquer comme payé (Stripe)
export const payRendezVous = async (req, res) => {
  try {
    const { rendezVousId } = req.body;
    const rdv = await RendezVous.findById(rendezVousId);
    if (!rdv) return res.status(404).json({ error: "RDV introuvable" });

    rdv.isPaid = true;
    await rdv.save();
    res.json({ message: "Paiement enregistré", rendezVous: rdv });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
export const getDisponibilites = async (req, res) => {
  try {
    const { date } = req.query;
    console.log("📌 Contrôleur getDisponibilites appelé");
    console.log("📅 Date demandée:", date);

    if (!date) {
      console.log("⚠️ Pas de date fournie");
      return res.status(400).json({ error: "Date requise" });
    }

    // Format ISO pour comparaison
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    console.log("🗓️ Recherche RDVs entre", startDate, "et", endDate);

    // Cherche les rendez-vous déjà réservés pour ce jour
    const rdvs = await RendezVous.find({
      date: { $gte: startDate, $lt: endDate }
    });

    console.log("📝 RDVs trouvés:", rdvs.length);

    // Crée un tableau des heures réservées
    const reservedTimes = rdvs.map(r => r.heure); 
    console.log("⏰ Heures réservées:", reservedTimes);

    res.json({ reservedTimes });
  } catch (error) {
    console.error("❌ Erreur serveur getDisponibilites:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Supprimer les 20 rendez-vous les plus anciens
export const deleteOldRendezVous = async (req, res) => {
  try {
    // Récupère les 20 plus anciens RDV
    const oldRdv = await RendezVous.find().sort({ date: 1 }).limit(20);

    if (oldRdv.length === 0) {
      return res.status(200).json({ message: "Aucun rendez-vous ancien à supprimer." });
    }

    // Supprime tous les RDV récupérés
    const ids = oldRdv.map(r => r._id);
    await RendezVous.deleteMany({ _id: { $in: ids } });

    res.status(200).json({ message: `Les ${oldRdv.length} rendez-vous les plus anciens ont été supprimés.` });
  } catch (err) {
    console.error("Erreur suppression anciens RDV:", err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression." });
  }
};
