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
var MAX_ADDS_PER_MIN = 120;          // simple global anti-spam limit
var CACHE_KEY = 'list_v2';
var CACHE_SECONDS = 60;
var CHUNK = 90000;                   // CacheService max is 100KB per value
var MAX_CLICK_BATCH = 50;

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'list';
  if (action === 'list') return json_(listPayload_());
  return json_({ ok: false, error: 'unknown_action' });
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  if (body.action === 'add') return json_(addCode_(body.code));
  if (body.action === 'clicks') return json_(clicks_(body.codes));
  if (body.action === 'click') return json_(clicks_([body.code])); // old clients
  return json_({ ok: false, error: 'unknown_action' });
}

// ---------- actions ----------

function listPayload_() {
  var slot = Math.floor(Date.now() / ROTATE_MS);
  var codes = cacheGet_();
  if (!codes) {
    codes = readAll_();
    cachePut_(codes);
  }
  return {
    ok: true,
    codes: codes,
    featured: pickFeatured_(codes, slot),
    nextChange: (slot + 1) * ROTATE_MS
  };
}

// No lock: appendRow is atomic, so adds never queue behind each other.
// A rare duplicate (same code submitted at the same instant) is merged in readAll_.
function addCode_(raw) {
  var code = normalize_(raw);
  if (!code) return { ok: false, error: 'invalid' };

  var cache = CacheService.getScriptCache();
  var rateKey = 'adds_' + Math.floor(Date.now() / 60000);
  var adds = Number(cache.get(rateKey) || 0);
  if (adds >= MAX_ADDS_PER_MIN) return { ok: false, error: 'rate_limited' };

  var sh = sheet_();
  if (findRow_(sh, code)) return { ok: true, status: 'exists' };
  sh.appendRow([code, Date.now(), 0]);
  cache.put(rateKey, String(adds + 1), 120);
  cacheClear_();
  return { ok: true, status: 'added' };
}

// Batched click counts: one request carries many clicks.
function clicks_(list) {
  if (!Array.isArray(list)) return { ok: false, error: 'invalid' };
  var counts = {};
  list.slice(0, MAX_CLICK_BATCH).forEach(function (raw) {
    var c = normalize_(raw);
    if (c) counts[c] = (counts[c] || 0) + 1;
  });
  var keys = Object.keys(counts);
  if (!keys.length) return { ok: true };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return { ok: false, error: 'busy' }; // client keeps them and retries
  try {
    var sh = sheet_();
    keys.forEach(function (code) {
      var row = findRow_(sh, code);
      if (!row) return;
      var cell = sh.getRange(row, 3);
      cell.setValue((Number(cell.getValue()) || 0) + counts[code]);
    });
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
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

// Reads all valid codes, merging duplicates (keeps earliest, sums clicks)
function readAll_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var seen = {}, out = [];
  sh.getRange(2, 1, last - 1, 3).getValues().forEach(function (r) {
    var code = String(r[0]).trim();
    if (!CODE_RE.test(code)) return;
    var key = code.toLowerCase();
    var added = Number(r[1]) || 0, clicks = Number(r[2]) || 0;
    if (seen[key]) {
      seen[key].clicks += clicks;
      seen[key].added = Math.min(seen[key].added, added);
      return;
    }
    seen[key] = { code: code, added: added, clicks: clicks };
    out.push(seen[key]);
  });
  return out;
}

// Fast exact lookup in column A (case-insensitive), returns row number or 0
function findRow_(sh, code) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var hit = sh.getRange(2, 1, last - 1, 1).createTextFinder(code).matchEntireCell(true).matchCase(false).findNext();
  return hit ? hit.getRow() : 0;
}

// Chunked cache so large lists (thousands of codes) still stay cached
function cachePut_(codes) {
  var s = JSON.stringify(codes), map = {}, n = 0;
  for (var i = 0; i < s.length; i += CHUNK) map[CACHE_KEY + '_' + (n++)] = s.substr(i, CHUNK);
  map[CACHE_KEY + '_n'] = String(n);
  try { CacheService.getScriptCache().putAll(map, CACHE_SECONDS); } catch (err) {}
}

function cacheGet_() {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(CACHE_KEY + '_n'));
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < n; i++) keys.push(CACHE_KEY + '_' + i);
  var parts = cache.getAll(keys), s = '';
  for (var j = 0; j < n; j++) {
    if (parts[keys[j]] == null) return null;
    s += parts[keys[j]];
  }
  try { return JSON.parse(s); } catch (err) { return null; }
}

function cacheClear_() {
  CacheService.getScriptCache().remove(CACHE_KEY + '_n');
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
