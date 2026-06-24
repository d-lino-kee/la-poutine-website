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

  /* ---------- 2. Reservation form handling ---------- */
  var form = document.getElementById('reservation-form');
  var successMsg = document.getElementById('success-msg');

  if (form) {
    // Prevent picking a date in the past.
    var dateInput = document.getElementById('date');
    if (dateInput) {
      dateInput.min = new Date().toISOString().split('T')[0];
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Native HTML5 validation (required fields, email format, etc.)
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var guests = document.getElementById('guests').value;

      /* CUSTOM GA4 EVENT (assignment requirement).
         Fires when a user successfully completes the reservation task. */
      trackEvent('reservation_submitted', {
        party_size: guests,
        reservation_date: document.getElementById('date').value,
        reservation_time: document.getElementById('time').value
      });

      // Swap the form for the confirmation message.
      form.style.display = 'none';
      if (successMsg) {
        successMsg.style.display = 'block';
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  /* ---------- 3. Lightweight click tracking ---------- */
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
