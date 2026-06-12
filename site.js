/* Bani Venture — Apple-style scroll motion */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Floating WhatsApp + back-to-top ---- */
  var wa = document.createElement('a');
  wa.href = 'http://www.wasap.my/60139214322';
  wa.className = 'wa-float';
  wa.setAttribute('aria-label', 'WhatsApp Bani Venture');
  wa.innerHTML = '💬';
  document.body.appendChild(wa);

  var topBtn = document.createElement('button');
  topBtn.className = 'to-top';
  topBtn.type = 'button';
  topBtn.setAttribute('aria-label', 'Kembali ke atas');
  topBtn.innerHTML = '↑';
  document.body.appendChild(topBtn);
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  window.addEventListener('scroll', function () {
    topBtn.classList.toggle('show', window.scrollY > 480);
  }, { passive: true });

  /* ---- If reduced motion: skip all animation ---- */
  if (reduce) {
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.reveal-child,.word').forEach(function (el) {
      el.classList.add('in');
    });
    initEstimator();
    return;
  }

  /* ================================================================
     WORD SPLIT — Apple-style per-word blur-reveal on h1 and h2
     ================================================================ */
  function splitWords(el) {
    if (!el || el.dataset.split) return;
    el.dataset.split = '1';
    var html = el.innerHTML;
    /* preserve img tags intact */
    var parts = [];
    var regex = /(<(?:img|br)[^>]*\/?>)|([^<]+)/g;
    var match;
    while ((match = regex.exec(html)) !== null) {
      if (match[1]) {
        parts.push(match[1]); // img tag — keep as-is
      } else {
        var words = match[2].split(/(\s+)/);
        words.forEach(function (w) {
          if (/^\s+$/.test(w)) {
            parts.push(w);
          } else if (w) {
            parts.push('<span class="word">' + w + '</span>');
          }
        });
      }
    }
    el.innerHTML = parts.join('');
  }

  function activateWords(el, baseDelay) {
    var words = el.querySelectorAll('.word');
    words.forEach(function (w, i) {
      w.style.setProperty('--wi', i + (baseDelay || 0));
      w.classList.add('in');
    });
  }

  /* Split all hero h1 words on load */
  var heroH1 = document.querySelector('.hero-photo h1');
  if (heroH1) {
    splitWords(heroH1);
    setTimeout(function () { activateWords(heroH1, 0); }, 300);
  }

  /* Page-hero (inner pages) — animate in on load */
  var pageHero = document.querySelector('.page-hero');
  if (pageHero) {
    var piEls = pageHero.querySelectorAll('.crumb, .eyebrow, h1, p');
    piEls.forEach(function (el, i) { el.style.setProperty('--pi', i); });
    setTimeout(function () { pageHero.classList.add('in'); }, 120);
  }

  /* Split all section h2s */
  document.querySelectorAll('section h2').forEach(function (h2) {
    splitWords(h2);
  });

  /* ================================================================
     INTERSECTION OBSERVER — section + child reveals
     ================================================================ */
  var SECTION_SEL = '.reveal, .reveal-left, .reveal-right, .reveal-scale';

  var sectionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;

      /* Animate the section / element itself */
      el.classList.add('in');

      /* Activate word splits inside */
      var h2 = el.querySelector('h2[data-split]');
      if (h2) activateWords(h2, 0);

      /* Stagger reveal-child elements */
      el.querySelectorAll('.reveal-child').forEach(function (child, i) {
        child.style.setProperty('--i', i);
        setTimeout(function () { child.classList.add('in'); }, 60);
      });

      /* Nested reveal-left / reveal-scale */
      el.querySelectorAll('.reveal-left, .reveal-right, .reveal-scale').forEach(function (nested) {
        setTimeout(function () { nested.classList.add('in'); }, 80);
      });

      sectionIO.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

  document.querySelectorAll(SECTION_SEL).forEach(function (el) {
    sectionIO.observe(el);
  });

  /* Observe standalone reveal-child elements not inside a .reveal parent */
  var childIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('in');
      childIO.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-child').forEach(function (el) {
    /* Only observe if NOT already inside a .reveal section */
    if (!el.closest('.reveal, .reveal-left, .reveal-scale')) {
      childIO.observe(el);
    }
  });

  /* ================================================================
     SCROLL-SCRUBBED HERO CONTENT — text fades as you scroll away
     ================================================================ */
  var heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    window.addEventListener('scroll', function () {
      var heroHeight = document.querySelector('.hero-photo').offsetHeight;
      var progress = Math.min(window.scrollY / (heroHeight * 0.55), 1);
      var opacity = 1 - progress * 1.4;
      var translateY = progress * -40;
      heroContent.style.opacity = Math.max(opacity, 0);
      heroContent.style.transform = 'translateY(' + translateY + 'px)';
    }, { passive: true });
  }

  /* ================================================================
     SECTION ENTRANCE SCALE — each section slightly scales up as
     it enters (Apple's "zoom into existence" feel)
     ================================================================ */
  var scaleIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var el = entry.target;
      if (entry.isIntersecting) {
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('section:not(.hero-photo)').forEach(function (sec) {
    if (!sec.classList.contains('reveal') && !sec.classList.contains('reveal-scale')) {
      sec.style.transition = 'transform .9s cubic-bezier(.25,.1,0,1), opacity .9s cubic-bezier(.25,.1,0,1)';
      sec.style.transform = 'scale(0.98)';
      sec.style.opacity = '0.4';
      scaleIO.observe(sec);
    }
  });

  /* ================================================================
     SERVICES PARALLAX — subtle per-card depth via CSS individual
     `translate` (independent from hover `transform: translateY`)
     ================================================================ */
  var svcSection = document.querySelector('#perkhidmatan');
  var svcCards = document.querySelectorAll('.svc');
  if (svcSection && svcCards.length) {
    var svcDepths = [0.055, 0.035, 0.060, 0.040, 0.038, 0.058, 0.042, 0.052];
    var svTicking = false;
    function updateSvcParallax() {
      var vh = window.innerHeight;
      var rect = svcSection.getBoundingClientRect();
      var rel = (rect.top + rect.height / 2 - vh / 2) / vh;
      svcCards.forEach(function(card, i) {
        var shift = Math.max(-18, Math.min(18, rel * svcDepths[i % svcDepths.length] * vh));
        card.style.setProperty('--py', shift + 'px');
      });
      svTicking = false;
    }
    window.addEventListener('scroll', function() {
      if (!svTicking) { requestAnimationFrame(updateSvcParallax); svTicking = true; }
    }, { passive: true });
    updateSvcParallax();
  }

  /* ================================================================
     GALLERY PARALLAX — translate img on scroll; CSS individual
     `scale` handles hover zoom independently
     ================================================================ */
  var galleryItems = document.querySelectorAll('.gitem');
  if (galleryItems.length) {
    var gTicking = false;
    function updateGalleryParallax() {
      var vh = window.innerHeight;
      galleryItems.forEach(function(item) {
        var img = item.querySelector('img');
        if (!img) return;
        var rect = item.getBoundingClientRect();
        var rel = (rect.top + rect.height / 2 - vh / 2) / vh;
        var shift = Math.max(-35, Math.min(35, rel * 55));
        img.style.setProperty('--py', shift + 'px');
      });
      gTicking = false;
    }
    window.addEventListener('scroll', function() {
      if (!gTicking) { requestAnimationFrame(updateGalleryParallax); gTicking = true; }
    }, { passive: true });
    updateGalleryParallax();
  }

  /* ================================================================
     COST ESTIMATOR
     ================================================================ */
  initEstimator();

  function initEstimator() {
    var est = document.getElementById('est');
    if (!est) return;
    var state = { premis: 'dom', fasa: '1', sambungan: 'oh' };
    function csp() {
      if (state.sambungan === 'ug') return 1700;
      if (state.premis === 'dom') return state.fasa === '3' ? 750 : 450;
      return state.fasa === '3' ? 1700 : 450;
    }
    function kontraktor() { return state.fasa === '3' ? [200, 400] : [150, 300]; }
    function fmt(n) { return 'RM ' + n.toLocaleString('en-MY'); }
    function render() {
      var c = csp(), k = kontraktor(), stamp = 10;
      est.querySelector('[data-out="csp"]').textContent = fmt(c);
      est.querySelector('[data-out="stamp"]').textContent = fmt(stamp);
      est.querySelector('[data-out="kon"]').textContent = fmt(k[0]) + ' – ' + fmt(k[1]);
      est.querySelector('[data-out="total"]').textContent = fmt(c + stamp + k[0]) + ' – ' + fmt(c + stamp + k[1]);
    }
    est.querySelectorAll('.seg').forEach(function (seg) {
      var key = seg.getAttribute('data-key');
      seg.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          seg.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          state[key] = b.getAttribute('data-val');
          render();
        });
      });
    });
    render();
  }

})();
