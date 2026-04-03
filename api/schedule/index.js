// api/schedule/index.js
// GET  /api/schedule   → list all events
// POST /api/schedule   → create a new event

const { v4: uuidv4 } = require('uuid');
const {
  readSheet,// api/schedule/index.js
// GET    /api/schedule        → list all events (sorted by createdAt desc)
// POST   /api/schedule        → create a new event
// PUT    /api/schedule        → update an existing event (pass id in body)
// DELETE /api/schedule?id=xx  → delete an event by id

const { v4: uuidv4 } = require('uuid');
const {
  readSheet,
  appendRow,
  updateRow,
  deleteRow,
  handleCors,
  verifyToken,
} = require('../_sheets');

const TAB = 'Schedule';

// Column order MUST match the header row in your Google Sheet "Schedule" tab.
// Row 1 must be exactly:
// id | date | time | title | description | location | status | priority | attendees | createdAt | updatedAt
const HEADERS = [
  'id',
  'date',
  'time',
  'title',
  'description',
  'location',
  'status',
  'priority',
  'attendees',
  'createdAt',
  'updatedAt',
];

// ─────────────────────────────────────────────
// Utility: trim all string keys and values in an object
// Prevents whitespace issues when reading/writing Google Sheets
// ─────────────────────────────────────────────
function trimFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [
      key.trim(),
      typeof val === 'string' ? val.trim() : val,
    ])
  );
}

// ─────────────────────────────────────────────
// Utility: validate required fields on POST
// ─────────────────────────────────────────────
function validateEvent(body) {
  const required = ['date', 'time', 'title'];
  const missing = required.filter(
    (field) => !body[field] || String(body[field]).trim() === ''
  );
  return missing;
}

// ─────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (handleCors(req, res)) return;

  // Auth check
  if (!verifyToken(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // ─────────────────────────────────────────
    // GET /api/schedule
    // Returns all schedule events sorted by createdAt descending
    // ─────────────────────────────────────────
    if (req.method === 'GET') {
      const rows = await readSheet(TAB);

      // Trim whitespace from every cell value coming from the sheet
      const cleaned = rows.map((row) => trimFields(row));

      // Sort by createdAt descending (most recently created first)
      cleaned.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.trim()) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt.trim()) : 0;
        return dateB - dateA;
      });

      return res.status(200).json({
        success: true,
        count: cleaned.length,
        data: cleaned,
      });
    }

    // ─────────────────────────────────────────
    // POST /api/schedule
    // Creates a new schedule event
    // ─────────────────────────────────────────
    if (req.method === 'POST') {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Request body is empty',
        });
      }

      // Trim all incoming fields
      const cleanBody = trimFields(req.body);

      // Validate required fields
      const missingFields = validateEvent(cleanBody);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        });
      }

      const now = new Date().toISOString();

      const event = {
        id:          uuidv4(),
        date:        cleanBody.date        || '',
        time:        cleanBody.time        || '',
        title:       cleanBody.title       || '',
        description: cleanBody.description || '',
        location:    cleanBody.location    || '',
        status:      cleanBody.status      || 'scheduled',
        priority:    cleanBody.priority    || 'medium',
        attendees:   cleanBody.attendees   || '',
        createdAt:   now,
        updatedAt:   now,
      };

      await appendRow(TAB, HEADERS, event);

      return res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: event,
      });
    }

    // ─────────────────────────────────────────
    // PUT /api/schedule
    // Updates an existing event — requires { id } in body
    // ─────────────────────────────────────────
    if (req.method === 'PUT') {
      if (!req.body || !req.body.id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: id',
        });
      }

      const cleanBody = trimFields(req.body);
      const now = new Date().toISOString();

      // Read existing rows to find the record
      const rows = await readSheet(TAB);
      const cleaned = rows.map((row) => trimFields(row));
      const existingIndex = cleaned.findIndex(
        (row) => row.id === cleanBody.id
      );

      if (existingIndex === -1) {
        return res.status(404).json({
          success: false,
          error: `Event with id "${cleanBody.id}" not found`,
        });
      }

      // Merge existing record with new values
      const updatedEvent = {
        ...cleaned[existingIndex],
        ...cleanBody,
        updatedAt: now,
      };

      // updateRow must update the sheet row at existingIndex + 2 (1 header + 1-indexed)
      await updateRow(TAB, HEADERS, updatedEvent, existingIndex + 2);

      return res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent,
      });
    }

    // ─────────────────────────────────────────
    // DELETE /api/schedule?id=xxxx
    // Deletes an event by id
    // ─────────────────────────────────────────
    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;

      if (!id || String(id).trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Missing required query param: id',
        });
      }

      const rows = await readSheet(TAB);
      const cleaned = rows.map((row) => trimFields(row));
      const existingIndex = cleaned.findIndex(
        (row) => row.id === String(id).trim()
      );

      if (existingIndex === -1) {
        return res.status(404).json({
          success: false,
          error: `Event with id "${id}" not found`,
        });
      }

      // deleteRow removes sheet row at existingIndex + 2 (1 header + 1-indexed)
      await deleteRow(TAB, existingIndex + 2);

      return res.status(200).json({
        success: true,
        message: `Event "${id}" deleted successfully`,
      });
    }

    // ─────────────────────────────────────────
    // Method not allowed
    // ─────────────────────────────────────────
    return res.status(405).json({
      success: false,
      error: `Method "${req.method}" not allowed`,
    });

  } catch (err) {
    console.error('[schedule/index] ERROR:', {
      method:  req.method,
      message: err.message,
      stack:   err.stack,
    });

    return res.status(500).json({
      success: false,
      error:   err.message || 'Internal server error',
    });
  }
};
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
