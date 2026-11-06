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

  function trackClick(code) {
    markUsed(code);
    if (!CFG.API_URL) return;
    try {
      fetch(CFG.API_URL, {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'click', code: code })
      }).catch(function () {});
    } catch (e) {}
  }

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

  function load() {
    if (!CFG.API_URL) {
      state.loaded = true; state.error = 'notConfigured';
      renderList();
      return;
    }
    fetch(CFG.API_URL + '?action=list&t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) throw new Error('bad');
        state.codes = d.codes || [];
        state.featured = d.featured || null;
        state.loaded = true; state.error = null;
        setupPinned('featured', state.featured);
        renderList();
      })
      .catch(function () {
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
    var btn = $('addBtn');
    btn.disabled = true;
    setMsg(t('sending'));
    fetch(CFG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'add', code: code })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) {
          setMsg(t(d.status === 'exists' ? 'exists' : 'added'), 'ok');
          $('codeInput').value = '';
          markUsed(code); // don't show your own code to yourself first
          load();
        } else if (d && d.error === 'invalid') {
          setMsg(t('invalid'), 'err');
        } else {
          setMsg(t('busy'), 'err');
        }
      })
      .catch(function () { setMsg(t('busy'), 'err'); })
      .then(function () { btn.disabled = false; });
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
  setInterval(load, 5 * 60 * 1000); // refresh list every 5 min
})();
