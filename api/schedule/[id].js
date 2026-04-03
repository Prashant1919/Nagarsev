// api/schedule/[id].js
// PUT    /api/schedule/:id  → update event
// DELETE /api/schedule/:id  → delete event

const {
  updateRowById,
  deleteRowById,
  readSheet,
  handleCors,
  verifyToken,
} = require('../_sheets');

const TAB = 'Schedule';

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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'ID is required' });
  }

  try {
    // ── PUT ──────────────────────────────────────
    if (req.method === 'PUT') {
      const updates = { ...req.body, id, updatedAt: new Date().toISOString() };
      const ok = await updateRowById(TAB, HEADERS, id, updates);

      if (!ok) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      // Read back the updated row to return it
      const rows = await readSheet(TAB);
      const updated = rows.find((r) => r.id === id);
      return res.status(200).json({ success: true, data: updated });
    }

    // ── DELETE ────────────────────────────────────
    if (req.method === 'DELETE') {
      const ok = await deleteRowById(TAB, id);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[schedule/[id]]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
