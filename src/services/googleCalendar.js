// src/services/googleCalendar.js
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oAuth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// si tu as un refresh token (recommandé pour serveurs)
// oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

async function createEvent({ summary, start, end, attendees = [] }) {
  const event = {
    summary,
    start: { dateTime: new Date(start).toISOString() },
    end: { dateTime: new Date(end).toISOString() },
    attendees: attendees.map(email => ({ email })),
    reminders: { useDefault: true }
  };

  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event
  });
  return res.data; // contient id, htmlLink...
}

module.exports = { createEvent };
