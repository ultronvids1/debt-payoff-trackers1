(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const STORAGE_KEY = "debt_payoff_tracker_site_v1";

  const clampNum = (n) => {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
  };
  const fmtMoney = (n) => "$" + Math.round(clampNum(n)).toLocaleString();
  const fmtDate = (d) => {
    try { return d.toLocaleDateString("en-US", { month:"short", year:"numeric" }); }
    catch { return "—"; }
  };
  const escapeHtml = (str) => String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  const state = {
    tab: "dashboard",
    color: "pink",
    method: "snowball",
    extra: 200,
    debts: [
      { id: 1, name: "Credit Card 1", balance: 5000, min: 100, rate: 18.99 },
      { id: 2, name: "Credit Card 2", balance: 3200, min: 75, rate: 22.50 },
      { id: 3, name: "Car Loan", balance: 12000, min: 300, rate: 5.99 },
      { id: 4, name: "Student Loan", balance: 25000, min: 250, rate: 4.50 }
    ]
  };

  function save(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch{} }
  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      if (data.tab) state.tab = data.tab;
      if (data.color) state.color = data.color;
      if (data.method) state.method = data.method;
      if (typeof data.extra === "number") state.extra = data.extra;
      if (Array.isArray(data.debts)) state.debts = data.debts;
    }catch{}
  }
  function resetToDemo(){ localStorage.removeItem(STORAGE_KEY); location.reload(); }
  function nextId(){ return state.debts.reduce((m,d)=>Math.max(m,Number(d.id)||0),0)+1; }

  function compute(){
    let sorted = state.debts.map(d => ({
      id: d.id,
      name: d.name || "Debt",
      balance: clampNum(d.balance),
      min: clampNum(d.min),
      rate: clampNum(d.rate)
    })).filter(d => d.balance > 0);

    if (state.method === "snowball") sorted.sort((a,b)=>a.balance-b.balance);
    else sorted.sort((a,b)=>b.rate-a.rate);

    const balances = {};
    sorted.forEach(d => balances[d.id] = d.balance);

    let months = 0, totalInt = 0;
    let extraPay = Math.max(0, clampNum(state.extra));
    const payoffMonthById = {};

    while (Object.values(balances).some(b => b > 0.01) && months < 600){
      months++;

      for (const d of sorted){
        if (balances[d.id] > 0.01){
          const monthlyInt = (balances[d.id] * (d.rate/100)) / 12;
          balances[d.id] += monthlyInt;
          totalInt += monthlyInt;
        }
      }

      for (const d of sorted){
        if (balances[d.id] > 0.01){
          const pay = Math.min(Math.max(0, d.min), balances[d.id]);
          balances[d.id] -= pay;
          if (balances[d.id] <= 0.01){
            balances[d.id] = 0;
            payoffMonthById[d.id] = months;
          }
        }
      }

      const target = sorted.find(d => balances[d.id] > 0.01);
      if (target){
        const pay = Math.min(extraPay, balances[target.id]);
        balances[target.id] -= pay;
        if (balances[target.id] <= 0.01){
          balances[target.id] = 0;
          payoffMonthById[target.id] = months;
          extraPay += Math.max(0, target.min);
        }
      }
    }

    const debtFreeDate = new Date();
    debtFreeDate.setMonth(debtFreeDate.getMonth() + months);
    return { months, totalInt, debtFreeDate, payoffMonthById };
  }

  const out = (k) => $('[data-out="'+k+'"]');

  function applyColor(){
    document.documentElement.setAttribute("data-color", state.color);
    const btn = $("#colorModeBtn");
    if (btn){
      btn.innerHTML = `<span class="icon" aria-hidden="true">${state.color==="blue"?"💙":"💗"}</span>${state.color==="blue"?"Blue":"Pink"}`;
    }
  }

  function applyTabs(){
    $$(".tab").forEach(t => {
      const active = t.dataset.tab === state.tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    $$(".panel").forEach(p => p.hidden = p.dataset.panel !== state.tab);
  }

  function renderDebts(){
    const host = $("#debtsHost");
    if (!host) return;
    host.innerHTML = "";

    state.debts.forEach((d, idx) => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <input type="text" value="${escapeHtml(d.name ?? "")}" placeholder="Name" data-field="name" data-idx="${idx}">
        <input type="number" min="0" step="1" value="${Number(d.balance ?? 0)}" placeholder="Balance" data-field="balance" data-idx="${idx}">
        <input type="number" min="0" step="1" value="${Number(d.min ?? 0)}" placeholder="Min payment" data-field="min" data-idx="${idx}">
        <input type="number" min="0" step="0.01" value="${Number(d.rate ?? 0)}" placeholder="APR %" data-field="rate" data-idx="${idx}">
        <button class="trash" type="button" title="Remove" aria-label="Remove debt" data-action="removeDebt" data-idx="${idx}">🗑</button>
      `;
      host.appendChild(row);
    });

    $$('input[data-field]', host).forEach(inp => {
      inp.addEventListener("input", (e) => {
        const i = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        if (!Number.isFinite(i)) return;
        if (field === "name") state.debts[i].name = e.target.value;
        else state.debts[i][field] = clampNum(e.target.value);
        save();
        renderAll();
      }, { passive: true });
    });

    $$('[data-action="removeDebt"]', host).forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.idx);
        if (!Number.isFinite(i)) return;
        state.debts.splice(i, 1);
        save();
        renderAll();
      });
    });
  }

  function renderDashboard(calc){
    const totalDebt = state.debts.reduce((s,d) => s + clampNum(d.balance), 0);
    if (out("totalDebt")) out("totalDebt").textContent = fmtMoney(totalDebt);
    if (out("debtCount")) out("debtCount").textContent = String(state.debts.length);
    if (out("months")) out("months").textContent = String(calc.months);
    if (out("monthsInline")) out("monthsInline").textContent = String(calc.months);
    if (out("extra")) out("extra").textContent = fmtMoney(state.extra);
    if (out("totalInterest")) out("totalInterest").textContent = fmtMoney(calc.totalInt);
    if (out("totalInterestInline")) out("totalInterestInline").textContent = fmtMoney(calc.totalInt);
    if (out("debtFreeDate")) out("debtFreeDate").textContent = fmtDate(calc.debtFreeDate);

    const methodPill = $("#methodPill");
    if (methodPill) methodPill.textContent = state.method === "avalanche" ? "Avalanche" : "Snowball";

    const list = out("progressList");
    if (!list) return;
    list.innerHTML = "";
    const totalMonths = Math.max(1, calc.months);

    state.debts.forEach(d => {
      const payoffMonth = calc.payoffMonthById[d.id] || calc.months || 0;
      const progress = Math.min(100, Math.max(0, (payoffMonth / totalMonths) * 100));
      const item = document.createElement("div");
      item.className = "progressItem";
      item.innerHTML = `
        <div class="progressTop">
          <div>
            <div class="progressName">${escapeHtml(d.name || "Debt")}</div>
            <div class="progressSub">${fmtMoney(d.balance)} • ${clampNum(d.rate).toFixed(2)}% APR</div>
          </div>
          <div class="progressMonths">${payoffMonth} months</div>
        </div>
        <div class="bar" aria-label="Progress"><div style="width:${progress}%"></div></div>
      `;
      list.appendChild(item);
    });
  }

  function syncInputs(){
    const methodSel = $("#methodSel");
    const extraInp = $("#extraInp");
    if (methodSel) methodSel.value = state.method;
    if (extraInp) extraInp.value = String(state.extra);

    if (methodSel){
      methodSel.addEventListener("change", (e) => {
        state.method = e.target.value === "avalanche" ? "avalanche" : "snowball";
        save();
        renderAll();
      });
    }
    if (extraInp){
      extraInp.addEventListener("input", (e) => {
        state.extra = Math.max(0, clampNum(e.target.value));
        save();
        renderAll();
      }, { passive: true });
    }
  }

  // Modal
  function openModal(){ const m=$("#modal"); if(m) m.hidden=false; }
  function closeModal(){ const m=$("#modal"); if(m) m.hidden=true; }

  function renderAll(){
    applyColor();
    applyTabs();
    const calc = compute();
    renderDashboard(calc);
    renderDebts();
  }

  function bind(){
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());

    $$(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        state.tab = btn.dataset.tab === "setup" ? "setup" : "dashboard";
        save(); renderAll();
      });
    });

    const addDebtBtn = $("#addDebtBtn");
    if (addDebtBtn){
      addDebtBtn.addEventListener("click", () => {
        state.debts.push({ id: nextId(), name: "New Debt", balance: 0, min: 0, rate: 0 });
        save(); renderAll();
      });
    }

    const toggleColor = () => {
      state.color = state.color === "blue" ? "pink" : "blue";
      save(); renderAll();
    };

    const colorModeBtn = $("#colorModeBtn");
    if (colorModeBtn) colorModeBtn.addEventListener("click", toggleColor);

    const themeToggle = $("#themeToggle");
    if (themeToggle) themeToggle.addEventListener("click", toggleColor);

    const upgradeBtn = $("#upgradeBtn");
    if (upgradeBtn) upgradeBtn.addEventListener("click", openModal);

    const modal = $("#modal");
    if (modal){
      modal.addEventListener("click", (e) => {
        const t = e.target;
        if (t && t.dataset && t.dataset.close === "1") closeModal();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.hidden) closeModal();
      });
    }

    const resetBtn = $("#resetBtn");
    if (resetBtn) resetBtn.addEventListener("click", resetToDemo);
  }

  load();
  bind();
  syncInputs();
  renderAll();
})();