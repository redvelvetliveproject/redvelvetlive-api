// ============================================
// 🌹 REDVELVETLIVE — PANEL ADMIN JS (PRO FINAL)
// ============================================

// 🌍 API BASE
const API = location.origin.includes("localhost")
  ? "http://localhost:4000/api"
  : location.origin + "/api";

const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ============================================
// 🧭 UTILIDADES
// ============================================
function toast(msg, type = "info") {
  const el = $("#toast");
  el.textContent = msg;
  el.style.background =
    type === "ok" ? "#16a34a" : type === "err" ? "#ef4444" : "#2563eb";
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

function fmtDate(d) {
  return new Date(d).toLocaleString("es-CO", { hour12: false });
}

function badge(status) {
  const s = (status || "").toUpperCase();
  const map = {
    PENDING: "b-pending",
    PROCESSING: "b-warn",
    CONFIRMED: "b-ok",
    FAILED: "b-err",
    CANCELLED: "b-err",
  };
  return `<span class="badge ${map[s] || "b-pending"}">${s}</span>`;
}

// ============================================
// 🔐 AUTENTICACIÓN ADMIN
// ============================================
const loginView = $("#loginView");
const panelView = $("#panelView");

async function verifySession() {
  try {
    const res = await fetch(API + "/admin/verify", { credentials: "include" });
    const data = await res.json();
    if (data.success) showPanel();
  } catch {}
}

function showPanel() {
  loginView.classList.add("hidden");
  panelView.classList.remove("hidden");
  loadOrders();
}

$("#loginBtn").onclick = async () => {
  const email = $("#email").value.trim();
  const key = $("#key").value.trim();
  if (!email || !key) return toast("Campos incompletos", "err");

  try {
    const res = await fetch(API + "/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, key }),
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      toast("Bienvenido " + data.admin.email, "ok");
      showPanel();
    } else toast(data.message || "Acceso denegado", "err");
  } catch {
    toast("Error de conexión", "err");
  }
};

$("#logoutBtn").onclick = async () => {
  await fetch(API + "/admin/logout", { method: "POST", credentials: "include" });
  panelView.classList.add("hidden");
  loginView.classList.remove("hidden");
  toast("Sesión cerrada", "ok");
};

// ============================================
// 🗂️ CONTROL DE TABS
// ============================================
const tabs = $$(".tab");
const tabPayments = $("#tab-payments");
const tabModels = $("#tab-models");

tabs.forEach((tab) => {
  tab.onclick = () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const name = tab.dataset.tab;

    if (name === "payments") {
      tabPayments.classList.remove("hidden");
      tabModels.classList.add("hidden");
      loadOrders();
    }
    if (name === "models") {
      tabModels.classList.remove("hidden");
      tabPayments.classList.add("hidden");
      loadModels();
    }
  };
});

// ============================================
// 💰 PAGOS (ORDERS)
// ============================================
let pSkip = 0;

async function loadOrders() {
  const tbody = $("#ordersBody");
  const status = $("#pStatus").value;
  const type = $("#pType").value;
  const currency = $("#pCurrency").value;
  const limit = Number($("#pLimit").value || 25);

  const qs = new URLSearchParams({ limit, skip: pSkip });
  if (status) qs.append("status", status);
  if (type) qs.append("type", type);
  if (currency) qs.append("currency", currency);

  tbody.innerHTML = `<tr><td colspan="7" class="muted">Cargando…</td></tr>`;

  try {
    const res = await fetch(API + "/admin/payments/orders?" + qs.toString(), {
      credentials: "include",
    });
    const data = await res.json();
    if (!data.success) return toast("Error cargando órdenes", "err");

    tbody.innerHTML = "";
    data.data.forEach((o) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${fmtDate(o.createdAt)}</td>
        <td>${o.modelId?.name || "—"}</td>
        <td><b>${o.amount}</b></td>
        <td>${o.currency}</td>
        <td>${o.type}</td>
        <td>${badge(o.status)}</td>
        <td>${
          o.txHash
            ? `<a href='https://bscscan.com/tx/${o.txHash}' target='_blank'>${o.txHash.slice(
                0,
                10
              )}…</a>`
            : "—"
        }</td>
      `;
      tbody.appendChild(tr);
    });

    const start = data.count ? pSkip + 1 : 0;
    const end = pSkip + (data.data?.length || 0);
    $("#pInfo").textContent = `${start}–${end} de ${data.total || end}`;
    $("#pPrev").disabled = pSkip <= 0;
    $("#pNext").disabled = end >= (data.total || end);
  } catch {
    toast("Error cargando órdenes", "err");
  }
}

$("#pRefresh").onclick = () => {
  pSkip = 0;
  loadOrders();
};
$("#pPrev").onclick = () => {
  const lim = Number($("#pLimit").value || 25);
  pSkip = Math.max(0, pSkip - lim);
  loadOrders();
};
$("#pNext").onclick = () => {
  const lim = Number($("#pLimit").value || 25);
  pSkip += lim;
  loadOrders();
};

$("#runCron").onclick = async () => {
  try {
    const res = await fetch(API + "/admin/payments/cron/run", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    data.success ? toast("Cron ejecutado", "ok") : toast("Error al ejecutar", "err");
  } catch {
    toast("Error ejecutando cron", "err");
  }
};

$("#auditBtn").onclick = async () => {
  const tx = $("#txHash").value.trim();
  if (!tx) return toast("Ingresa hash", "err");
  try {
    const res = await fetch(API + "/admin/payments/audit/" + tx, {
      credentials: "include",
    });
    const data = await res.json();
    data.verified
      ? toast("Tx verificada ✅", "ok")
      : toast("No verificada", "warn");
  } catch {
    toast("Error auditando", "err");
  }
};

// ============================================
// 👩‍💼 MODELOS
// ============================================
let mSkip = 0;

async function loadModels() {
  const tbody = $("#modelsBody");
  const status = $("#mStatus").value;
  const q = $("#mQuery").value.trim();
  const limit = Number($("#mLimit").value || 25);

  const qs = new URLSearchParams({ limit, skip: mSkip });
  if (status) qs.append("status", status);
  if (q) qs.append("q", q);

  tbody.innerHTML = `<tr><td colspan="7" class="muted">Cargando…</td></tr>`;

  try {
    const res = await fetch(API + "/admin/models?" + qs.toString(), {
      credentials: "include",
    });
    const data = await res.json();
    if (!data.success) return toast("Error obteniendo modelos", "err");

    // KPIs
    const kpis = data.kpis || {};
    $("#mKpiActive").textContent = kpis.active ?? "—";
    $("#mKpiInactive").textContent = kpis.inactive ?? "—";
    $("#mKpiFeatured").textContent = kpis.featured ?? "—";
    $("#mKpiAmb").textContent = kpis.ambassador ?? "—";

    // tabla
    tbody.innerHTML = "";
    (data.data || []).forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.name || "—"}</td>
        <td>${m.country || "—"}</td>
        <td><code>${m.wallet?.slice(0, 10) || "—"}</code></td>
        <td>
          <select data-id="${m._id}" data-action="status">
            <option ${m.status === "ACTIVE" ? "selected" : ""}>ACTIVE</option>
            <option ${m.status === "INACTIVE" ? "selected" : ""}>INACTIVE</option>
            <option ${m.status === "BANNED" ? "selected" : ""}>BANNED</option>
          </select>
        </td>
        <td><input type="checkbox" data-id="${m._id}" data-field="featured" ${m.featured ? "checked" : ""}></td>
        <td><input type="checkbox" data-id="${m._id}" data-field="ambassador" ${m.ambassador ? "checked" : ""}></td>
        <td><button class="secondary" data-id="${m._id}" data-action="save">💾 Guardar</button></td>
      `;
      tbody.appendChild(tr);
    });

    const start = data.count ? mSkip + 1 : 0;
    const end = mSkip + (data.data?.length || 0);
    $("#mInfo").textContent = `${start}–${end} de ${data.total || end}`;
    $("#mPrev").disabled = mSkip <= 0;
    $("#mNext").disabled = end >= (data.total || end);

    // acciones
    tbody.onclick = async (e) => {
      const btn = e.target.closest("button");
      if (btn && btn.dataset.action === "save") {
        const id = btn.dataset.id;
        const status = tbody.querySelector(`select[data-id="${id}"]`).value;
        const featured = tbody.querySelector(`input[data-id="${id}"][data-field="featured"]`).checked;
        const ambassador = tbody.querySelector(`input[data-id="${id}"][data-field="ambassador"]`).checked;
        const ok1 = await updateModelStatus(id, status);
        const ok2 = await updateModelFeature(id, featured, ambassador);
        if (ok1 && ok2) toast("Modelo actualizado ✅", "ok");
        else toast("Error actualizando", "err");
      }
    };
  } catch {
    toast("Error cargando modelos", "err");
  }
}

$("#mRefresh").onclick = () => {
  mSkip = 0;
  loadModels();
};
$("#mPrev").onclick = () => {
  const lim = Number($("#mLimit").value || 25);
  mSkip = Math.max(0, mSkip - lim);
  loadModels();
};
$("#mNext").onclick = () => {
  const lim = Number($("#mLimit").value || 25);
  mSkip += lim;
  loadModels();
};

async function updateModelStatus(id, status) {
  try {
    const res = await fetch(API + "/admin/models/" + id + "/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

async function updateModelFeature(id, featured, ambassador) {
  try {
    const res = await fetch(API + "/admin/models/" + id + "/feature", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ featured, ambassador }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

// ============================================
// 🚀 INICIO AUTOMÁTICO
// ============================================
window.addEventListener("load", verifySession);
