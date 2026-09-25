/* ═══════════════════════════════════════════════════════════
   SAPOTR — landing page behaviour (vanilla JS, no libraries)
    1 Helpers            7 Count-up numbers
    2 Header + nav       8 Work types rail
    3 Reveals + split    9 Swipe dots (mobile decks)
    4 Scroll FX         10 FAQ accordion
    5 Hero carousel     11 Journey + section cues
    6 Hero map          12 Tilt + spotlight + magnet
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───── 1 · Helpers ───── */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function debounce(fn, wait) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, wait); };
  }

  /** Run cb once, the first time el enters the viewport. */
  function once(el, cb, opts) {
    if (!el) return;
    if (!('IntersectionObserver' in window) || reduced) { cb(el); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cb(e.target);
        io.unobserve(e.target);
      });
    }, opts || { threshold: 0.25 });
    io.observe(el);
  }

  /* rAF-coalesced scroll subscribers — one listener for the whole page. */
  var onScroll = (function () {
    var subs = [], queued = false;
    function run() { queued = false; var y = window.scrollY; subs.forEach(function (f) { f(y); }); }
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    }, { passive: true });
    window.addEventListener('resize', run);
    return function (f) { subs.push(f); f(window.scrollY); };
  })();

  /* ───── 2 · Header + mobile nav ───── */
  var header = $('.site-header');
  var heroEl = $('#hero');
  var burger = $('#burger');
  var mnav = $('#mobile-nav');

  function syncHeader(y) {
    var overHero = heroEl && (y === undefined ? window.scrollY : y) < heroEl.offsetHeight - 90;
    header.dataset.mode = (overHero && mnav.hidden) ? 'over' : 'solid';
  }
  onScroll(syncHeader);

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mnav.hidden = !open;
    syncHeader();
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
    if (!mnav.hidden) { var first = $('a', mnav); if (first) first.focus(); }
  });
  mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); burger.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (!mnav.hidden && !header.contains(e.target)) setMenu(false);
  });
  window.addEventListener('resize', debounce(function () {
    if (!mnav.hidden && window.innerWidth > 900) setMenu(false);
  }, 150));

  /* the nav link for the section in view stays lit */
  (function scrollSpy() {
    var links = $$('.nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = map[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        } else if (a.getAttribute('aria-current')) {
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  })();

  /* ───── 3 · Reveals + headline word split ───── */
  /* Wrap each word so it can rise out of its own overflow box. */
  function splitInto(host, text) {
    text.split(/(\s+)/).forEach(function (chunk) {
      if (!chunk) return;
      if (/^\s+$/.test(chunk)) { host.appendChild(document.createTextNode(' ')); return; }
      var w = document.createElement('span');
      w.className = 'w';
      var i = document.createElement('i');
      i.textContent = chunk;
      w.appendChild(i);
      host.appendChild(w);
    });
  }
  $$('[data-split]').forEach(function (el) {
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) splitInto(frag, node.textContent);           /* plain text → split */
      else if (node.nodeType === 1) {                                        /* element → keep, split inside */
        var host = node.cloneNode(false);
        splitInto(host, node.textContent);
        frag.appendChild(host);
      }
    });
    el.textContent = '';
    el.appendChild(frag);
    el.setAttribute('aria-label', label);   /* read as one phrase, not word by word */
    $$('.w i', el).forEach(function (i, n) { i.style.transitionDelay = (n * 55) + 'ms'; });
  });

  (function reveals() {
    var items = $$('[data-r], [data-split]');
    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.filter(function (e) { return e.isIntersecting; })
        .forEach(function (e, i) {
          if (e.target.hasAttribute('data-r')) {
            e.target.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
            /* the delay is for the entrance only — hover must stay instant */
            setTimeout(function () { e.target.style.transitionDelay = ''; }, 1200);
          }
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ───── 4 · Scroll FX: progress bar, parallax, cursor glow ───── */
  (function scrollFx() {
    var bar = $('#scroll-bar span');
    onScroll(function (y) {
      if (!bar) return;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    });

    var glow = $('#cursor-glow');
    if (glow && fine && !reduced) {
      var gx = 0, gy = 0, cx = 0, cy = 0, on = false, running = false;
      var loop = function () {
        cx += (gx - cx) * 0.08;
        cy += (gy - cy) * 0.08;
        glow.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) translate(-50%,-50%)';
        /* settle, then stop asking for frames */
        if (Math.abs(gx - cx) + Math.abs(gy - cy) > 0.5) requestAnimationFrame(loop); else running = false;
      };
      window.addEventListener('pointermove', function (e) {
        gx = e.clientX; gy = e.clientY;
        if (!on) { on = true; glow.style.opacity = '1'; }
        if (!running) { running = true; requestAnimationFrame(loop); }
      }, { passive: true });
    }
  })();

  /* ───── 5 · Hero carousel ─────
     Two numbers describe everything on screen — `index` (the banner
     showing) and `leaving` (the one fading out, or -1) — and paint()
     derives every class from them, so nothing can accumulate.
     Navigation during a cross-fade is coalesced into one pending
     request. There are no visible controls: banners move by
     themselves and by swipe, drag, trackpad or arrow keys. Every
     reason to wait (focus, drag, hovering a button, off screen,
     hidden tab) is tracked separately, and the dwell resumes from
     where it stopped. */
  var hero = (function () {
    var stage = $('#hero-stage');
    var wrap = $('#hero-slides');
    if (!stage || !wrap) return null;

    var slides = $$('.hs', wrap);
    var DWELL = [7600, 6200, 7400, 6600, 6200];  /* the storytelling banners hold a touch longer */
    var MANUAL_DWELL = 11000;                     /* after a manual move, give the reader time */
    var XFADE = 950;                              /* keep in step with .hs transitions */
    var SWIPE_MIN = 40;     /* px of sideways travel that counts as a swipe */
    var SWIPE_LOCK = 8;     /* px before deciding whether it is a swipe or a scroll */
    var FLICK = 0.35;       /* px/ms: a quick short flick also counts */

    var index = 0, leaving = -1, busy = false, queued = null;
    var timer = null, fadeTimer = null, startedAt = 0, remaining = DWELL[0];
    var holds = { focus: false, drag: false, hover: false, off: false, hidden: false };
    var listeners = [];

    slides.forEach(function (s) { s.removeAttribute('hidden'); });

    function paused() { for (var k in holds) { if (holds[k]) return true; } return false; }

    function paint() {
      slides.forEach(function (s, i) {
        var on = i === index;
        s.classList.toggle('is-active', on);
        s.classList.toggle('is-out', i === leaving);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        if ('inert' in s) s.inert = !on;           /* nothing focusable in a banner you cannot see */
      });
      var tone = slides[index].dataset.tone || 'dark';
      heroEl.dataset.tone = tone;
      header.dataset.tone = tone;
      listeners.forEach(function (f) { f(index, slides[index]); });
    }

    function syncClasses() {
      heroEl.classList.toggle('is-auto', !reduced);
      heroEl.classList.toggle('is-paused', paused() || busy);
    }

    function schedule() {
      clearTimeout(timer); timer = null;
      syncClasses();
      if (reduced || busy || paused()) return;
      startedAt = Date.now();
      timer = setTimeout(function () { go(index + 1, false); }, remaining);
    }
    /* stop the clock but remember how much of the dwell is left */
    function freeze() {
      if (timer) {
        clearTimeout(timer); timer = null;
        remaining = Math.max(700, remaining - (Date.now() - startedAt));
      }
      syncClasses();
    }
    function hold(reason, on) {
      if (holds[reason] === on) return;
      holds[reason] = on;
      if (paused()) freeze(); else schedule();
    }

    function endFade() {
      busy = false;
      leaving = -1;
      paint();
      if (queued !== null) {
        var q = queued; queued = null;
        if (q !== index) { go(q, true); return; }
      }
      schedule();
    }

    /* the one way the carousel ever moves */
    function go(i, manual) {
      var n = slides.length;
      var target = ((i % n) + n) % n;
      if (busy) { queued = target; return; }
      if (target === index) return;
      leaving = index;
      index = target;
      busy = true;
      clearTimeout(timer); timer = null;
      remaining = manual ? MANUAL_DWELL : DWELL[index];
      heroEl.style.setProperty('--dwell', remaining + 'ms');
      paint();
      syncClasses();
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(endFade, reduced ? 20 : XFADE);
    }

    /* keyboard focus inside the banner holds it, so nobody is moved on mid-sentence */
    stage.addEventListener('focusin', function (e) { if (e.target.matches(':focus-visible')) hold('focus', true); });
    stage.addEventListener('focusout', function () { hold('focus', false); });
    /* the small arrows: one banner per click; a manual move resets the clock */
    var prevBtn = $('#hero-prev'), nextBtn = $('#hero-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { go(index - 1, true); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(index + 1, true); });

    /* hovering a button or an arrow means a click is coming */
    if (fine) {
      $$('.hs-cta, .hero-arrows-in', stage).forEach(function (el) {
        el.addEventListener('mouseenter', function () { hold('hover', true); });
        el.addEventListener('mouseleave', function () { hold('hover', false); });
      });
    }
    document.addEventListener('visibilitychange', function () { hold('hidden', document.visibilityState === 'hidden'); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { hold('off', !e.isIntersecting); });
      }, { threshold: 0.2 }).observe(stage);
    }

    stage.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft') go(index - 1, true);
      else if (k === 'ArrowRight') go(index + 1, true);
      else if (k === 'Home') go(0, true);
      else if (k === 'End') go(slides.length - 1, true);
      else return;
      e.preventDefault();
    });

    /* ---- gestures ----
       One code path for touch, pen and mouse. The first few pixels decide
       the gesture: mostly sideways means a banner swipe, mostly vertical
       means it belongs to the page and we let go at once, so scrolling
       over the hero is never blocked (touch-action: pan-y does the rest).
       A swipe is accepted at any moment, even mid cross-fade (go() queues
       it), and it resets the autoplay clock. */
    (function gestures() {
      var down = false, decided = false, mine = false, moved = false;
      var x0 = 0, y0 = 0, dx = 0, t0 = 0, pid = null;

      function begin(x, y, id) {
        down = true; decided = false; mine = false; moved = false;
        x0 = x; y0 = y; dx = 0; t0 = Date.now(); pid = id;
      }
      /* true once the gesture is ours, so the caller may stop the page scrolling */
      function track(x, y) {
        if (!down) return false;
        dx = x - x0;
        var dy = y - y0;
        if (!decided) {
          if (Math.abs(dx) < SWIPE_LOCK && Math.abs(dy) < SWIPE_LOCK) return false;
          decided = true;
          mine = Math.abs(dx) > Math.abs(dy);
          if (!mine) { down = false; return false; }      /* a vertical scroll: hands off */
          stage.classList.add('is-dragging');
          hold('drag', true);
        }
        moved = true;
        slides[index].style.setProperty('--hdx', (dx * 0.34).toFixed(1) + 'px');
        return true;
      }
      function finish(x) {
        if (!down) return;
        down = false;
        if (typeof x === 'number') dx = x - x0;
        slides[index].style.removeProperty('--hdx');
        stage.classList.remove('is-dragging');
        if (!mine) return;
        mine = false;
        hold('drag', false);
        var speed = Math.abs(dx) / Math.max(1, Date.now() - t0);
        if (Math.abs(dx) > SWIPE_MIN || (Math.abs(dx) > 20 && speed > FLICK)) {
          go(index + (dx < 0 ? 1 : -1), true);           /* left: next, right: previous */
        }
      }

      if (window.PointerEvent) {
        stage.addEventListener('pointerdown', function (e) {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          if (e.target.closest('.c-arrow')) return;          /* an arrow is a click, never a drag */
          begin(e.clientX, e.clientY, e.pointerId);
        });
        stage.addEventListener('pointermove', function (e) {
          if (e.pointerId !== pid) return;
          var was = mine;
          if (track(e.clientX, e.clientY) && !was && e.pointerType === 'mouse') {
            try { stage.setPointerCapture(pid); } catch (err) { /* fine without */ }
          }
        });
        stage.addEventListener('pointerup', function (e) { if (e.pointerId === pid) finish(e.clientX); });
        stage.addEventListener('pointercancel', function (e) { if (e.pointerId === pid) finish(); });
      } else {
        /* older mobile browsers without Pointer Events */
        stage.addEventListener('touchstart', function (e) {
          var t = e.changedTouches[0]; begin(t.clientX, t.clientY, t.identifier);
        }, { passive: true });
        stage.addEventListener('touchmove', function (e) {
          var t = e.changedTouches[0];
          if (track(t.clientX, t.clientY) && e.cancelable) e.preventDefault();
        }, { passive: false });
        stage.addEventListener('touchend', function (e) { finish(e.changedTouches[0].clientX); });
        stage.addEventListener('touchcancel', function () { finish(); });
      }
      /* a drag must not also count as a click on whatever it started over */
      stage.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
      stage.addEventListener('dragstart', function (e) { e.preventDefault(); });

      /* a sideways two-finger swipe on a trackpad moves one banner */
      var acc = 0, lock = 0;
      stage.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        if (Date.now() < lock) return;
        acc += e.deltaX;
        if (Math.abs(acc) > 60) {
          go(index + (acc > 0 ? 1 : -1), true);
          acc = 0;
          lock = Date.now() + 900;
        }
      }, { passive: false });
    })();

    /* boot: banner 1 arrives like any other, then the clock starts */
    heroEl.style.setProperty('--dwell', remaining + 'ms');
    busy = true;
    paint();
    syncClasses();
    fadeTimer = setTimeout(endFade, reduced ? 20 : XFADE);

    return {
      go: go,
      onChange: function (f) { listeners.push(f); },
      current: function () { return index; },
      slides: slides,
      state: function () { return { armed: !!timer, index: index, busy: busy, queued: queued, holds: JSON.parse(JSON.stringify(holds)), remaining: remaining }; }
    };
  })();
  window.SAPOTR = { hero: hero };

  /* ───── 6 · Hero map — pins, the network, and cards pinned to real suburbs ─────
     Coordinates are in the SVG's own units, so they stay on their suburb
     whatever the viewBox. Cards are placed around their pin, clamped to
     the part of the banner the copy does not use, and skipped rather
     than squeezed when there is no room. */
  (function heroMap() {
    var box = $('#hmap');
    var svg = $('#hmap-svg');
    if (!box || !svg) return;
    var slide = box.closest('.hs');
    var pinsBox = $('#hmap-pins');
    var cardsBox = $('#hmap-cards');
    var hub = $('#hmap-hub');
    var net = $('#hmap-net');
    var HUB = { x: 452, y: 560 };

    var PINS = {
      orewa:      { x: 250, y: -10, c: 'r' },
      albany:     { x: 305, y: 185, c: 'y' },
      takapuna:   { x: 790, y: 244, c: 'c' },
      devonport:  { x: 628, y: 272, c: 'r' },
      westharb:   { x: 90,  y: 420, c: 'y' },
      henderson:  { x: 120, y: 516, c: 'c' },
      newlynn:    { x: 190, y: 624, c: 'y' },
      newmarket:  { x: 610, y: 612, c: 'r' },
      missionbay: { x: 850, y: 576, c: 'y' },
      stheliers:  { x: 1010, y: 604, c: 'c' },
      onehunga:   { x: 390, y: 716, c: 'c' },
      mtwell:     { x: 700, y: 724, c: 'y' },
      howick:     { x: 940, y: 724, c: 'c' },
      botany:     { x: 960, y: 826, c: 'r' },
      papatoetoe: { x: 520, y: 808, c: 'y' },
      manukau:    { x: 700, y: 862, c: 'r' },
      takanini:   { x: 760, y: 950, c: 'c' },
      papakura:   { x: 660, y: 1030, c: 'y' },
      waiheke:    { x: 1400, y: 440, c: 'c' }
    };
    var COLOURS = { y: '#FFC107', c: '#12C7C7', r: '#FF4B2B' };
    var SUBURB = {
      orewa: 'Orewa', albany: 'Albany', takapuna: 'Takapuna', devonport: 'Devonport', westharb: 'West Harbour',
      henderson: 'Henderson', newlynn: 'New Lynn', newmarket: 'Newmarket', missionbay: 'Mission Bay', stheliers: 'St Heliers',
      onehunga: 'Onehunga', mtwell: 'Mt Wellington', howick: 'Howick', botany: 'Botany', papatoetoe: 'Papatoetoe',
      manukau: 'Manukau', takanini: 'Takanini', papakura: 'Papakura', waiheke: 'Waiheke'
    };

    /* category + job type are the client's own lists */
    var CARDS = [
      { pin: 'takapuna',   cat: 'Hospitality',              job: 'Kitchen Hand',          ic: 'c-hosp',      t: 'cyan' },
      { pin: 'manukau',    cat: 'Warehousing & Logistics',  job: 'Picker / Packer',       ic: 'c-warehouse', t: 'red' },
      { pin: 'newmarket',  cat: 'Retail & Shopping',        job: 'Retail Assistant',      ic: 'c-retail',    t: 'yellow' },
      { pin: 'howick',     cat: 'Events & Entertainment',   job: 'Event Setup Assistant', ic: 'c-events',    t: 'cyan' },
      { pin: 'albany',     cat: 'Cleaning & Facilities',    job: 'Cleaner',               ic: 'c-cleaning',  t: 'yellow' },
      { pin: 'onehunga',   cat: 'Moving & Setup',           job: 'Moving Assistant',      ic: 'c-moving',    t: 'red' },
      { pin: 'missionbay', cat: 'Delivery & Driving',       job: 'Delivery Assistant',    ic: 'c-delivery',  t: 'cyan' },
      { pin: 'henderson',  cat: 'Education & Institutions', job: 'Grounds Support',       ic: 'c-education', t: 'yellow' },
      { pin: 'takanini',   cat: 'General Business Support', job: 'General Assistant',     ic: 'c-general',   t: 'red' }
    ];

    /* the map is re-framed per shape of screen, not simply zoomed */
    var VIEWS = { side: '-760 -80 2100 1180', tall: '-40 -60 1000 1240', phone: '120 -40 660 1200' };
    var sideMq = window.matchMedia('(min-width: 901px) and (min-aspect-ratio: 1/1)');

    var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

    /* pins + the network */
    var pinEls = {};
    var NS = 'http://www.w3.org/2000/svg';
    Object.keys(PINS).forEach(function (id, i) {
      var p = PINS[id];
      var el = document.createElement('i');
      el.className = 'hpin';
      el.style.setProperty('--pin', COLOURS[p.c]);
      el.style.setProperty('--i', i);
      el.innerHTML = '<i></i>';
      pinsBox.appendChild(el);
      pinEls[id] = el;

      /* a gentle bow from the city out to each pin */
      var mx = (HUB.x + p.x) / 2, my = (HUB.y + p.y) / 2;
      var nx = -(p.y - HUB.y), ny = p.x - HUB.x;
      var len = Math.sqrt(nx * nx + ny * ny) || 1;
      var bow = 0.14 * Math.sqrt(Math.pow(p.x - HUB.x, 2) + Math.pow(p.y - HUB.y, 2));
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', 'M' + HUB.x + ' ' + HUB.y + 'Q' + (mx + nx / len * bow).toFixed(1) + ' ' + (my + ny / len * bow).toFixed(1) + ' ' + p.x + ' ' + p.y);
      net.appendChild(path);
    });

    var cardEls = CARDS.map(function (c, i) {
      var el = document.createElement('div');
      el.className = 'mcard';
      el.style.setProperty('--i', i);
      el.innerHTML =
        '<div><span class="ocard-ic ic-' + c.t + '"><svg class="ic"><use href="#' + c.ic + '"/></svg></span>' +
        '<span class="ocard-t"><small>' + esc(c.cat) + '</small><b>' + esc(c.job) + '</b></span>' +
        '<span class="mcard-loc"><span><svg class="ic"><use href="#i-pin"/></svg>' + esc(SUBURB[c.pin]) + '</span><b class="mcard-go">Accept</b></span></div>';
      cardsBox.appendChild(el);
      return el;
    });

    function relRect(el) {
      var r = el.getBoundingClientRect(), s = slide.getBoundingClientRect();
      return { l: r.left - s.left - box.offsetLeft, t: r.top - s.top - box.offsetTop, r: r.right - s.left - box.offsetLeft, b: r.bottom - s.top - box.offsetTop };
    }

    function layout() {
      var side = sideMq.matches;
      var W = box.offsetWidth, H = box.offsetHeight;
      if (!W || !H) return;
      var mode = side ? 'side' : (W / H < 0.62 ? 'phone' : 'tall');
      svg.setAttribute('viewBox', VIEWS[mode]);
      var vb = VIEWS[mode].split(' ').map(Number);
      var s = Math.max(W / vb[2], H / vb[3]);
      var ox = (W - vb[2] * s) / 2, oy = (H - vb[3] * s) / 2;
      var P = function (x, y) { return [ox + (x - vb[0]) * s, oy + (y - vb[1]) * s]; };

      var h = P(HUB.x, HUB.y);
      hub.style.transform = 'translate(' + h[0].toFixed(1) + 'px,' + h[1].toFixed(1) + 'px)';
      Object.keys(PINS).forEach(function (id) {
        var q = P(PINS[id].x, PINS[id].y);
        pinEls[id].style.translate = q[0].toFixed(1) + 'px ' + q[1].toFixed(1) + 'px';   /* translate, so the pop-in transform cannot move it */
        pinEls[id].classList.remove('has-card');
      });

      /* where cards may go: never over the copy, the button or the controls */
      var copy = relRect($('.hs-copy', slide));
      var cta = relRect($('.hs-cta .btn', slide));
      var headH = header.offsetHeight + 24;
      var uiH = 64;   /* the small arrow row at the foot of the banner */
      var pad = 24;   /* .hmap bleeds 24px past the slide on every side */
      var safe = side
        ? { l: Math.max(copy.r, cta.r) + 32, t: headH + pad, r: W - pad - 20, b: H - pad - uiH - 8 }
        : { l: pad + 8, t: copy.b + 14, r: W - pad - 8, b: cta.t - 14 };
      var max = side ? 5 : (mode === 'tall' ? 4 : 3);
      var placed = [];

      /* a pin must never sit on the headline, the button, the header or the controls */
      var keepOut = [copy, cta, { l: 0, t: 0, r: W, b: headH + pad - 10 }, { l: 0, t: H - pad - uiH, r: W, b: H }];
      Object.keys(PINS).forEach(function (id) {
        var q = P(PINS[id].x, PINS[id].y);
        var under = keepOut.some(function (k) { return q[0] > k.l - 14 && q[0] < k.r + 14 && q[1] > k.t - 14 && q[1] < k.b + 14; });
        pinEls[id].classList.toggle('is-under', under);
      });

      cardEls.forEach(function (el) { el.hidden = false; el.style.visibility = 'hidden'; });
      cardEls.forEach(function (el, i) {
        var c = CARDS[i];
        if (placed.length >= max) { el.hidden = true; return; }
        var q = P(PINS[c.pin].x, PINS[c.pin].y);
        var cw = el.offsetWidth, ch = el.offsetHeight;
        var tries = [
          ['tr', q[0] - 20, q[1] - ch - 16], ['tl', q[0] - cw + 20, q[1] - ch - 16],
          ['br', q[0] - 20, q[1] + 16],      ['bl', q[0] - cw + 20, q[1] + 16]
        ];
        var spot = null;
        for (var k = 0; k < tries.length && !spot; k++) {
          var x = tries[k][1], y = tries[k][2];
          if (x < safe.l || y < safe.t || x + cw > safe.r || y + ch > safe.b) continue;
          var clash = placed.some(function (p) {
            return x < p.r + 12 && x + cw > p.l - 12 && y < p.b + 12 && y + ch > p.t - 12;
          });
          if (!clash) spot = tries[k];
        }
        if (!spot) { el.hidden = true; return; }
        placed.push({ l: spot[1], t: spot[2], r: spot[1] + cw, b: spot[2] + ch });
        el.dataset.a = spot[0];
        el.style.transform = 'translate(' + spot[1].toFixed(1) + 'px,' + spot[2].toFixed(1) + 'px)';
        el.style.visibility = '';
        pinEls[c.pin].classList.add('has-card');
      });
    }

    /* measure only while the banner is on screen and settled */
    function relayout() { if (slide.classList.contains('is-active') && !slide.classList.contains('is-out')) layout(); }
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    window.addEventListener('resize', debounce(relayout, 140));
    if (sideMq.addEventListener) sideMq.addEventListener('change', relayout);
    if (hero) hero.onChange(function (i, s) { if (s === slide) requestAnimationFrame(layout); });

    /* depth: the map, the SAPOTR in banner 2 drift a little with the pointer */
    if (fine && !reduced) {
      var layers = [[box, 14], [$('.b2-art'), 10]];
      var stage = $('#hero-stage');
      stage.addEventListener('pointermove', function (e) {
        if (stage.classList.contains('is-dragging')) return;
        var r = stage.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach(function (l) {
          if (l[0]) l[0].style.translate = (-px * l[1]).toFixed(1) + 'px ' + (-py * l[1] * 0.7).toFixed(1) + 'px';
        });
      });
      stage.addEventListener('pointerleave', function () {
        layers.forEach(function (l) { if (l[0]) l[0].style.translate = ''; });
      });
    }
  })();

  /* ───── 7 · Count-up numbers ───── */
  $$('[data-count]').forEach(function (el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var comma = el.dataset.format === 'comma';
    var fmt = function (n) { return comma ? n.toLocaleString('en-NZ') : String(n); };
    if (reduced || !('IntersectionObserver' in window)) { el.textContent = fmt(target); return; }
    el.textContent = fmt(0);
    once(el, function () {
      var start = null;
      (function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / 1800, 1);
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(frame);
      })(performance.now());
    }, { threshold: 0.6 });
  });

  /* ───── 8 · Work types rail ─────
     One engine for every screen: three cards on a desktop, two on a
     tablet, one wide card with a peek on a phone (all set in CSS —
     the script only measures). The track moves by transform, one card
     at a time; at the end it rewinds to the start, so no clones.
     A single interval runs for the life of the page and simply skips
     its turn while the rail is held (hover, a drag, a recent gesture),
     off screen or in a hidden tab — nothing else creates a timer. */
  (function workRail() {
    var vp = $('#wc-viewport');
    var track = $('#wc-grid');
    var dotsBox = $('#wc-dots');
    if (!vp || !track) return;
    var cards = $$('.wc', track);
    var INTERVAL = 4200;   /* the pace, as on the Demo 1 industry rail */
    var HOLD = 5000;       /* how long a touched rail is left alone */

    var at = 0, last = 0, step = 0, maxOff = 0, holdUntil = 0;
    var hovering = false, onScreen = false, dragging = false;
    var dots = [];

    function offsetFor(i) { return Math.min(i * step, maxOff); }
    function place(px, animate) {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = 'translate3d(' + (-px).toFixed(1) + 'px,0,0)';
    }
    function paintDots() {
      dots.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === at)); });
    }
    function go(i, animate) {
      at = Math.max(0, Math.min(last, i));
      place(offsetFor(at), animate !== false);
      paintDots();
    }
    function hold() { holdUntil = Date.now() + HOLD; }

    function measure() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var cs = getComputedStyle(vp);
      var inner = vp.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      step = cards[0].getBoundingClientRect().width + gap;
      maxOff = Math.max(0, cards.length * step - gap - inner);
      last = step ? Math.ceil(maxOff / step - 0.01) : 0;
      /* one dot per resting position */
      if (dotsBox && dots.length !== last + 1) {
        dotsBox.innerHTML = '';
        dots = [];
        for (var i = 0; i <= last; i++) {
          var b = document.createElement('button');
          b.type = 'button';
          b.tabIndex = -1;
          b.setAttribute('aria-label', 'Go to ' + (i + 1) + ' of ' + (last + 1));
          b.addEventListener('click', (function (n) { return function () { hold(); go(n); }; })(i));
          dotsBox.appendChild(b);
          dots.push(b);
        }
      }
      go(at, false);
    }

    /* ---- drag / swipe: sideways moves the rail, vertical scrolls the page ---- */
    var down = false, decided = false, mine = false, moved = false, x0 = 0, y0 = 0, dx = 0, t0 = 0, pid = null;
    vp.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true; decided = false; mine = false; moved = false;
      x0 = e.clientX; y0 = e.clientY; dx = 0; t0 = Date.now(); pid = e.pointerId;
    });
    vp.addEventListener('pointermove', function (e) {
      if (!down || e.pointerId !== pid) return;
      dx = e.clientX - x0;
      var dy = e.clientY - y0;
      if (!decided) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        decided = true;
        mine = Math.abs(dx) > Math.abs(dy);
        if (!mine) { down = false; return; }
        dragging = true;
        vp.classList.add('is-dragging');
        if (e.pointerType === 'mouse') { try { vp.setPointerCapture(pid); } catch (err) { /* fine without */ } }
      }
      moved = true;
      /* resist past either end, so the edges feel like edges */
      var off = offsetFor(at) - dx;
      if (off < 0) off *= 0.3;
      else if (off > maxOff) off = maxOff + (off - maxOff) * 0.3;
      place(off, false);
    });
    function release(e) {
      if (!down || (e && e.pointerId !== pid)) return;
      down = false;
      if (!mine) return;
      mine = false; dragging = false;
      vp.classList.remove('is-dragging');
      hold();
      var speed = Math.abs(dx) / Math.max(1, Date.now() - t0);
      var n = Math.round(Math.abs(dx) / step);
      if (!n && (Math.abs(dx) > 40 || (Math.abs(dx) > 20 && speed > 0.35))) n = 1;
      go(at + (dx < 0 ? n : -n));
    }
    vp.addEventListener('pointerup', release);
    vp.addEventListener('pointercancel', release);
    vp.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    vp.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* a sideways two-finger swipe on a trackpad moves one card */
    var acc = 0, lock = 0;
    vp.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      hold();
      if (Date.now() < lock) return;
      acc += e.deltaX;
      if (Math.abs(acc) > 50) { go(at + (acc > 0 ? 1 : -1)); acc = 0; lock = Date.now() + 600; }
    }, { passive: false });

    if (fine) {
      vp.addEventListener('mouseenter', function () { hovering = true; });
      vp.addEventListener('mouseleave', function () { hovering = false; hold(); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; }, { threshold: 0.35 }).observe(vp);
    } else { onScreen = true; }

    /* the small arrows: exactly one card per click; past either end they wrap,
       the same way the autoplay rewinds */
    var railPrev = $('#wc-prev'), railNext = $('#wc-next');
    if (railPrev) railPrev.addEventListener('click', function () { hold(); go(at <= 0 ? last : at - 1); });
    if (railNext) railNext.addEventListener('click', function () { hold(); go(at >= last ? 0 : at + 1); });

    /* the one clock: move a card, or rewind from the end */
    if (!reduced) {
      setInterval(function () {
        if (!onScreen || hovering || dragging || document.hidden || Date.now() < holdUntil) return;
        go(at >= last ? 0 : at + 1);
      }, INTERVAL);
    }

    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('resize', debounce(measure, 150));
    window.SAPOTR.workRail = { go: go, at: function () { return at; }, last: function () { return last; } };
  })();

  /* ───── 9 · Swipe dots for the mobile safety deck ───── */
  (function swipeDots() {
    [['#safe-grid', '#safe-dots', '.safe']].forEach(function (set) {
      var box = $(set[0]), holder = $(set[1]);
      if (!box || !holder) return;
      var items = $$(set[2], box);
      if (items.length < 2) return;

      items.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.tabIndex = -1;
        b.setAttribute('aria-label', 'Go to ' + (i + 1) + ' of ' + items.length);
        b.addEventListener('click', function () {
          box.scrollTo({ left: items[i].offsetLeft - box.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' });
        });
        holder.appendChild(b);
      });
      var dots = $$('button', holder);

      function sync() {
        /* whichever card sits nearest the middle of the viewport is "current" */
        var mid = box.scrollLeft + box.clientWidth / 2, best = 0, dist = Infinity;
        items.forEach(function (el, i) {
          var c = el.offsetLeft - box.offsetLeft + el.offsetWidth / 2;
          var d = Math.abs(c - mid);
          if (d < dist) { dist = d; best = i; }
        });
        dots.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === best)); });
      }
      var queued = false;
      box.addEventListener('scroll', function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; sync(); });
      }, { passive: true });
      sync();
    });
  })();

  /* ───── 10 · FAQ accordion — one answer open across both columns ───── */
  $$('#acc .acc-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wasOpen = btn.getAttribute('aria-expanded') === 'true';
      $$('#acc .acc-q').forEach(function (o) {
        o.setAttribute('aria-expanded', 'false');
        o.closest('.acc-i').classList.remove('is-open');
      });
      if (!wasOpen) {
        btn.setAttribute('aria-expanded', 'true');
        btn.closest('.acc-i').classList.add('is-open');
      }
    });
  });

  /* ───── 11 · Journey + section cues ───── */
  once($('#journey'), function (el) { el.classList.add('in'); }, { threshold: 0.3 });
  $$('#journey .step').forEach(function (s) { once(s, function (el) { el.classList.add('in'); }, { threshold: 0.35 }); });
  once($('#why'), function (el) { el.classList.add('in-view'); }, { threshold: 0.2 });

  /* ───── 12 · Tilt + spotlight + magnet micro-interactions ───── */
  if (fine && !reduced) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ty', (px * 6).toFixed(2) + 'deg');
        el.style.setProperty('--tx', (-py * 6).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--ty', '0deg');
        el.style.setProperty('--tx', '0deg');
      });
    });

    /* tiles light up under the pointer */
    $$('[data-spot]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    /* buttons drift a few pixels toward the cursor */
    $$('.magnet').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1) + 'px,' +
                                            ((e.clientY - r.top - r.height / 2) * 0.18).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ───── Ticker: duplicate the row so the marquee loops seamlessly ───── */
  (function ticker() {
    var inner = $('#ticker-inner');
    if (!inner || reduced) return;
    var copy = inner.firstElementChild.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    inner.appendChild(copy);
    /* the bento's category strip loops the same way */
    var row = $('.viz-cats-row');
    if (row) row.innerHTML += row.innerHTML;
  })();

  /* ───── Back to top ─────
     Both the header logo and the footer link point at #top. One delegated
     listener scrolls there smoothly and leaves the URL alone. Links marked
     data-placeholder (store badges, social icons awaiting their live URLs)
     simply do nothing instead of jumping to the top of the page. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#top"], a[data-placeholder]');
    if (!a) return;
    e.preventDefault();
    if (a.hasAttribute('data-placeholder')) return;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  });

  /* ───── Misc ───── */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
