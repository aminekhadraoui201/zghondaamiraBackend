// controllers/rendezVousController.js

import RendezVous from "../models/RendezVous.js";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

// // Confirmer un RDV après paiement
// export const confirmRendezVous = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const rdv = await RendezVous.findById(id);
//     if (!rdv) return res.status(404).json({ error: "RDV introuvable" });

//     rdv.isPaid = true;
//     await rdv.save();
//     res.json({ message: "RDV confirmé", rendezVous: rdv });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Erreur serveur" });
//   }
// };

// // Marquer comme payé (Stripe)
// export const payRendezVous = async (req, res) => {
//   try {
//     const { rendezVousId } = req.body;
//     const rdv = await RendezVous.findById(rendezVousId);
//     if (!rdv) return res.status(404).json({ error: "RDV introuvable" });

//     rdv.isPaid = true;
//     await rdv.save();
//     res.json({ message: "Paiement enregistré", rendezVous: rdv });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Erreur serveur" });
//   }
// };
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

export const deleteOldRdv = async (req, res) => {
  console.log("➡️ Contrôleur deleteOldRdv appelé");
  try {
    // Récupérer les 20 plus anciens rendez-vous
    const oldRdv = await RendezVous.find().sort({ date: 1 }).limit(20);

    // Supprimer chacun
    const idsToDelete = oldRdv.map(r => r._id);
    await RendezVous.deleteMany({ _id: { $in: idsToDelete } });

    res.json({ message: `${oldRdv.length} anciens rendez-vous supprimés` });
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

    if (rdv.service.price > 0 && !rdv.isPaid) {
      return res.status(400).json({ error: "Paiement requis avant confirmation" });
    }

    rdv.isConfirmed = true; // nouveau champ pour confirmation
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

    // ⚡️ Assure-toi que date et heure sont bien présentes
    if (!rdv.date && req.body.date) {
      rdv.date = new Date(req.body.date);
    }

    await rdv.save();
    res.json({ message: "Paiement enregistré", rendezVous: rdv });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
export const createEvent = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, date, time, service } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: "Date et heure requises" });
    }

    // Combiner DATE + HEURE
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // +30 min

    // Construire URL Google Calendar
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Rendez-vous : ${service}`
    )}&dates=${
      startDateTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    }/${
      endDateTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    }&details=${encodeURIComponent(
      `Client : ${prenom} ${nom}\nEmail : ${email}\nTéléphone : ${telephone}`
    )}`;

    return res.json({
      message: "Événement généré",
      event: { googleCalendarUrl }
    });
  } catch (error) {
    console.error("Erreur création event :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createRendezVous1 = async (req, res) => {
  try {
    const rdv = new RendezVous(req.body);
    await rdv.save();

    let clientSecret = null;

    if (rdv.service.price > 0) {
      // ⚡️ montant minimum pour test live = 1 centime
      const amountToPay = Math.min(rdv.service.price * 100, 10); // max 10 cents = 0,10 €

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountToPay, // 1 centime ou max 10 cents
        currency: "eur",
        metadata: { rendezVousId: rdv._id.toString() },
        capture_method: "manual", // permet de créer mais ne pas capturer immédiatement
      });

      clientSecret = paymentIntent.client_secret;
    }

    res.status(201).json({ rendezVous: rdv, clientSecret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Pour capturer le paiement après test
export const capturePayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    res.json({ paymentIntent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Pour annuler le paiement
export const cancelPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    res.json({ paymentIntent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
