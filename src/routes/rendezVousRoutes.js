import express from "express";
import * as controller from "../controllers/rendezVousController.js";
import  RendezVous  from "../models/RendezVous.js"; // ton modèle Mongoose

const router = express.Router();

// CRUD rendez-vous
router.post("/", controller.createRendezVous);
router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
router.post("/confirm/:id", controller.confirmRendezVous);
router.post("/pay", controller.payRendezVous);

// Créer un rendez-vous + générer lien Google Calendar
router.post("/create-event", async (req, res) => {
  try {
    const { nom, prenom, email, telephone, date, time, service } = req.body;

    // Vérifier tous les champs obligatoires
    if (!nom || !prenom || !email || !telephone || !date || !time) {
      return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis" });
    }

    // Créer le rendez-vous dans MongoDB
    const rdv = new RendezVous({ nom, prenom, email, telephone, date, time, service });
    await rdv.save();

    // Générer le lien Google Calendar
    const startDate = new Date(`${date}T${time}`);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // +30 min
    const formatDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g,"");

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Rendez-vous avec ${prenom} ${nom}`
    )}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(
      `Service: ${service || "-"}\nEmail: ${email}\nTéléphone: ${telephone}`
    )}&sf=true&output=xml`;

    return res.status(201).json({
      success: true,
      event: {
        id: rdv._id,
        nom,
        prenom,
        email,
        telephone,
        date,
        time,
        service,
        googleCalendarUrl
      },
    });
  } catch (err) {
    console.error("Erreur serveur :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
