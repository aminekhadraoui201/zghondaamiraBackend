import fs from "fs";

// ---------------------------
// Convertir une date en format ICS
// ---------------------------
function formatDate(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// ---------------------------
// Générer le contenu ICS
// ---------------------------
function generateICS(title, description, start, end, location) {
  return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YourApp//EN
BEGIN:VEVENT
UID:${Date.now()}@yourapp
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR
`.trim();
}

// ---------------------------
// EXEMPLE D’UTILISATION
// ---------------------------
const title = "Consultation 30 min";
const description = "Client: Mr X\nService: Consultation";
const start = new Date("2025-02-01T10:00:00");
const end = new Date("2025-02-01T10:30:00");
const location = "Cabinet Avocat";

// 1) Générer le ICS
const ics = generateICS(title, description, start, end, location);

// 2) Sauvegarder un fichier .ics (optionnel)
fs.writeFileSync("event.ics", ics);
console.log("📁 Fichier ICS créé : event.ics");

// 3) Générer un lien ICS utilisable dans un site web
const icsEncoded = encodeURIComponent(ics);
const url = `data:text/calendar;charset=utf-8,${icsEncoded}`;

console.log("🔗 URL ICS à utiliser dans ton site :");
console.log(url);
