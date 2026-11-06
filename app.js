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
      notConfigured: 'لم يتم ربط قاعدة البيانات بعد (API_URL في config.js).',
      invalid: 'الكود غير صحيح. يجب أن يبدأ بـ NG- مثل NG-Glutro42',
      added: 'تمت إضافة كودك بنجاح 🎉',
      exists: 'هذا الكود موجود مسبقاً ✓',
      busy: 'الخادم مشغول، حاول بعد دقيقة.',
      sending: 'جارٍ الإضافة…',
      retrying: 'الخادم مشغول، جارٍ إعادة المحاولة تلقائياً…',
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
      notConfigured: 'Database not connected yet (API_URL in config.js).',
      invalid: 'Invalid code. It must start with NG- like NG-Glutro42',
      added: 'Your code was added 🎉',
      exists: 'This code is already listed ✓',
      busy: 'Server is busy, try again in a minute.',
      sending: 'Adding…',
      retrying: 'Server busy, retrying automatically…',
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
    renderList();
  }

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

  function copy(code) {
    var done = function () { toast(t('copied')); };
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

  function post(body, opts) {
    return fetch(CFG.API_URL, {
      method: 'POST',
      keepalive: !!(opts && opts.keepalive),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  // Retries "busy" / network / Google quota errors with growing delays + jitter
  function postRetry(body, tries, onRetry) {
    var attempt = 0;
    function go() {
      return post(body).then(function (d) {
        if (d && (d.ok || d.error === 'invalid')) return d;
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
    if (!CFG.API_URL) return;
    var pending = lsGet('pendingAdds', []);
    if (!pending.length) return;
    var code = pending[0];
    postRetry({ action: 'add', code: code }, 3).then(function () {
      lsSet('pendingAdds', lsGet('pendingAdds', []).filter(function (c) { return c !== code; }));
      flushPending();
    }, function () { /* try again on next refresh */ });
  }

  // ---------- batched click tracking ----------
  var clickQueue = lsGet('clickQueue', []);
  var clickTimer = null;

  function trackClick(code) {
    markUsed(code);
    if (!CFG.API_URL) return;
    clickQueue.push(code);
    lsSet('clickQueue', clickQueue);
    if (!clickTimer) clickTimer = setTimeout(flushClicks, 20000);
  }

  function flushClicks(keepalive) {
    clearTimeout(clickTimer); clickTimer = null;
    if (!CFG.API_URL || !clickQueue.length) return;
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

  // ---------- data ----------
  var state = { codes: [], featured: null, loaded: false, error: null, shown: PAGE_SIZE, shuffleSeed: Math.random() };

  function fetchList(tries) {
    return fetch(CFG.API_URL + '?action=list&t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!d || !d.ok) throw new Error('bad'); return d; })
      .catch(function (err) {
        if (tries <= 1) throw err;
        return sleep(1500 + Math.random() * 1500).then(function () { return fetchList(tries - 1); });
      });
  }

  function load() {
    if (!CFG.API_URL) {
      state.loaded = true; state.error = 'notConfigured';
      renderList();
      return;
    }
    flushPending();
    fetchList(3)
      .then(function (d) {
        state.codes = d.codes || [];
        // Keep codes still waiting to be sent visible to their owner
        lsGet('pendingAdds', []).forEach(function (p) {
          var lc = p.toLowerCase();
          if (!state.codes.some(function (c) { return c.code.toLowerCase() === lc; })) {
            state.codes.push({ code: p, added: Date.now(), clicks: 0 });
          }
        });
        state.featured = d.featured || null;
        state.loaded = true; state.error = null;
        setupPinned('featured', state.featured);
        renderList();
      })
      .catch(function () {
        if (state.loaded && !state.error) return; // keep showing the last good list
        state.loaded = true; state.error = 'loadErr';
        renderList();
      });
  }

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function sorted() {
    var q = $('search').value.trim().toLowerCase();
    var mode = $('sort').value;
    var owner = CFG.OWNER_CODE.toLowerCase();
    var list = state.codes.filter(function (c) {
      var lc = c.code.toLowerCase();
      return lc !== owner && (!q || lc.indexOf(q) !== -1);
    });
    if (mode === 'newest') {
      list.sort(function (a, b) { return b.added - a.added; });
    } else if (mode === 'random') {
      var s = String(state.shuffleSeed);
      list.sort(function (a, b) { return hash(a.code + s) - hash(b.code + s); });
    } else {
      list.sort(function (a, b) { return (a.clicks - b.clicks) || (b.added - a.added); });
    }
    // Codes this visitor already opened go to the end
    list.sort(function (a, b) { return (usedSet[a.code] ? 1 : 0) - (usedSet[b.code] ? 1 : 0); });
    return list;
  }

  function renderList() {
    var box = $('codes'), msg = $('listMsg'), more = $('moreBtn');
    box.textContent = '';
    if (!state.loaded) { msg.textContent = t('loading'); more.hidden = true; $('count').textContent = ''; return; }
    if (state.error) { msg.textContent = t(state.error); more.hidden = true; $('count').textContent = ''; return; }

    var list = sorted();
    var total = state.codes.filter(function (c) { return c.code.toLowerCase() !== CFG.OWNER_CODE.toLowerCase(); }).length;
    $('count').textContent = total;
    msg.textContent = list.length ? '' : (total ? t('noMatch') : t('empty'));

    var frag = document.createDocumentFragment();
    list.slice(0, state.shown).forEach(function (c) {
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
    more.hidden = list.length <= state.shown;
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
    if (!CFG.API_URL) { setMsg(t('notConfigured'), 'err'); return; }

    var lc = code.toLowerCase();
    var already = state.codes.some(function (c) { return c.code.toLowerCase() === lc; });
    $('codeInput').value = '';
    markUsed(code); // don't show your own code to yourself first
    if (already) { setMsg(t('exists'), 'ok'); return; }

    // Optimistic: show it immediately, roll back only if the server refuses
    var entry = { code: code, added: Date.now(), clicks: 0 };
    state.codes.push(entry);
    renderList();
    setMsg(t('added'), 'ok');

    postRetry({ action: 'add', code: code }, 5, function () { setMsg(t('retrying')); })
      .then(function (d) {
        if (d.ok) { setMsg(t('added'), 'ok'); return; }
        // invalid (server-side)
        state.codes = state.codes.filter(function (c) { return c !== entry; });
        renderList();
        $('codeInput').value = code;
        setMsg(t('invalid'), 'err');
      }, function () {
        // Still failing after retries: keep it locally and send it later automatically
        var pending = lsGet('pendingAdds', []);
        if (pending.indexOf(code) === -1) pending.push(code);
        lsSet('pendingAdds', pending);
        setMsg(t('queued'), 'ok');
      });
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
  $('search').addEventListener('input', function () { state.shown = PAGE_SIZE; renderList(); });
  $('sort').addEventListener('change', function () { state.shown = PAGE_SIZE; state.shuffleSeed = Math.random(); renderList(); });
  $('moreBtn').addEventListener('click', function () { state.shown += PAGE_SIZE; renderList(); });

  applyLang();
  setupPinned('owner', CFG.OWNER_CODE);
  setupPinned('featured', null);
  tick();
  setInterval(tick, 1000);
  load();
  if (clickQueue.length) clickTimer = setTimeout(flushClicks, 5000);
  setInterval(load, 5 * 60 * 1000); // refresh list every 5 min
})();
