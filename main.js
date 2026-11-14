/* ============================================================
   WellspringCare — Shared JavaScript
   Handles: page transitions, mobile nav, scroll spy,
            reveal animations, counters, forms, FAQ, verifier
   ============================================================ */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* ============================================================
     1. PAGE LOADER + PAGE-TO-PAGE TRANSITION
     ============================================================ */
  var loader = document.getElementById('pageLoader');
  var pageRevealed = false;

  function revealPage() {
    if (pageRevealed) return;
    pageRevealed = true;
    if (loader) loader.classList.add('is-done');
    docEl.classList.add('is-loaded');
  }

  if (document.readyState === 'complete') {
    setTimeout(revealPage, 240);
  } else {
    window.addEventListener('load', function () {
      setTimeout(revealPage, 320);
    });
  }
  // Safety net: never trap the user behind the loader
  setTimeout(revealPage, 2200);

  // Restoring from bfcache (back/forward) — reset the leaving state
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      docEl.classList.remove('is-leaving');
      revealPage();
    }
  });

  function navigateTo(href) {
    if (docEl.classList.contains('is-leaving')) return;
    docEl.classList.add('is-leaving');
    if (loader) loader.classList.remove('is-done');
    setTimeout(function () { window.location.href = href; }, 340);
  }

  // Intercept same-origin .html navigation to play the exit animation
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;

    var href = a.getAttribute('href');
    if (!href) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    if (/^(#|mailto:|tel:|sms:|javascript:)/i.test(href)) return;

    var url;
    try { url = new URL(href, window.location.href); } catch (err) { return; }

    if (url.origin !== window.location.origin) return;
    if (!/\.html?$/i.test(url.pathname)) return;

    // Same document — let the browser handle the hash
    if (url.pathname === window.location.pathname) return;

    e.preventDefault();
    navigateTo(url.href);
  });

  // If we landed with a hash (e.g. index.html#services), scroll after the loader
  if (window.location.hash.length > 1) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        var target = document.getElementById(window.location.hash.slice(1));
        if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 460);
    });
  }

  /* ============================================================
     2. MOBILE NAV
     ============================================================ */
  var header  = document.getElementById('header');
  var nav     = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');

  function closeMenu() {
    if (!nav || !menuBtn) return;
    nav.classList.remove('is-open');
    menuBtn.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('nav-open');
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('nav-open', open);
    });

    $$('a', nav).forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) closeMenu();
    });
  }

  /* ============================================================
     3. HEADER SHADOW ON SCROLL
     ============================================================ */
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ============================================================
     4. SCROLL SPY (same-page anchors only)
     ============================================================ */
  var navLinks = $$('.nav__link').filter(function (link) {
    return (link.getAttribute('href') || '').charAt(0) === '#';
  });

  var sections = navLinks.map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ============================================================
     5. SCROLL REVEAL ANIMATIONS
     ============================================================ */
  $$('.stagger').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add('reveal');
      child.style.transitionDelay = (i * 70) + 'ms';
    });
  });

  var revealEls = $$('.reveal');

  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ============================================================
     6. ANIMATED COUNTERS
     ============================================================ */
  function animateCount(el) {
    var target   = parseFloat(el.dataset.count || '0');
    var suffix   = el.dataset.suffix || '';
    var duration = 1600;
    var start    = performance.now();

    function frame(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 3);
      var value    = Math.round(target * eased);
      el.textContent = value.toLocaleString('en-US') + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = $$('.stat__num');
  if ('IntersectionObserver' in window && counters.length) {
    var countObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { countObs.observe(c); });
  } else {
    counters.forEach(function (c) {
      c.textContent = Number(c.dataset.count).toLocaleString('en-US') + (c.dataset.suffix || '');
    });
  }

  /* ============================================================
     7. FAQ ACCORDION
     ============================================================ */
  var faqItems = $$('.faq__item');
  faqItems.forEach(function (item) {
    var btn    = $('.faq__q', item);
    var answer = $('.faq__a', item);
    if (!btn || !answer) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');

      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        var q = $('.faq__q', other);
        var a = $('.faq__a', other);
        if (q) q.setAttribute('aria-expanded', 'false');
        if (a) a.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ============================================================
     8. TOAST HELPER
     ============================================================ */
  var toast = document.getElementById('toast');
  var toastTimer;

  function showToast(message, type) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = 'toast show' + (type ? ' toast--' + type : '');
    toastTimer = setTimeout(function () { toast.className = 'toast'; }, 4600);
  }

  /* ============================================================
     9. FORM VALIDATION HELPERS
     ============================================================ */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

  function setInvalid(input, invalid) {
    input.classList.toggle('is-invalid', invalid);
    var field = input.closest('.field');
    if (!field) return;
    var err = field.querySelector('.err');
    if (err) err.classList.toggle('show', invalid);
  }

  function validateForm(form) {
    var firstInvalid = null;

    $$('[required]', form).forEach(function (input) {
      var invalid = false;

      if (input.type === 'checkbox') {
        invalid = !input.checked;
      } else if (input.type === 'file') {
        invalid = !input.files || input.files.length === 0;
      } else if (input.type === 'email') {
        invalid = !EMAIL_RE.test(input.value.trim());
      } else {
        invalid = input.value.trim() === '';
      }

      setInvalid(input, invalid);
      if (invalid && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return !firstInvalid;
  }

  $$('.field input, .field select, .field textarea').forEach(function (input) {
    var clear = function () { setInvalid(input, false); };
    input.addEventListener('input', clear);
    input.addEventListener('change', clear);
  });

  /* ============================================================
     10. FILE INPUT — display chosen file name
     ============================================================ */
  var resumeInput = document.getElementById('resume');
  var fileNameEl  = document.getElementById('fileName');

  if (resumeInput && fileNameEl) {
    resumeInput.addEventListener('change', function () {
      var file = resumeInput.files && resumeInput.files[0];
      if (!file) {
        fileNameEl.textContent = 'No file chosen';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        fileNameEl.textContent = 'File is larger than 5 MB — please choose another.';
        resumeInput.value = '';
        setInvalid(resumeInput, true);
        return;
      }
      fileNameEl.textContent = file.name;
      setInvalid(resumeInput, false);
    });
  }

  /* ============================================================
     11. APPLICATION FORM
     ============================================================ */
  var applicationForm = document.getElementById('applicationForm');
  if (applicationForm) {
    applicationForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(applicationForm)) {
        showToast('Please complete the highlighted fields before submitting.', 'bad');
        return;
      }
      showToast('Application received! Our recruiting team will be in touch within 3–5 business days.', 'ok');
      applicationForm.reset();
      if (fileNameEl) fileNameEl.textContent = 'No file chosen';
    });
  }

  /* ============================================================
     12. "APPLY NOW" BUTTONS — preselect position & scroll
     ============================================================ */
  var positionSelect = document.getElementById('position');
  $$('.apply-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var position = btn.dataset.position || '';
      if (positionSelect) {
        positionSelect.value = position;
        setInvalid(positionSelect, false);
      }
      var target = document.getElementById('apply');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () {
        var nameField = document.getElementById('fullName');
        if (nameField) nameField.focus({ preventScroll: true });
      }, 600);
    });
  });

  /* ============================================================
     13. CONTACT FORM
     ============================================================ */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(contactForm)) {
        showToast('Please complete the highlighted fields before sending.', 'bad');
        return;
      }
      showToast('Thank you! Your message has been sent — our team will respond shortly.', 'ok');
      contactForm.reset();
    });
  }

  /* ============================================================
     14. INTERVIEW CODE VERIFIER
     ============================================================ */
  var OFFICIAL_CODES = ['WK-400'];
  var codeInput  = document.getElementById('codeInput');
  var checkBtn   = document.getElementById('checkCodeBtn');
  var codeResult = document.getElementById('codeResult');

  var ICON_OK  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var ICON_BAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8v5M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>';

  function checkCode() {
    if (!codeInput || !codeResult) return;
    var value = (codeInput.value || '').trim().toUpperCase().replace(/\s+/g, '');

    if (!value) {
      codeResult.className = 'check-result check-result--bad show';
      codeResult.innerHTML = ICON_BAD + '<div>Please enter the interview code from your invitation.</div>';
      return;
    }

    if (OFFICIAL_CODES.indexOf(value) !== -1) {
      codeResult.className = 'check-result check-result--ok show';
      codeResult.innerHTML = ICON_OK +
        '<div><strong>Code verified.</strong> This code belongs to an official WellspringCare interview. ' +
        'Confirm the interviewer is one of our named hiring managers on Microsoft Teams before joining.</div>';
    } else {
      codeResult.className = 'check-result check-result--bad show';
      codeResult.innerHTML = ICON_BAD +
        '<div><strong>Code not recognised.</strong> Do not share any personal information. ' +
        'Report this to <a href="mailto:Support@wellspring-care.net" style="color:inherit;text-decoration:underline;">Support@wellspring-care.net</a> before responding.</div>';
    }
  }

  if (checkBtn && codeInput) {
    checkBtn.addEventListener('click', checkCode);
    codeInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); checkCode(); }
    });
  }

  /* ============================================================
     15. FOOTER YEAR
     ============================================================ */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();