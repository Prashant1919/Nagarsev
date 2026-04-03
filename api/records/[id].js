// api/records/[id].js
// PUT    /api/records/:id  → update record
// DELETE /api/records/:id  → delete record

const {
  updateRowById,
  deleteRowById,
  readSheet,
  handleCors,
  verifyToken,
} = require('../_sheets');

const TAB = 'Records';

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
        return res.status(404).json({ success: false, error: 'Record not found' });
      }

      const rows = await readSheet(TAB);
      const updated = rows.find((r) => r.id === id);
      return res.status(200).json({ success: true, data: updated });
    }

    // ── DELETE ────────────────────────────────────
    if (req.method === 'DELETE') {
      const ok = await deleteRowById(TAB, id);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[records/[id]]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
