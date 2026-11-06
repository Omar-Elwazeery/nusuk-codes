/**
 * Nusuk Codes - backend (Google Apps Script + Google Sheet)
 *
 * Setup:
 * 1. Create a new Google Sheet.
 * 2. Extensions > Apps Script, delete the default code, paste this file.
 * 3. Deploy > New deployment > type "Web app"
 *      Execute as: Me
 *      Who has access: Anyone
 * 4. Copy the Web App URL into config.js -> API_URL
 *
 * After editing this file, use Deploy > Manage deployments > Edit > New version
 * so the same URL gets the update.
 */

var OWNER_CODE = 'NG-Glutro42';      // excluded from the random featured pick
var SHEET_NAME = 'codes';
var ROTATE_MS = 30 * 60 * 1000;      // featured code changes every 30 minutes
var CODE_RE = /^NG-[A-Za-z0-9]{4,24}$/;
var MAX_ADDS_PER_MIN = 40;           // simple global anti-spam limit
var CACHE_KEY = 'list_v1';
var CACHE_SECONDS = 30;

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'list';
  if (action === 'list') return json_(listPayload_());
  return json_({ ok: false, error: 'unknown_action' });
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  if (body.action === 'add') return json_(addCode_(body.code));
  if (body.action === 'click') return json_(click_(body.code));
  return json_({ ok: false, error: 'unknown_action' });
}

// ---------- actions ----------

function listPayload_() {
  var cache = CacheService.getScriptCache();
  var slot = Math.floor(Date.now() / ROTATE_MS);
  var cached = cache.get(CACHE_KEY);
  var codes;
  if (cached) {
    codes = JSON.parse(cached);
  } else {
    codes = readAll_().map(function (r) { return { code: r.code, added: r.added, clicks: r.clicks }; });
    try { cache.put(CACHE_KEY, JSON.stringify(codes), CACHE_SECONDS); } catch (err) {} // >100KB is skipped
  }
  return {
    ok: true,
    codes: codes,
    featured: pickFeatured_(codes, slot),
    nextChange: (slot + 1) * ROTATE_MS
  };
}

function addCode_(raw) {
  var code = normalize_(raw);
  if (!code) return { ok: false, error: 'invalid' };

  var cache = CacheService.getScriptCache();
  var rateKey = 'adds_' + Math.floor(Date.now() / 60000);
  var adds = Number(cache.get(rateKey) || 0);
  if (adds >= MAX_ADDS_PER_MIN) return { ok: false, error: 'rate_limited' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'busy' };
  try {
    var sh = sheet_();
    if (findRow_(sh, code)) return { ok: true, status: 'exists' };
    var now = Date.now();
    sh.appendRow([code, now, 0]);
    cache.put(rateKey, String(adds + 1), 120);
    // Update the cached list in place so the next "list" stays fast
    var cached = cache.get(CACHE_KEY);
    if (cached) {
      var list = JSON.parse(cached);
      list.push({ code: code, added: now, clicks: 0 });
      try { cache.put(CACHE_KEY, JSON.stringify(list), CACHE_SECONDS); } catch (err) { cache.remove(CACHE_KEY); }
    }
    return { ok: true, status: 'added' };
  } finally {
    lock.releaseLock();
  }
}

// No lock: a rare lost increment is fine, and it never blocks people adding codes
function click_(raw) {
  var code = normalize_(raw);
  if (!code) return { ok: false, error: 'invalid' };
  var sh = sheet_();
  var row = findRow_(sh, code);
  if (!row) return { ok: false, error: 'not_found' };
  var cell = sh.getRange(row, 3);
  cell.setValue((Number(cell.getValue()) || 0) + 1);
  return { ok: true };
}

// Fast exact lookup in column A (case-insensitive), returns row number or 0
function findRow_(sh, code) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var hit = sh.getRange(2, 1, last - 1, 1).createTextFinder(code).matchEntireCell(true).matchCase(false).findNext();
  return hit ? hit.getRow() : 0;
}

// ---------- helpers ----------

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['code', 'added', 'clicks']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function readAll_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 3).getValues()
    .map(function (r, i) {
      return { code: String(r[0]).trim(), added: Number(r[1]) || 0, clicks: Number(r[2]) || 0, row: i + 2 };
    })
    .filter(function (r) { return CODE_RE.test(r.code); });
}

function normalize_(raw) {
  var s = String(raw || '').trim();
  var m = s.match(/[?&]id=([^&#\s]+)/i);
  if (m) s = decodeURIComponent(m[1]);
  m = s.match(/NG-[A-Za-z0-9]+/i);
  if (m) s = m[0];
  s = s.replace(/^ng-/i, 'NG-');
  return CODE_RE.test(s) ? s : null;
}

// Same random code for every visitor during a 30-minute window
function pickFeatured_(codes, slot) {
  var owner = OWNER_CODE.toLowerCase();
  var pool = codes
    .filter(function (c) { return c.code.toLowerCase() !== owner; })
    .sort(function (a, b) { return a.added - b.added; });
  if (!pool.length) return null;
  var h = slot >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return pool[h % pool.length].code;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
