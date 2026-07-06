// ---------- THEME TOGGLE ----------
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀';
  }
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.textContent = '☾';
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.textContent = '☀';
      localStorage.setItem('theme', 'dark');
    }
  });
}

// ---------- MODE SWITCHERS (percentage + gst, only run if present on this page) ----------
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.closest('.panel');
    if (!group) return;
    group.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mode = btn.dataset.mode;
    group.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
    const target = group.querySelector(`[data-mode-panel="${mode}"]`);
    if (target) target.classList.add('active');
    if (group.id === 'gst') calcGST();
  });
});

function money(n) {
  if (!isFinite(n)) return '₹0';
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// ================= PERCENTAGE =================
if (document.getElementById('p1a')) {
  function calcPercentage() {
    const a1 = parseFloat(document.getElementById('p1a').value) || 0;
    const b1 = parseFloat(document.getElementById('p1b').value) || 0;
    document.getElementById('p1result').textContent = `= ${((a1 / 100) * b1).toLocaleString('en-IN', {maximumFractionDigits: 2})}`;

    const a2 = parseFloat(document.getElementById('p2a').value) || 0;
    const b2 = parseFloat(document.getElementById('p2b').value) || 0;
    const inc = a2 !== 0 ? ((b2 - a2) / a2) * 100 : 0;
    document.getElementById('p2result').textContent = `= ${inc.toFixed(2)}% increase`;

    const a3 = parseFloat(document.getElementById('p3a').value) || 0;
    const b3 = parseFloat(document.getElementById('p3b').value) || 0;
    const dec = a3 !== 0 ? ((a3 - b3) / a3) * 100 : 0;
    document.getElementById('p3result').textContent = `= ${dec.toFixed(2)}% decrease`;

    const a4 = parseFloat(document.getElementById('p4a').value) || 0;
    const b4 = parseFloat(document.getElementById('p4b').value) || 0;
    const avg = (a4 + b4) / 2;
    const diff = avg !== 0 ? (Math.abs(a4 - b4) / avg) * 100 : 0;
    document.getElementById('p4result').textContent = `= ${diff.toFixed(2)}% difference`;
  }
  ['p1a','p1b','p2a','p2b','p3a','p3b','p4a','p4b'].forEach(id => {
    document.getElementById(id).addEventListener('input', calcPercentage);
  });
  calcPercentage();
}

// ================= EMI =================
if (document.getElementById('emiPrincipal')) {
  const emiPrincipal = document.getElementById('emiPrincipal');
  const emiPrincipalRange = document.getElementById('emiPrincipalRange');
  const emiRate = document.getElementById('emiRate');
  const emiRateRange = document.getElementById('emiRateRange');
  const emiTenure = document.getElementById('emiTenure');
  const emiTenureRange = document.getElementById('emiTenureRange');

  function syncPair(numInput, rangeInput) {
    numInput.addEventListener('input', () => { rangeInput.value = numInput.value; calcEMI(); });
    rangeInput.addEventListener('input', () => { numInput.value = rangeInput.value; calcEMI(); });
  }
  syncPair(emiPrincipal, emiPrincipalRange);
  syncPair(emiRate, emiRateRange);
  syncPair(emiTenure, emiTenureRange);

  function calcEMI() {
    const P = parseFloat(emiPrincipal.value) || 0;
    const R = parseFloat(emiRate.value) || 0;
    const N = parseFloat(emiTenure.value) || 0;
    const r = R / (12 * 100);
    let emi;
    if (r === 0) {
      emi = N > 0 ? P / N : 0;
    } else {
      emi = P * r * Math.pow(1 + r, N) / (Math.pow(1 + r, N) - 1);
    }
    const totalPayment = emi * N;
    const totalInterest = totalPayment - P;

    document.getElementById('emiMonthly').textContent = money(emi);
    document.getElementById('emiInterest').textContent = money(totalInterest);
    document.getElementById('emiTotal').textContent = money(totalPayment);

    const principalPct = totalPayment > 0 ? (P / totalPayment) * 100 : 100;
    const interestPct = 100 - principalPct;
    document.getElementById('emiBarPrincipal').style.width = principalPct + '%';
    document.getElementById('emiBarInterest').style.width = interestPct + '%';
  }
  calcEMI();
}

// ================= GST =================
if (document.getElementById('gstAmount')) {
  document.getElementById('gstAmount').addEventListener('input', calcGST);
  document.getElementById('gstCustomRate').addEventListener('input', () => {
    document.querySelectorAll('.rate-btn').forEach(b => b.classList.remove('active'));
    calcGST();
  });
  document.querySelectorAll('.rate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rate-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('gstCustomRate').value = '';
      calcGST();
    });
  });
}

function calcGST() {
  const amountEl = document.getElementById('gstAmount');
  if (!amountEl) return;
  const amount = parseFloat(amountEl.value) || 0;
  const customRate = parseFloat(document.getElementById('gstCustomRate').value);
  const activeBtn = document.querySelector('.rate-btn.active');
  const rate = !isNaN(customRate) && document.getElementById('gstCustomRate').value !== ''
    ? customRate
    : (activeBtn ? parseFloat(activeBtn.dataset.rate) : 12);

  const mode = document.querySelector('#gst .mode-btn.active').dataset.mode;
  let gstAmount, final;
  if (mode === 'gst-add') {
    gstAmount = amount * (rate / 100);
    final = amount + gstAmount;
  } else {
    final = amount;
    const base = final / (1 + rate / 100);
    gstAmount = final - base;
    final = base;
  }

  document.getElementById('gstAmountOut').textContent = money(gstAmount);
  document.getElementById('gstFinal').textContent = money(final);
}
if (document.getElementById('gstAmount')) calcGST();

// ================= AGE =================
if (document.getElementById('ageDob')) {
  const ageDob = document.getElementById('ageDob');
  ageDob.addEventListener('input', calcAge);

  function calcAge() {
    if (!ageDob.value) return;
    const dob = new Date(ageDob.value);
    const today = new Date();
    if (dob > today) {
      document.getElementById('ageExact').textContent = 'Pick a past date';
      document.getElementById('ageNextBday').textContent = '—';
      return;
    }

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    document.getElementById('ageExact').textContent = `${years}y ${months}m ${days}d`;

    let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < today) {
      next = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
    }
    const diffMs = next - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    document.getElementById('ageNextBday').textContent = diffDays === 0 ? 'Today! 🎉' : `${diffDays} days`;
  }
}

// ================= DISCOUNT =================
if (document.getElementById('discOriginal')) {
  ['discOriginal','discPercent','discPercent2'].forEach(id => {
    document.getElementById(id).addEventListener('input', calcDiscount);
  });
  document.getElementById('discStack').addEventListener('change', (e) => {
    document.getElementById('discStackRow').style.display = e.target.checked ? 'block' : 'none';
    calcDiscount();
  });

  function calcDiscount() {
    const original = parseFloat(document.getElementById('discOriginal').value) || 0;
    const pct = parseFloat(document.getElementById('discPercent').value) || 0;
    const stacked = document.getElementById('discStack').checked;
    const pct2 = parseFloat(document.getElementById('discPercent2').value) || 0;

    let final;
    if (stacked) {
      final = original * (1 - pct / 100) * (1 - pct2 / 100);
    } else {
      final = original * (1 - pct / 100);
    }
    const saved = original - final;

    document.getElementById('discSaved').textContent = money(saved);
    document.getElementById('discFinal').textContent = money(final);
  }
  calcDiscount();
}

// ================= SALARY =================
if (document.getElementById('salMonthly')) {
  document.getElementById('salMonthly').addEventListener('input', calcSalary);

  function estimateTaxIndiaNewRegime(annual) {
    const slabs = [
      { upto: 300000, rate: 0 },
      { upto: 600000, rate: 0.05 },
      { upto: 900000, rate: 0.10 },
      { upto: 1200000, rate: 0.15 },
      { upto: 1500000, rate: 0.20 },
      { upto: Infinity, rate: 0.30 },
    ];
    let tax = 0;
    let lower = 0;
    for (const slab of slabs) {
      if (annual > lower) {
        const taxableInSlab = Math.min(annual, slab.upto) - lower;
        tax += taxableInSlab * slab.rate;
        lower = slab.upto;
      } else {
        break;
      }
    }
    return Math.max(0, tax);
  }

  function calcSalary() {
    const monthly = parseFloat(document.getElementById('salMonthly').value) || 0;
    const annual = monthly * 12;
    const tax = estimateTaxIndiaNewRegime(annual);
    const inHandMonthly = (annual - tax) / 12;

    document.getElementById('salAnnual').textContent = money(annual);
    document.getElementById('salTax').textContent = money(tax);
    document.getElementById('salInHand').textContent = money(inHandMonthly);
  }
  calcSalary();
}

// ================= COPY BUTTONS =================
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = document.getElementById(btn.dataset.copyTarget);
    if (!panel) return;
    const results = [...panel.querySelectorAll('.result, .result-card')].map(el => el.textContent.trim()).join(' | ');
    navigator.clipboard.writeText(results).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = original, 1500);
    });
  });
});

// ---------- MOBILE MENU (if present) ----------
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}
