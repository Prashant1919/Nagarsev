// api/records/index.js
// GET  /api/records  → list all citizen records
// POST /api/records  → create a new record

const { v4: uuidv4 } = require('uuid');
const {
  readSheet,
  appendRow,
  handleCors,
  verifyToken,
} = require('../_sheets');

const TAB = 'Records';

// Column order for the "Records" tab header row (Row 1):
// id | citizenName | contact | ward | area | category | subject | description |
// status | priority | followUpDate | internalNotes | resolvedNote | createdAt | updatedAt
const HEADERS = [
  'id', 'citizenName', 'contact', 'ward', 'area',
  'category', 'subject', 'description',
  'status', 'priority', 'followUpDate',
  'internalNotes', 'resolvedNote',
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
      const record = {
        ...req.body,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };

      await appendRow(TAB, HEADERS, record);
      return res.status(201).json({ success: true, data: record });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[records/index]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
