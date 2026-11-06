(function () {
  'use strict';

  var CFG = window.NUSUK_CONFIG;
  var ROTATE_MS = CFG.ROTATE_MINUTES * 60 * 1000;
  var PAGE_SIZE = 60;
  var CODE_RE = /^NG-[A-Za-z0-9]{4,24}$/;

  // ---------- i18n ----------
  var T = {
    ar: {
      brand: 'أكواد تحدي نسك',
      heroTitle: 'تبادل الأكواد واربح مفاتيح أكثر',
      heroText: 'في تحدي نسك تحصل على مفتاح مجاني كل يوم لتجيب على سؤال. عندما تستخدم كود شخص آخر تحصل أنت وهو على مفتاح إضافي.',
      step1: 'اضغط "افتح في نسك" على أي كود',
      step2: 'سجّل أو ادخل في التطبيق لتحصل على المفتاح',
      step3: 'أضف كودك بالأسفل ليستخدمه الآخرون',
      pinned: '📌 أكواد مثبتة',
      ownerBadge: 'كود صاحب الموقع',
      featuredBadge: 'كود مميز عشوائي',
      changesIn: 'يتغير بعد',
      open: 'افتح في نسك',
      copy: 'نسخ',
      copied: 'تم النسخ ✓',
      addTitle: 'أضف كودك',
      addBtn: 'إضافة',
      addHint: 'الصق الكود (يبدأ بـ NG-) أو رابط المشاركة كاملاً من التطبيق.',
      allCodes: 'كل الأكواد',
      sortLeast: 'الأقل استخداماً',
      sortNewest: 'الأحدث',
      sortRandom: 'عشوائي',
      more: 'عرض المزيد',
      disclaimer: 'هذا موقع مجتمعي غير رسمي ولا يتبع لتطبيق نسك أو وزارة الحج والعمرة.',
      loading: 'جارٍ التحميل…',
      empty: 'لا توجد أكواد بعد. كن أول من يضيف كوده!',
      noMatch: 'لا توجد نتائج.',
      loadErr: 'تعذّر تحميل الأكواد. حاول مرة أخرى لاحقاً.',
      notConfigured: 'لم يتم ربط قاعدة البيانات بعد (SUPABASE_URL في config.js).',
      invalid: 'الكود غير صحيح. يجب أن يبدأ بـ NG- مثل NG-Glutro42',
      added: 'تمت إضافة كودك بنجاح 🎉',
      exists: 'هذا الكود موجود مسبقاً ✓',
      busy: 'الخادم مشغول، حاول بعد دقيقة.',
      rateLimited: 'أضفت أكواداً كثيرة خلال وقت قصير. حاول مرة أخرى بعد 10 دقائق.',
      shareWa: 'شارك على واتساب',
      shareLink: 'مشاركة الرابط',
      linkCopied: 'تم نسخ رابط الموقع ✓',
      shareText: '🕋 تحدي نسك: فرصة للفوز بعمرة مجانية!\nاستخدم أكواد الآخرين وأضف كودك ليحصل الجميع على مفاتيح إضافية:',
      bulkLimited: 'تمت إضافة {added}. وصلت للحد المسموح، بقي {left} كود في المربع — أعد المحاولة بعد 10 دقائق.',
      sending: 'جارٍ الإضافة…',
      retrying: 'الخادم مشغول، جارٍ إعادة المحاولة تلقائياً…',
      bulkTitle: 'إضافة عدة أكواد دفعة واحدة',
      bulkHint: 'الصق أي نص يحتوي على أكواد (كود في كل سطر، أو رسائل وروابط المشاركة). سيتم استخراج كل الأكواد تلقائياً.',
      bulkBtn: 'إضافة الكل',
      bulkFound: 'تم العثور على {n} كود',
      bulkNone: 'لم يتم العثور على أي كود يبدأ بـ NG-',
      bulkProgress: 'جارٍ الإضافة… {done} / {total}',
      bulkDone: 'تمت إضافة {added} كود جديد، و{exists} موجود مسبقاً ✓',
      bulkQueued: 'تمت إضافة {added}، و{queued} محفوظة وستُرسل تلقائياً لاحقاً',
      queued: 'تم حفظ كودك وسيُرسل تلقائياً خلال دقائق ✓',
      noFeatured: 'لا يوجد',
      uses: 'استخدام',
      opened: 'تم فتحه',
      lang: 'English'
    },
    en: {
      brand: 'Nusuk Challenge Codes',
      heroTitle: 'Share codes, earn more keys',
      heroText: 'In the Nusuk Challenge you get one free key every day to answer a question. When you use someone else\'s code, both of you get an extra key.',
      step1: 'Tap "Open in Nusuk" on any code',
      step2: 'Sign up or log in to the app to get your key',
      step3: 'Add your own code below so others can use it',
      pinned: '📌 Pinned codes',
      ownerBadge: 'Site owner\'s code',
      featuredBadge: 'Random featured code',
      changesIn: 'Changes in',
      open: 'Open in Nusuk',
      copy: 'Copy',
      copied: 'Copied ✓',
      addTitle: 'Add your code',
      addBtn: 'Add',
      addHint: 'Paste your code (starts with NG-) or the full share link from the app.',
      allCodes: 'All codes',
      sortLeast: 'Least used',
      sortNewest: 'Newest',
      sortRandom: 'Random',
      more: 'Show more',
      disclaimer: 'This is an unofficial community site, not affiliated with the Nusuk app or the Ministry of Hajj and Umrah.',
      loading: 'Loading…',
      empty: 'No codes yet. Be the first to add yours!',
      noMatch: 'No results.',
      loadErr: 'Could not load codes. Please try again later.',
      notConfigured: 'Database not connected yet (SUPABASE_URL in config.js).',
      invalid: 'Invalid code. It must start with NG- like NG-Glutro42',
      added: 'Your code was added 🎉',
      exists: 'This code is already listed ✓',
      busy: 'Server is busy, try again in a minute.',
      rateLimited: 'You added a lot of codes in a short time. Please try again in 10 minutes.',
      shareWa: 'Share on WhatsApp',
      shareLink: 'Share link',
      linkCopied: 'Site link copied ✓',
      shareText: '🕋 Nusuk Challenge: a chance to win a free Umrah!\nUse other people\'s codes and add yours so everyone gets extra keys:',
      bulkLimited: '{added} added. You reached the limit; {left} codes are left in the box. Try again in 10 minutes.',
      sending: 'Adding…',
      retrying: 'Server busy, retrying automatically…',
      bulkTitle: 'Add many codes at once',
      bulkHint: 'Paste any text containing codes (one per line, or share messages and links). All codes are extracted automatically.',
      bulkBtn: 'Add all',
      bulkFound: '{n} codes found',
      bulkNone: 'No codes starting with NG- were found',
      bulkProgress: 'Adding… {done} / {total}',
      bulkDone: '{added} new codes added, {exists} already listed ✓',
      bulkQueued: '{added} added, {queued} saved and will be sent automatically later',
      queued: 'Your code is saved and will be sent automatically in a few minutes ✓',
      noFeatured: 'None',
      uses: 'uses',
      opened: 'Opened',
      lang: 'العربية'
    }
  };

  var lang = 'ar';
  try { lang = localStorage.getItem('lang') === 'en' ? 'en' : 'ar'; } catch (e) {}
  function t(k) { return T[lang][k] || k; }

  function applyLang() {
    var html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = t('brand');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    $('langBtn').textContent = t('lang');
    $('shareWa').href = 'https://wa.me/?text=' + encodeURIComponent(t('shareText') + '\n' + SITE_URL);
    renderList();
  }

  var SITE_URL = 'https://omar-elwazeery.github.io/nusuk-codes/';

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function link(code) { return CFG.APP_LINK.replace('{CODE}', encodeURIComponent(code)); }

  function normalize(raw) {
    var s = String(raw || '').trim();
    var m = s.match(/[?&]id=([^&#\s]+)/i);
    if (m) s = decodeURIComponent(m[1]);
    m = s.match(/NG-[A-Za-z0-9]+/i);
    if (m) s = m[0];
    s = s.replace(/^ng-/i, 'NG-');
    return CODE_RE.test(s) ? s : null;
  }

  var toastTimer;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }

  function copy(code, msgKey) {
    var done = function () { toast(t(msgKey || 'copied')); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(done, fallback);
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = code; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
  }

  // Codes this visitor already opened (so they can skip them)
  var usedSet = {};
  try { usedSet = JSON.parse(localStorage.getItem('usedCodes') || '{}') || {}; } catch (e) {}
  function markUsed(code) {
    usedSet[code] = 1;
    try { localStorage.setItem('usedCodes', JSON.stringify(usedSet)); } catch (e) {}
  }

  // ---------- network with retry ----------
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var CONFIGURED = !!(CFG.SUPABASE_URL && CFG.SUPABASE_KEY);

  // Calls a Supabase Postgres function (RPC). Throws on HTTP/network errors so callers can retry.
  function rpc(fn, args, opts) {
    var headers = { 'Content-Type': 'application/json', 'apikey': CFG.SUPABASE_KEY };
    if (/^eyJ/.test(CFG.SUPABASE_KEY)) headers.Authorization = 'Bearer ' + CFG.SUPABASE_KEY; // legacy anon key
    return fetch(CFG.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      keepalive: !!(opts && opts.keepalive),
      headers: headers,
      body: JSON.stringify(args || {})
    }).then(function (r) {
      if (!r.ok) throw new Error('http_' + r.status);
      return r.json();
    });
  }

  // Maps the site's actions to database functions
  function post(body, opts) {
    if (body.action === 'add') return rpc('add_codes', { p_codes: [body.code] }, opts);
    if (body.action === 'addMany') return rpc('add_codes', { p_codes: body.codes }, opts);
    if (body.action === 'clicks') return rpc('track_clicks', { p_codes: body.codes }, opts);
    return Promise.reject(new Error('unknown_action'));
  }

  // Retries "busy" / network / Google quota errors with growing delays + jitter
  function postRetry(body, tries, onRetry) {
    var attempt = 0;
    function go() {
      return post(body).then(function (d) {
        if (d && (d.ok || d.error === 'invalid' || d.error === 'rate_limited' || d.error === 'unknown_action')) return d;
        throw d || {};
      }).catch(function (err) {
        attempt++;
        if (attempt >= tries) throw err;
        if (onRetry) onRetry(attempt);
        return sleep(Math.min(1000 * Math.pow(2, attempt - 1), 8000) + Math.random() * 800).then(go);
      });
    }
    return go();
  }

  // ---------- pending adds (survive page reloads) ----------
  function lsGet(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function flushPending() {
    if (!CONFIGURED) return;
    var pending = lsGet('pendingAdds', []);
    if (!pending.length) return;
    var code = pending[0];
    postRetry({ action: 'add', code: code }, 3).then(function (d) {
      if (d && d.error === 'rate_limited') return; // keep it, try on a later visit
      lsSet('pendingAdds', lsGet('pendingAdds', []).filter(function (c) { return c !== code; }));
      flushPending();
    }, function () { /* try again on next refresh */ });
  }

  // ---------- batched click tracking ----------
  var clickQueue = lsGet('clickQueue', []);
  var clickTimer = null;

  function trackClick(code) {
    markUsed(code);
    if (!CONFIGURED) return;
    clickQueue.push(code);
    lsSet('clickQueue', clickQueue);
    if (!clickTimer) clickTimer = setTimeout(flushClicks, 20000);
  }

  function flushClicks(keepalive) {
    clearTimeout(clickTimer); clickTimer = null;
    if (!CONFIGURED || !clickQueue.length) return;
    var batch = clickQueue.slice(0, 50);
    if (keepalive === true) {
      // Page is closing: send and forget, so counts are not sent twice next visit
      clickQueue = clickQueue.slice(batch.length);
      lsSet('clickQueue', clickQueue);
      post({ action: 'clicks', codes: batch }, { keepalive: true }).catch(function () {});
      return;
    }
    post({ action: 'clicks', codes: batch }).then(function (d) {
      if (d && (d.ok || d.error === 'unknown_action')) {
        clickQueue = clickQueue.slice(batch.length);
        lsSet('clickQueue', clickQueue);
        if (clickQueue.length) clickTimer = setTimeout(flushClicks, 3000);
      } else {
        clickTimer = setTimeout(flushClicks, 30000);
      }
    }, function () { clickTimer = setTimeout(flushClicks, 30000); });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flushClicks(true);
  });

  function setupPinned(prefix, code) {
    var open = $(prefix + 'Open'), cp = $(prefix + 'Copy');
    $(prefix + 'Code').textContent = code || t('noFeatured');
    if (code) {
      open.href = link(code);
      open.removeAttribute('aria-disabled');
      cp.disabled = false;
    } else {
      open.removeAttribute('href');
      open.setAttribute('aria-disabled', 'true');
      cp.disabled = true;
    }
    open.onclick = function () { if (code) trackClick(code); };
    cp.onclick = function () { if (code) copy(code); };
  }

  // ---------- data (paged from the server) ----------
  var state = { codes: [], total: 0, all: 0, featured: null, loaded: false, error: null, loading: false, served: 0, serverTotal: 0, seed: String(Math.random()), reqId: 0 };

  function fetchPage(offset, tries) {
    return rpc('get_codes', {
      p_sort: $('sort').value,
      p_q: $('search').value.trim(),
      p_limit: PAGE_SIZE,
      p_offset: offset,
      p_seed: state.seed,
      p_exclude: CFG.OWNER_CODE
    }).then(function (d) {
      if (!d || !d.ok) throw new Error('bad');
      return d;
    }).catch(function (err) {
      if (tries <= 1) throw err;
      return sleep(1000 + Math.random() * 1500).then(function () { return fetchPage(offset, tries - 1); });
    });
  }

  // reset=true reloads from the first page; otherwise appends the next page
  function load(reset) {
    if (reset === undefined) reset = true;
    if (!CONFIGURED) {
      state.loaded = true; state.error = 'notConfigured';
      renderList();
      return;
    }
    if (reset) flushPending();
    var id = ++state.reqId;
    var offset = reset ? 0 : state.served;
    state.loading = true;
    if (!reset) renderList();
    fetchPage(offset, 3)
      .then(function (d) {
        if (id !== state.reqId) return; // a newer search/sort replaced this request
        var page = d.codes || [];
        state.served = (reset ? 0 : state.served) + page.length;
        state.serverTotal = d.total || 0;
        if (reset) {
          state.codes = page.slice();
          // Keep codes still waiting to be sent visible to their owner
          if (!$('search').value.trim()) {
            lsGet('pendingAdds', []).forEach(function (p) {
              var lc = p.toLowerCase();
              if (!state.codes.some(function (c) { return c.code.toLowerCase() === lc; })) {
                state.codes.unshift({ code: p, added: Date.now(), clicks: 0 });
              }
            });
          }
        } else {
          var have = {};
          state.codes.forEach(function (c) { have[c.code.toLowerCase()] = 1; });
          page.forEach(function (c) { if (!have[c.code.toLowerCase()]) state.codes.push(c); });
        }
        state.total = d.total || 0;
        state.all = d.all || 0;
        state.featured = d.featured || null;
        state.loaded = true; state.error = null; state.loading = false;
        setupPinned('featured', state.featured);
        renderList();
      })
      .catch(function () {
        if (id !== state.reqId) return;
        state.loading = false;
        if (state.loaded && !state.error) { renderList(); return; } // keep showing the last good list
        state.loaded = true; state.error = 'loadErr';
        renderList();
      });
  }

  // Server already sorted; just move codes this visitor opened to the end of what's loaded
  function sorted() {
    var owner = CFG.OWNER_CODE.toLowerCase();
    var list = state.codes.filter(function (c) { return c.code.toLowerCase() !== owner; });
    return list
      .map(function (c, i) { return { c: c, i: i, u: usedSet[c.code] ? 1 : 0 }; })
      .sort(function (a, b) { return (a.u - b.u) || (a.i - b.i); })
      .map(function (x) { return x.c; });
  }

  function addLocal(code) {
    state.codes.unshift({ code: code, added: Date.now(), clicks: 0 });
    state.total++; state.all++;
  }

  function renderList() {
    var box = $('codes'), msg = $('listMsg'), more = $('moreBtn');
    box.textContent = '';
    if (!state.loaded) { msg.textContent = t('loading'); more.hidden = true; $('count').textContent = ''; return; }
    if (state.error) { msg.textContent = t(state.error); more.hidden = true; $('count').textContent = ''; return; }

    var list = sorted();
    $('count').textContent = state.all;
    msg.textContent = list.length ? '' : (state.all ? t('noMatch') : t('empty'));

    var frag = document.createDocumentFragment();
    list.forEach(function (c) {
      var item = document.createElement('div');
      item.className = 'item' + (usedSet[c.code] ? ' used' : '');

      var code = document.createElement('div');
      code.className = 'code';
      code.textContent = c.code;

      var meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = (usedSet[c.code] ? t('opened') + ' · ' : '') + (c.clicks || 0) + ' ' + t('uses');

      var actions = document.createElement('div');
      actions.className = 'actions';
      var a = document.createElement('a');
      a.className = 'btn btn-primary';
      a.href = link(c.code); a.target = '_blank'; a.rel = 'noopener';
      a.textContent = t('open');
      a.addEventListener('click', function () {
        trackClick(c.code);
        c.clicks = (c.clicks || 0) + 1;
        item.classList.add('used');
        meta.textContent = t('opened') + ' · ' + c.clicks + ' ' + t('uses');
      });
      var b = document.createElement('button');
      b.className = 'btn btn-ghost'; b.type = 'button';
      b.textContent = t('copy');
      b.addEventListener('click', function () { copy(c.code); });
      actions.appendChild(a); actions.appendChild(b);

      item.appendChild(code); item.appendChild(meta); item.appendChild(actions);
      frag.appendChild(item);
    });
    box.appendChild(frag);
    more.hidden = state.served >= state.serverTotal;
    more.disabled = state.loading;
  }

  // ---------- add code ----------
  function setMsg(text, cls) {
    var m = $('addMsg');
    m.textContent = text;
    m.className = 'msg' + (cls ? ' ' + cls : '');
  }

  $('addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = normalize($('codeInput').value);
    if (!code) { setMsg(t('invalid'), 'err'); return; }
    if (!CONFIGURED) { setMsg(t('notConfigured'), 'err'); return; }

    var lc = code.toLowerCase();
    var already = state.codes.some(function (c) { return c.code.toLowerCase() === lc; });
    $('codeInput').value = '';
    markUsed(code); // don't show your own code to yourself first
    if (already) { setMsg(t('exists'), 'ok'); return; }

    // Optimistic: show it immediately, roll back only if the server refuses
    addLocal(code);
    var entry = state.codes[0];
    renderList();
    setMsg(t('added'), 'ok');

    postRetry({ action: 'add', code: code }, 5, function () { setMsg(t('retrying')); })
      .then(function (d) {
        if (d.ok) { setMsg(t(d.status === 'exists' ? 'exists' : 'added'), 'ok'); return; }
        // refused (invalid or too many from this person)
        state.codes = state.codes.filter(function (c) { return c !== entry; });
        state.total--; state.all--;
        renderList();
        $('codeInput').value = code;
        setMsg(t(d.error === 'rate_limited' ? 'rateLimited' : 'invalid'), 'err');
      }, function () {
        // Still failing after retries: keep it locally and send it later automatically
        var pending = lsGet('pendingAdds', []);
        if (pending.indexOf(code) === -1) pending.push(code);
        lsSet('pendingAdds', pending);
        setMsg(t('queued'), 'ok');
      });
  });

  // ---------- bulk add ----------
  function fmt(key, vals) {
    return t(key).replace(/\{(\w+)\}/g, function (_, k) { return vals[k]; });
  }

  function extractCodes(text) {
    var seen = {}, out = [];
    (String(text).match(/NG-[A-Za-z0-9]+/gi) || []).forEach(function (m) {
      var c = normalize(m);
      if (c && !seen[c.toLowerCase()]) { seen[c.toLowerCase()] = 1; out.push(c); }
    });
    return out;
  }

  function setBulkMsg(text, cls) {
    var m = $('bulkMsg');
    m.textContent = text;
    m.className = 'msg' + (cls ? ' ' + cls : '');
  }

  $('bulkInput').addEventListener('input', function () {
    var n = extractCodes(this.value).length;
    $('bulkCount').textContent = this.value.trim() ? fmt('bulkFound', { n: n }) : '';
  });

  $('bulkForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var codes = extractCodes($('bulkInput').value);
    if (!codes.length) { setBulkMsg(t('bulkNone'), 'err'); return; }
    if (!CONFIGURED) { setBulkMsg(t('notConfigured'), 'err'); return; }

    var known = {};
    state.codes.forEach(function (c) { known[c.code.toLowerCase()] = 1; });
    var fresh = codes.filter(function (c) { return !known[c.toLowerCase()]; });
    var existsLocal = codes.length - fresh.length;

    // Optimistic: show them in the list right away
    fresh.forEach(addLocal);
    renderList();

    var btn = $('bulkBtn');
    btn.disabled = true;
    var added = 0, exists = existsLocal, queued = [], limited = [], done = 0;
    var batches = [];
    for (var i = 0; i < fresh.length; i += 50) batches.push(fresh.slice(i, i + 50));

    function next() {
      if (!batches.length) return finish();
      var batch = batches.shift();
      setBulkMsg(fmt('bulkProgress', { done: done, total: fresh.length }));
      return postRetry({ action: 'addMany', codes: batch }, 5, function () { setBulkMsg(t('retrying')); })
        .then(function (d) {
          if (d.ok) { added += d.added || 0; exists += d.exists || 0; }
          else if (d.error === 'rate_limited') {
            // Stop here: give the rest back to the person to try later
            limited = batch.concat.apply(batch, batches);
            batches = [];
          }
          else { queued = queued.concat(batch); }
        }, function () { queued = queued.concat(batch); })
        .then(function () { done += batch.length; return next(); });
    }

    function finish() {
      btn.disabled = false;
      if (limited.length) {
        var lim = {};
        limited.forEach(function (c) { lim[c.toLowerCase()] = 1; });
        var before = state.codes.length;
        state.codes = state.codes.filter(function (c) { return !lim[c.code.toLowerCase()]; });
        state.total -= before - state.codes.length; state.all -= before - state.codes.length;
        renderList();
        $('bulkInput').value = limited.join('\n');
        $('bulkCount').textContent = fmt('bulkFound', { n: limited.length });
        setBulkMsg(fmt('bulkLimited', { added: added, left: limited.length }), 'err');
      } else if (queued.length) {
        var pending = lsGet('pendingAdds', []);
        queued.forEach(function (c) { if (pending.indexOf(c) === -1) pending.push(c); });
        lsSet('pendingAdds', pending);
        flushPending();
        setBulkMsg(fmt('bulkQueued', { added: added, queued: queued.length }), 'ok');
      } else {
        setBulkMsg(fmt('bulkDone', { added: added, exists: exists }), 'ok');
        $('bulkInput').value = '';
        $('bulkCount').textContent = '';
      }
    }

    if (!fresh.length) { btn.disabled = false; setBulkMsg(fmt('bulkDone', { added: 0, exists: exists }), 'ok'); return; }
    next();
  });

  // ---------- countdown for featured rotation ----------
  var currentSlot = Math.floor(Date.now() / ROTATE_MS);
  function tick() {
    var now = Date.now();
    var slot = Math.floor(now / ROTATE_MS);
    if (slot !== currentSlot) { currentSlot = slot; load(); }
    var left = Math.max(0, (slot + 1) * ROTATE_MS - now);
    var m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    $('countdown').textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ---------- wire up ----------
  $('langBtn').addEventListener('click', function () {
    lang = lang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem('lang', lang); } catch (e) {}
    applyLang();
    setupPinned('owner', CFG.OWNER_CODE);
    setupPinned('featured', state.featured);
    setMsg('');
  });
  $('shareBtn').addEventListener('click', function () {
    if (navigator.share) {
      navigator.share({ title: t('brand'), text: t('shareText'), url: SITE_URL }).catch(function () {});
    } else {
      copy(SITE_URL, 'linkCopied');
    }
  });

  var searchTimer;
  $('search').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { load(true); }, 350);
  });
  $('sort').addEventListener('change', function () { state.seed = String(Math.random()); load(true); });
  $('moreBtn').addEventListener('click', function () { load(false); });

  applyLang();
  setupPinned('owner', CFG.OWNER_CODE);
  setupPinned('featured', null);
  tick();
  setInterval(tick, 1000);
  load();
  if (clickQueue.length) clickTimer = setTimeout(flushClicks, 5000);
  setInterval(load, 5 * 60 * 1000); // refresh list every 5 min
})();
