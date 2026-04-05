/* ============================================================
   SAKALA Community Wealth Fund — Dashboard Logic
   Fetches data.json, animates counters, populates feed,
   handles subscriber lookup, auto-refreshes every 60s.
   ============================================================ */

(function () {
  'use strict';

  const DATA_URL = 'data.json';
  const REFRESH_INTERVAL = 60000;
  const BASESCAN_URL = 'https://basescan.org/tx/';

  let dashboardData = null;

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupSubscriberSearch();
    setInterval(loadData, REFRESH_INTERVAL);
  });

  // --- Data Loading ---
  async function loadData() {
    try {
      const resp = await fetch(DATA_URL + '?t=' + Date.now());
      if (!resp.ok) throw new Error('Failed to fetch data');
      dashboardData = await resp.json();
      render(dashboardData);
    } catch (err) {
      console.error('Dashboard data load error:', err);
    }
  }

  // --- Render All ---
  function render(data) {
    renderTimestamp(data.lastUpdated);
    renderOverview(data.overview);
    renderSplit(data.split);
    renderTransactions(data.transactions);
    renderImpact(data.impact);
    renderComparison(data.comparison);
    animateOnScroll();
  }

  // --- Timestamp ---
  function renderTimestamp(ts) {
    const el = document.getElementById('last-updated');
    if (!el) return;
    const d = new Date(ts);
    el.textContent = d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });
  }

  // --- Overview Cards ---
  function renderOverview(overview) {
    animateCounter('total-received', overview.totalReceived, '$');
    animateCounter('total-distributed', overview.totalDistributed, '$');
    animateCounter('treasury-balance', overview.treasuryBalance, '$');
    animateCounter('total-members', overview.totalMembers);
    animateCounter('phi-score', overview.phiScore, '', 3);
  }

  // --- Animated Counter ---
  function animateCounter(id, target, prefix = '', decimals = 0) {
    const el = document.getElementById(id);
    if (!el) return;

    const duration = 1800;
    const startTime = performance.now();
    const startValue = parseFloat(el.dataset.currentValue || '0');

    el.dataset.currentValue = target;

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * eased;

      el.textContent = formatValue(current, prefix, decimals);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatValue(target, prefix, decimals);
      }
    }

    requestAnimationFrame(step);
  }

  function formatValue(val, prefix = '', decimals = 0) {
    if (prefix === '$') {
      if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
      if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
      if (val >= 1e3) return '$' + Math.round(val).toLocaleString('en-US');
      return '$' + val.toFixed(decimals);
    }
    if (decimals > 0) return prefix + val.toFixed(decimals);
    return prefix + Math.round(val).toLocaleString('en-US');
  }

  // --- Split Bars ---
  function renderSplit(split) {
    const entries = [
      { key: 'franchise', data: split.franchiseOperations, cls: 'franchise' },
      { key: 'gold', data: split.goldReserve, cls: 'gold' },
      { key: 'equipment', data: split.equipmentFund, cls: 'equipment' },
      { key: 'research', data: split.research, cls: 'research' },
      { key: 'admin', data: split.administration, cls: 'admin' }
    ];

    entries.forEach(entry => {
      const fill = document.getElementById('bar-' + entry.key);
      const amount = document.getElementById('amount-' + entry.key);
      if (fill) {
        // Scale: franchise at 70% gets 100% bar width
        const barWidth = (entry.data.pct / 70) * 100;
        setTimeout(() => {
          fill.style.width = Math.min(barWidth, 100) + '%';
        }, 300);
      }
      if (amount) {
        amount.textContent = '$' + entry.data.amount.toLocaleString('en-US');
      }
    });

    // Update donut center
    const donutValue = document.getElementById('donut-total');
    if (donutValue) {
      const total = entries.reduce((s, e) => s + e.data.amount, 0);
      animateCounter('donut-total', total, '$');
    }
  }

  // --- Transactions ---
  function renderTransactions(txs) {
    const feed = document.getElementById('tx-feed');
    if (!feed) return;

    feed.innerHTML = txs.map(tx => {
      const time = new Date(tx.timestamp);
      const timeStr = time.toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const typeClass = 'tx-type--' + tx.type;
      const hashShort = tx.hash.slice(0, 8) + '...' + tx.hash.slice(-6);

      return `
        <div class="tx-item">
          <span class="tx-time">${timeStr}</span>
          <span class="tx-type ${typeClass}">
            <span class="dot"></span>${tx.type}
          </span>
          <span class="tx-amount">$${tx.amount.toFixed(2)}</span>
          <span class="tx-franchise" title="${tx.franchise}">${tx.franchise}</span>
          <span class="tx-hash">
            <a href="${BASESCAN_URL}${tx.hash}" target="_blank" rel="noopener">${hashShort}</a>
          </span>
        </div>
      `;
    }).join('');
  }

  // --- Impact ---
  function renderImpact(impact) {
    animateCounter('youth-employed', impact.youthEmployed);
    animateCounter('franchise-sites', impact.franchiseSites);
    animateCounter('merchants-network', impact.merchantsInNetwork);
    animateCounter('books-circulation', impact.booksInCirculation);
    animateCounter('cards-issued', impact.cardsIssued);
  }

  // --- Comparison ---
  function renderComparison(comp) {
    const usaidTotal = document.getElementById('usaid-total');
    const sakalaTotal = document.getElementById('sakala-total');
    const usaidPhi = document.getElementById('usaid-phi');
    const sakalaPhi = document.getElementById('sakala-phi');

    if (usaidTotal) usaidTotal.textContent = '$' + (comp.usaid.totalSent / 1e9).toFixed(3) + 'B';
    if (sakalaTotal) sakalaTotal.textContent = '$' + comp.sakala.totalSent.toLocaleString('en-US');
    if (usaidPhi) animateCounter('usaid-phi', comp.usaid.phiScore, '', 3);
    if (sakalaPhi) animateCounter('sakala-phi', comp.sakala.phiScore, '', 3);
  }

  // --- Subscriber Search ---
  function setupSubscriberSearch() {
    const form = document.getElementById('subscriber-form');
    const input = document.getElementById('subscriber-input');
    if (!form || !input) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      lookupSubscriber(input.value.trim().toUpperCase());
    });
  }

  function lookupSubscriber(id) {
    const resultEl = document.getElementById('subscriber-result');
    const errorEl = document.getElementById('subscriber-error');
    if (!resultEl || !errorEl || !dashboardData) return;

    resultEl.classList.remove('active');
    errorEl.classList.remove('active');

    if (!id) {
      errorEl.textContent = 'Please enter a subscriber ID (e.g., SAK-003412)';
      errorEl.classList.add('active');
      return;
    }

    const sub = dashboardData.subscribers[id];
    if (!sub) {
      errorEl.textContent = 'Subscriber ID "' + id + '" not found. Try: SAK-003412, SAK-003411, SAK-003408, SAK-002187, or SAK-001543';
      errorEl.classList.add('active');
      return;
    }

    // Populate result
    document.getElementById('sub-avatar-text').textContent = sub.youthName.split(' ').map(n => n[0]).join('');
    document.getElementById('sub-youth-name').textContent = sub.youthName;
    document.getElementById('sub-location').textContent = sub.franchiseName + ' -- ' + sub.location;
    document.getElementById('sub-franchise-id').textContent = sub.franchise;

    document.getElementById('sub-franchise-amount').textContent = '$' + sub.splitBreakdown.franchise.toFixed(2);
    document.getElementById('sub-gold-amount').textContent = '$' + sub.splitBreakdown.goldReserve.toFixed(2);
    document.getElementById('sub-equipment-amount').textContent = '$' + sub.splitBreakdown.equipment.toFixed(2);
    document.getElementById('sub-research-amount').textContent = '$' + sub.splitBreakdown.research.toFixed(2);
    document.getElementById('sub-admin-amount').textContent = '$' + sub.splitBreakdown.admin.toFixed(2);

    document.getElementById('sub-youth-avatar-text').textContent = sub.youthName.split(' ')[0][0];
    document.getElementById('sub-youth-full-name').textContent = sub.youthName;
    document.getElementById('sub-youth-detail').textContent = 'Age ' + sub.youthAge + ' -- ' + sub.franchise + ', ' + sub.location;

    const growingEl = document.getElementById('sub-growing');
    growingEl.innerHTML = sub.growing.split(', ').map(g =>
      '<span class="growing-tag">' + g + '</span>'
    ).join('');

    resultEl.classList.add('active');
  }

  // --- Scroll Animations ---
  function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .impact-card, .comparison-card').forEach(el => {
      observer.observe(el);
    });
  }

})();
