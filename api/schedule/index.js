// api/schedule/index.js
// GET  /api/schedule   → list all events
// POST /api/schedule   → create a new event

const { v4: uuidv4 } = require('uuid');
const {
  readSheet,
  appendRow,
  handleCors,
  verifyToken,
} = require('../_sheets');

const TAB = 'Schedule';

// Column order MUST match the header row in your Google Sheet "Schedule" tab.
// When you set up the sheet, add this exact row as Row 1:
// id | date | time | title | description | location | status | priority | attendees | createdAt | updatedAt
const HEADERS = [
  'id', 'date', 'time', 'title', 'description',
  'location', 'status', 'priority', 'attendees',
  'createdAt', 'updatedAt',
];

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (!verifyToken(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // ── GET ─────────────────────────────────────
    if (req.method === 'GET') {
      const rows = await readSheet(TAB);
      return res.status(200).json({ success: true, data: rows });
    }

    // ── POST ─────────────────────────────────────
    if (req.method === 'POST') {
      const now = new Date().toISOString();
      const event = {
        ...req.body,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };

      await appendRow(TAB, HEADERS, event);
      return res.status(201).json({ success: true, data: event });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[schedule/index]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
