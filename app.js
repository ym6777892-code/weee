/* ==========================================================================
   Digital Wedding Invitation — behaviour
   Reads window.WEDDING_CONFIG (js/config.js). No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.WEDDING_CONFIG || {};

  /* ---------- UI strings ---------- */
  var I18N = {
    en: {
      coverLabel: 'You are invited', coverTitle1: 'Wedding', coverTitle2: 'Invitation',
      open: 'Open Invitation', ofWedding: 'The Wedding of', saveTheDate: 'Save the Date',
      days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds',
      venue: 'The Venue', directions: 'Get Directions', schedule: 'Schedule', rsvp: 'RSVP',
      musicOn: 'Mute music', musicOff: 'Play music', switchTo: 'العربية', switchLabel: 'Switch to Arabic',
      pageTitle: 'Wedding Invitation',
      setupTitle: 'Almost ready',
      setupText: 'Add your wedding details in js/config.js. Empty fields stay hidden.'
    },
    ar: {
      coverLabel: 'أنتم مدعوون', coverTitle1: 'دعوة', coverTitle2: 'زفاف',
      open: 'افتح الدعوة', ofWedding: 'حفل زفاف', saveTheDate: 'موعد الزفاف',
      days: 'أيام', hours: 'ساعات', minutes: 'دقائق', seconds: 'ثوانٍ',
      venue: 'المكان', directions: 'الاتجاهات', schedule: 'برنامج الحفل', rsvp: 'تأكيد الحضور',
      musicOn: 'إيقاف الموسيقى', musicOff: 'تشغيل الموسيقى', switchTo: 'English', switchLabel: 'التبديل إلى الإنجليزية',
      pageTitle: 'دعوة زفاف',
      setupTitle: 'على وشك الانتهاء',
      setupText: 'أضف تفاصيل الزفاف في ملف js/config.js. الحقول الفارغة تبقى مخفية.'
    }
  };

  var lang = 'en';
  var countdownTimer = null;
  var audio = null;
  var playing = false;
  var resumeOnVisible = false;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- Config helpers ---------- */
  // A value may be a string, an array, or { ar, en }.
  function pick(v) {
    if (v && typeof v === 'object' && !Array.isArray(v) && ('ar' in v || 'en' in v)) {
      return v[lang] || v.en || v.ar || '';
    }
    return v == null ? '' : v;
  }
  function text(key) {
    var v = pick(C[key]);
    return typeof v === 'string' ? v.trim() : '';
  }
  function t(key) { return I18N[lang][key] || ''; }

  function setText(sel, val) {
    var el = $(sel);
    el.textContent = val;
    el.hidden = !val;
  }

  function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : ''; }

  /* ---------- Language ---------- */
  function detectLang() {
    var saved = '';
    try { saved = localStorage.getItem('invite-lang') || ''; } catch (e) {}
    if (saved === 'ar' || saved === 'en') return saved;
    if (C.language === 'ar' || C.language === 'en') return C.language;
    return (navigator.language || '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en';
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    var lb = $('#langBtn');
    lb.textContent = t('switchTo');
    lb.setAttribute('aria-label', t('switchLabel'));
    lb.setAttribute('lang', lang === 'ar' ? 'en' : 'ar');
    updateMusicLabel();
    render();
  }

  /* ---------- Date / time ---------- */
  function parseDate() {
    var raw = text('weddingDate');
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
    var tm = /^(\d{1,2}):(\d{2})/.exec(text('weddingTime'));
    var h = tm ? +tm[1] : 0, mi = tm ? +tm[2] : 0;
    var date = null;
    if (m) {
      var d = new Date(+m[1], +m[2] - 1, +m[3], h, mi);
      if (d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3]) date = d;
    }
    return { raw: raw, date: date, time: tm ? new Date(2000, 0, 1, h, mi) : null };
  }

  function locale() { return lang === 'ar' ? 'ar-EG-u-ca-gregory' : 'en-US'; }

  /* ---------- Countdown ---------- */
  function stopCountdown() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }

  function startCountdown(target) {
    stopCountdown();
    var box = $('#countdown');
    var nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumIntegerDigits: 2, useGrouping: false });
    var nodes = {};
    $$('.cd-num', box).forEach(function (n) { nodes[n.getAttribute('data-unit')] = n; });

    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) { box.hidden = true; stopCountdown(); return; }
      var s = Math.floor(diff / 1000);
      var vals = {
        days: Math.floor(s / 86400),
        hours: Math.floor((s % 86400) / 3600),
        minutes: Math.floor((s % 3600) / 60),
        seconds: s % 60
      };
      for (var k in vals) {
        var out = nf.format(vals[k]);
        if (nodes[k].textContent !== out) nodes[k].textContent = out;
      }
      box.hidden = false;
    }
    tick();
    if (!box.hidden) countdownTimer = setInterval(tick, 1000);
  }

  /* ---------- Rich text bits ---------- */
  function linkify(el, str) {
    el.textContent = '';
    var parts = str.split(/(https?:\/\/[^\s]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g);
    parts.forEach(function (p) {
      if (!p) return;
      if (/^https?:\/\//i.test(p)) {
        var a = document.createElement('a');
        a.href = p; a.textContent = p; a.target = '_blank'; a.rel = 'noopener noreferrer';
        el.appendChild(a);
      } else if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(p)) {
        var m = document.createElement('a');
        m.href = 'mailto:' + p; m.textContent = p;
        el.appendChild(m);
      } else {
        el.appendChild(document.createTextNode(p));
      }
    });
  }

  function scheduleItems() {
    var v = pick(C.eventSchedule);
    var out = [];
    if (typeof v === 'string') {
      v.split(/\r?\n/).forEach(function (line) {
        line = line.trim();
        if (!line) return;
        var m = /^(.*?)\s*(?:\||\s[–—-]\s)\s*(.+)$/.exec(line);
        out.push(m && m[1] ? { time: m[1], title: m[2] } : { time: '', title: line });
      });
    } else if (Array.isArray(v)) {
      v.forEach(function (it) {
        if (typeof it === 'string' && it.trim()) out.push({ time: '', title: it.trim() });
        else if (it && typeof it === 'object') {
          var title = String(pick(it.title) || '').trim();
          var time = String(pick(it.time) || '').trim();
          if (title || time) out.push({ time: time, title: title });
        }
      });
    }
    return out;
  }

  /* ---------- Render ---------- */
  function show(id, on) { $(id).hidden = !on; return on; }

  function render() {
    var groom = text('groomName'), bride = text('brideName');
    var shown = 0;

    // Document title + cover names
    var names = [groom, bride].filter(Boolean).join(' & ');
    document.title = names ? names + ' — ' + t('pageTitle') : t('pageTitle');
    setText('#coverNames', names);

    // Hero
    setText('#groom', groom);
    setText('#bride', bride);
    $('#amp').hidden = !(groom && bride);
    $('#names').hidden = !names;
    var msg = text('invitationMessage');
    setText('#invitationMessage', msg);
    var heroOn = show('#hero', !!(names || msg));

    // Date + countdown
    var info = parseDate();
    var dateStr = info.date
      ? new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(info.date)
      : info.raw;
    var timeStr = info.time
      ? new Intl.DateTimeFormat(locale(), { hour: 'numeric', minute: '2-digit' }).format(info.time)
      : text('weddingTime');
    setText('#dateText', dateStr);
    setText('#timeText', timeStr);
    var dateOn = show('#date', !!(dateStr || timeStr));
    if (info.date && info.date.getTime() > Date.now()) startCountdown(info.date);
    else { stopCountdown(); $('#countdown').hidden = true; }

    // Venue
    var vName = text('venueName'), vAddr = text('venueAddress'), map = safeUrl(text('googleMapsLink'));
    setText('#venueName', vName);
    setText('#venueAddress', vAddr);
    var dir = $('#directions');
    if (map) dir.href = map; else dir.removeAttribute('href');
    dir.hidden = !map;
    var venueOn = show('#venue', !!(vName || vAddr || map));

    // Schedule
    var items = scheduleItems();
    var list = $('#scheduleList');
    list.textContent = '';
    items.forEach(function (it) {
      var li = document.createElement('li');
      if (it.time && it.title) {
        var tt = document.createElement('span'); tt.className = 't'; tt.textContent = it.time;
        var dd = document.createElement('span'); dd.className = 'd'; dd.textContent = it.title;
        li.appendChild(tt); li.appendChild(dd);
      } else {
        li.className = 'solo';
        var one = document.createElement('span'); one.className = 'd'; one.textContent = it.title || it.time;
        li.appendChild(one);
      }
      list.appendChild(li);
    });
    var schedOn = show('#schedule', items.length > 0);

    // Personal message
    var pm = text('personalMessage');
    $('#personalMessage').textContent = pm;
    var pmOn = show('#message', !!pm);

    // RSVP
    var rsvp = text('rsvpDetails');
    linkify($('#rsvpText'), rsvp);
    var rsvpOn = show('#rsvp', !!rsvp);

    // Scroll cue only if something follows the hero
    $('#scrollCue').hidden = !(heroOn && (dateOn || venueOn || schedOn || pmOn || rsvpOn));

    // Nothing filled in yet
    shown = [heroOn, dateOn, venueOn, schedOn, pmOn, rsvpOn].filter(Boolean).length;
    show('#setup', shown === 0);
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Music ---------- */
  function updateMusicLabel() {
    var b = $('#musicBtn');
    b.classList.toggle('is-playing', playing);
    b.setAttribute('aria-pressed', String(playing));
    b.setAttribute('aria-label', playing ? t('musicOn') : t('musicOff'));
  }
  function setPlaying(v) { playing = v; updateMusicLabel(); }

  function setupMusic() {
    var file = typeof C.musicFile === 'string' ? C.musicFile.trim() : '';
    var btn = $('#musicBtn');
    if (!file) { btn.hidden = true; return; }
    audio = new Audio();
    audio.preload = 'none';           // nothing is downloaded before the visitor interacts
    audio.loop = true;
    audio.volume = 0.6;
    audio.src = file;
    audio.addEventListener('error', function () { audio = null; setPlaying(false); btn.hidden = true; });
    btn.hidden = false;
    btn.addEventListener('click', function () {
      if (!audio) return;
      if (playing) { audio.pause(); setPlaying(false); } else { startMusic(); }
    });
    document.addEventListener('visibilitychange', function () {
      if (!audio) return;
      if (document.hidden && playing) { audio.pause(); resumeOnVisible = true; }
      else if (!document.hidden && resumeOnVisible) { resumeOnVisible = false; startMusic(); }
    });
    updateMusicLabel();
  }

  function startMusic() {
    if (!audio) return;
    var p = audio.play();
    if (p && p.then) p.then(function () { setPlaying(true); }, function () { setPlaying(false); });
    else setPlaying(true);
  }

  /* ---------- Opening ---------- */
  function openInvitation() {
    var cover = $('#cover');
    var main = $('#invitation');
    if (cover.classList.contains('is-opening')) return;

    cover.classList.add('is-opening');
    startMusic();                                  // allowed: triggered by the visitor's click
    main.removeAttribute('inert');
    document.body.classList.remove('is-locked');
    window.scrollTo(0, 0);

    var delay = reducedMotion ? 50 : 700;
    setTimeout(initReveal, delay);
    setTimeout(function () {
      $('#controls').hidden = false;
      main.focus({ preventScroll: true });
    }, reducedMotion ? 50 : 1500);
    setTimeout(function () { cover.hidden = true; }, reducedMotion ? 100 : 1900);
  }

  /* ---------- Init ---------- */
  function init() {
    // Loading screen: short, and never longer than needed
    var minWait = new Promise(function (r) { setTimeout(r, 900); });
    var fonts = document.fonts && document.fonts.ready
      ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })])
      : Promise.resolve();
    Promise.all([minWait, fonts]).then(function () {
      var loader = $('#loader');
      document.body.classList.add('is-ready');
      loader.classList.add('is-done');
      setTimeout(function () { loader.remove(); }, 800);
      $('#openBtn').focus({ preventScroll: true });
    });

    lang = detectLang();
    setupMusic();
    applyLang();

    $('#openBtn').addEventListener('click', openInvitation);
    $('#langBtn').addEventListener('click', function () {
      lang = lang === 'ar' ? 'en' : 'ar';
      try { localStorage.setItem('invite-lang', lang); } catch (e) {}
      applyLang();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
