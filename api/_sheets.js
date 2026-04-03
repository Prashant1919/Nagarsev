// api/_sheets.js
// Shared Google Sheets client — used by all API route handlers.
// Authenticates via a Service Account whose credentials are stored in
// Vercel environment variables.

const { google } = require('googleapis');

const SPREADSHEET_ID = '1nZjXop8q2K2JwayI84ANrFeM1Tq-3I2kgAz2NKdZtuM';

// ── Auth ────────────────────────────────────────────────────────
function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// ── Generic read ────────────────────────────────────────────────
/**
 * Read all rows from a named sheet tab.
 * Row 1 is treated as the header; returns array of objects.
 */
async function readSheet(tabName) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A1:Z`,
  });

  const rows = res.data.values ?? [];
  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
  );
}

// ── Generic append ──────────────────────────────────────────────
/**
 * Append a single row object to a sheet tab.
 * Values are ordered to match the header row.
 */
async function appendRow(tabName, headers, rowObj) {
  const sheets = await getSheetsClient();
  const values = [headers.map((h) => rowObj[h] ?? '')];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

// ── Generic update ──────────────────────────────────────────────
/**
 * Find a row by id (column A) and update it in-place.
 * Returns true on success, false if not found.
 */
async function updateRowById(tabName, headers, id, updates) {
  const sheets = await getSheetsClient();

  // Read current data to find the row index
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A1:Z`,
  });

  const rows = res.data.values ?? [];
  if (rows.length < 2) return false;

  const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === id);
  if (rowIndex === -1) return false;

  // Merge existing row with updates
  const existingObj = Object.fromEntries(headers.map((h, i) => [h, rows[rowIndex][i] ?? '']));
  const merged = { ...existingObj, ...updates, id };
  const newRow = headers.map((h) => merged[h] ?? '');

  const sheetRowNum = rowIndex + 1; // 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A${sheetRowNum}:${colLetter(headers.length)}${sheetRowNum}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [newRow] },
  });
  return true;
}

// ── Generic delete ──────────────────────────────────────────────
/**
 * Find a row by id and clear it (sets all cells to empty).
 * Note: this "soft deletes" by clearing. To hard-delete, use batchUpdate
 * with deleteDimension — implemented here for simplicity.
 */
async function deleteRowById(tabName, id) {
  const sheets = await getSheetsClient();

  // First get sheet metadata to find sheetId
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets.find(
    (s) => s.properties.title === tabName
  );
  if (!sheet) return false;
  const sheetId = sheet.properties.sheetId;

  // Find row index
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A:A`,
  });
  const col = res.data.values ?? [];
  const rowIndex = col.findIndex((r, i) => i > 0 && r[0] === id);
  if (rowIndex === -1) return false;

  // Delete the actual row (hard delete via batchUpdate)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,   // 0-indexed in batchUpdate
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
  return true;
}

// ── Helpers ─────────────────────────────────────────────────────
function colLetter(n) {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// ── CORS ─────────────────────────────────────────────────────────
function handleCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

// ── JWT verification ─────────────────────────────────────────────
function verifyToken(req) {
  const authHeader = req.headers.authorization ?? '';
  if (!authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  try {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  readSheet,
  appendRow,
  updateRowById,
  deleteRowById,
  handleCors,
  verifyToken,
  SPREADSHEET_ID,
};
