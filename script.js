/* =================================================================
   La Poutine — site interactivity
   Plain vanilla JS. No build step, GitHub Pages friendly.
   ================================================================= */

/* Safe Google Analytics event helper.
   Works whether or not the GA4 snippet has been pasted in <head>.
   (Until you add your real G-XXXXXXXXXX tag, these just no-op.) */
function trackEvent(name, params) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params || {});
  }
  // Visible in the browser console for testing before GA is connected.
  console.log('[analytics]', name, params || {});
}

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- 1. Highlight today's row on the Hours table ---------- */
  var todayIndex = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
  var todayRow = document.querySelector('.hours-table tr[data-day="' + todayIndex + '"]');
  if (todayRow) {
    todayRow.classList.add('today');
  }

  /* ---------- 2. Reservation form: inline validation + step analytics ---------- */
  var form = document.getElementById('reservation-form');
  var successMsg = document.getElementById('success-msg');

  if (form) {
    var dateInput = document.getElementById('date');
    if (dateInput) {
      dateInput.min = new Date().toISOString().split('T')[0];
    }

    // Per-field rules: return an error string, or '' when the value is valid.
    var validators = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your full name.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.'; },
      phone: function (v) { return (v.replace(/\D/g, '').length >= 10) ? '' : 'Enter a phone number with at least 10 digits.'; },
      guests: function (v) { return v ? '' : 'Please choose a party size.'; },
      date: function (v) {
        if (!v) return 'Please choose a date.';
        return (v < new Date().toISOString().split('T')[0]) ? 'Please choose a date that is not in the past.' : '';
      },
      time: function (v) { return v ? '' : 'Please choose a time.'; }
    };

    var fieldIds = Object.keys(validators);
    var completed = {};   // tracks which fields we've already logged as complete
    var started = false;  // tracks the first-interaction analytics event

    function setFieldState(id, error) {
      var field = document.getElementById(id);
      var group = field.closest('.form-group');
      var errEl = group.querySelector('.field-error');
      if (error) {
        group.classList.add('has-error');
        group.classList.remove('is-valid');
        if (errEl) errEl.textContent = error;
        field.setAttribute('aria-invalid', 'true');
      } else {
        group.classList.remove('has-error');
        if (field.value) group.classList.add('is-valid');
        if (errEl) errEl.textContent = '';
        field.setAttribute('aria-invalid', 'false');
      }
    }

    function validateField(id) {
      var field = document.getElementById(id);
      var error = validators[id](field.value);
      setFieldState(id, error);
      // Log the first time a field becomes valid (step-completion for drop-off analysis).
      if (!error && !completed[id]) {
        completed[id] = true;
        trackEvent('reservation_field_complete', {
          field: id,
          fields_complete: Object.keys(completed).length,
          total_fields: fieldIds.length
        });
      }
      return !error;
    }

    fieldIds.forEach(function (id) {
      var field = document.getElementById(id);
      if (!field) return;

      field.addEventListener('focus', function () {
        if (!started) {
          started = true;
          trackEvent('reservation_start', {});
        }
      });
      // Validate when leaving a field…
      field.addEventListener('blur', function () {
        if (field.value) validateField(id);
      });
      // …and clear the error live once it's corrected.
      var evt = (field.tagName === 'SELECT') ? 'change' : 'input';
      field.addEventListener(evt, function () {
        if (field.closest('.form-group').classList.contains('has-error')) {
          validateField(id);
        } else if (field.value) {
          validateField(id);
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var invalid = [];
      fieldIds.forEach(function (id) {
        if (!validateField(id)) invalid.push(id);
      });

      if (invalid.length) {
        trackEvent('reservation_validation_error', {
          invalid_fields: invalid.join(','),
          invalid_count: invalid.length
        });
        var firstBad = document.getElementById(invalid[0]);
        if (firstBad) firstBad.focus();
        return;
      }

      var guests = document.getElementById('guests').value;
      var dateVal = document.getElementById('date').value;
      var timeVal = document.getElementById('time').value;

      /* CUSTOM GA4 EVENT — fires on a successfully completed reservation. */
      trackEvent('reservation_submitted', {
        party_size: guests,
        reservation_date: dateVal,
        reservation_time: timeVal
      });

      // Populate the explicit confirmation summary.
      var summary = {
        name: document.getElementById('name').value.trim(),
        guests: guests + (guests === '1' ? ' guest' : ' guests'),
        date: formatDate(dateVal),
        time: timeVal
      };
      Object.keys(summary).forEach(function (key) {
        var cell = document.querySelector('[data-summary="' + key + '"]');
        if (cell) cell.textContent = summary[key];
      });

      // Swap the form for the confirmation state.
      form.style.display = 'none';
      if (successMsg) {
        successMsg.style.display = 'block';
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // "Make another reservation" — reset back to a fresh, empty form.
    var newBtn = document.getElementById('new-reservation-btn');
    if (newBtn) {
      newBtn.addEventListener('click', function () {
        form.reset();
        completed = {};
        started = false;
        fieldIds.forEach(function (id) {
          var group = document.getElementById(id).closest('.form-group');
          group.classList.remove('has-error', 'is-valid');
        });
        if (successMsg) successMsg.style.display = 'none';
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        trackEvent('reservation_restart', {});
      });
    }
  }

  function formatDate(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* ---------- 3. Menu: sticky toolbar, search, filter, language toggle ---------- */
  var menuContainer = document.getElementById('menu-container');
  var toolbar = document.getElementById('menu-toolbar');

  if (menuContainer && toolbar) {
    var header = document.querySelector('header');
    var searchInput = document.getElementById('menu-search-input');
    var noResults = document.getElementById('menu-no-results');
    var chips = Array.prototype.slice.call(document.querySelectorAll('.menu-chip'));
    var langBtns = Array.prototype.slice.call(document.querySelectorAll('.lang-btn'));
    var sections = Array.prototype.slice.call(menuContainer.querySelectorAll('.menu-section'));
    var items = Array.prototype.slice.call(menuContainer.querySelectorAll('.menu-item'));
    var activeCategory = 'all';

    // Keep the sticky toolbar docked directly beneath the sticky header.
    function positionToolbar() {
      if (header) toolbar.style.top = header.offsetHeight + 'px';
    }
    positionToolbar();
    window.addEventListener('resize', positionToolbar);

    // Pre-compute searchable text for each item once.
    items.forEach(function (item) {
      item.dataset.search = item.textContent.toLowerCase().replace(/\s+/g, ' ').trim();
    });

    function applyFilters() {
      var query = (searchInput ? searchInput.value : '').toLowerCase().trim();
      var anyVisible = false;

      sections.forEach(function (section) {
        var sectionHasMatch = false;
        var sectionItems = Array.prototype.slice.call(section.querySelectorAll('.menu-item'));

        sectionItems.forEach(function (item) {
          var matchesCategory = (activeCategory === 'all') || (section.dataset.category === activeCategory);
          var matchesQuery = !query || item.dataset.search.indexOf(query) !== -1;
          var show = matchesCategory && matchesQuery;
          item.hidden = !show;
          if (show) { sectionHasMatch = true; anyVisible = true; }
        });

        section.hidden = !sectionHasMatch;
      });

      if (noResults) noResults.hidden = anyVisible;
    }

    if (searchInput) {
      var searchTimer;
      searchInput.addEventListener('input', function () {
        applyFilters();
        // Debounce the analytics event so we log intent, not every keystroke.
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          var q = searchInput.value.trim();
          if (q) {
            var visible = items.filter(function (i) { return !i.hidden; }).length;
            trackEvent('menu_search', { query: q, results: visible });
          }
        }, 700);
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        activeCategory = chip.dataset.filter;
        chips.forEach(function (c) { c.classList.toggle('active', c === chip); });
        applyFilters();
        trackEvent('menu_filter', { category: activeCategory });
        // Scroll results into view beneath the sticky toolbar.
        var offset = (header ? header.offsetHeight : 0) + toolbar.offsetHeight + 12;
        var top = menuContainer.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
      });
    });

    // Language toggle — remembers the visitor's choice across pages/visits.
    function setLanguage(lang, log) {
      menuContainer.classList.remove('lang-fr', 'lang-en', 'lang-both');
      menuContainer.classList.add('lang-' + lang);
      langBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.lang === lang); });
      try { localStorage.setItem('menuLang', lang); } catch (e) {}
      if (log) trackEvent('menu_language_toggle', { language: lang });
    }
    var savedLang = 'both';
    try { savedLang = localStorage.getItem('menuLang') || 'both'; } catch (e) {}
    setLanguage(savedLang, false);
    langBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { setLanguage(btn.dataset.lang, true); });
    });
  }

  /* ---------- 4. Lightweight click tracking ---------- */
  // Track clicks on any element with a data-event attribute (e.g. "Get directions").
  document.querySelectorAll('[data-event]').forEach(function (el) {
    el.addEventListener('click', function () {
      trackEvent(el.getAttribute('data-event'), { label: el.textContent.trim() });
    });
  });

  // Track all primary call-to-action button clicks.
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      trackEvent('cta_click', { label: btn.textContent.trim() });
    });
  });
});
