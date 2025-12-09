// controllers/rendezVousController.js

import RendezVous from "../models/RendezVous.js";
import Stripe from "stripe";




const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


// 📌 1. Créer un rendez-vous + créer un paiement Stripe
export const createRendezVous = async (req, res) => {
  try {
    const data = req.body;

    let paymentIntent = null;
    let statutPaiement = "non payé";

    // Si le service est payant, créer PaymentIntent
    if (data.service?.price > 0) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.service.price * 100),
        currency: "usd",
        metadata: { email: data.email },
      });

      statutPaiement = "en attente";
    }

    // Création du rendez-vous
    const rdv = await RendezVous.create({
      ...data,
      statutPaiement,
      paymentIntentId: paymentIntent ? paymentIntent.id : null,
    });

    res.json({
      message: "Rendez-vous créé",
      rendezVous: rdv,
      clientSecret: paymentIntent ? paymentIntent.client_secret : null,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

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


// 📌 6. Confirmer un RDV
export const confirmRendezVous = async (req, res) => {
  try {
    const rdvId = req.params.id;

    if (!rdvId) {
      return res.status(400).json({ error: "ID du RDV requis" });
    }

    const rdv = await RendezVous.findByIdAndUpdate(
      rdvId,
      { 
        statutPaiement: "payé", 
        statutRDV: "confirmé" 
      },
      { new: true }
    );

    if (!rdv) {
      return res.status(404).json({ error: "RDV introuvable" });
    }

    res.json({ message: "Rendez-vous confirmé", rendezVous: rdv });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


// 📌 7. Marquer paiement comme réussi (Webhook ou frontend)
export const payRendezVous = async (req, res) => {
  try {
    const { rendezVousId } = req.body;

    if (!rendezVousId) {
      return res.status(400).json({ error: "ID du RDV requis" });
    }

    const rdv = await RendezVous.findByIdAndUpdate(
      rendezVousId,
      { statutPaiement: "payé" },
      { new: true }
    );

    if (!rdv) {
      return res.status(404).json({ error: "RDV introuvable" });
    }

    res.json({ message: "Paiement effectué", rendezVous: rdv });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
