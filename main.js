// Estado geral
const state = {
  energy: null,
  tasks: [],
  focusSessions: [],
  moodHistory: [0, 0, 0, 0, 0, 0, 0],
  studyQueue: [],
  finance: [],
};

let focusTimerId = null;
let focusRemaining = 0;



// ===== BACKEND API (NEURA OS) =====
const API_BASE = "https://neura-os-backend.onrender.com";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API GET ${path} falhou com status ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    throw new Error(`API POST ${path} falhou com status ${res.status}`);
  }
  return res.json();
}

async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    throw new Error(`API PATCH ${path} falhou com status ${res.status}`);
  }
  return res.json();
}

// ===== FIM BACKEND API =====

// Tema (dark / light)
function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.textContent = theme === "dark" ? "Dark" : "Light";
  }
  try {
    localStorage.setItem("neuraTheme", theme);
  } catch (e) {}
}

function setupThemeToggle() {
  let initial = "dark";
  try {
    const stored = localStorage.getItem("neuraTheme");
    if (stored === "light" || stored === "dark") {
      initial = stored;
    }
  } catch (e) {}
  applyTheme(initial);

  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
  });
}

// Helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Topbar date
function setupTopbarDate() {
  const el = $("#topbar-date");
  if (!el) return;
  const now = new Date();
  const formatted = now.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  el.textContent = formatted;
}

// Navegação
function setupNavigation() {
  const navs = $$(".nav-item");
  const views = $$(".view");

  navs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      navs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      views.forEach((v) => v.classList.remove("view-active"));
      const target = document.getElementById(`view-${view}`);
      if (target) target.classList.add("view-active");
    });
  });

  // botões que pulam para outra view
  document.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.jump;
      const nav = document.querySelector(`.nav-item[data-view="${view}"]`);
      if (nav) nav.click();
    });
  });
}

// ENERGY ENGINE
function calculateEnergy({ sleep, training, focus, nutrition }) {
  const sleepScore = (() => {
    if (sleep <= 0) return 20;
    if (sleep >= 8) return 100;
    if (sleep >= 6.5) return 85;
    if (sleep >= 5.5) return 70;
    return 50;
  })();

  const trainingScore = (training / 10) * 100;
  const focusScore = (focus / 10) * 100;
  const nutritionScore = (nutrition / 10) * 100;

  const energy =
    sleepScore * 0.35 +
    trainingScore * 0.2 +
    focusScore * 0.25 +
    nutritionScore * 0.2;

  return Math.round(Math.max(0, Math.min(100, energy)));
}

function energyLabel(energy) {
  if (energy == null) return "Sem dados para hoje.";
  if (energy < 35) return "Energia baixa · Dia bom para tarefas leves e revisão.";
  if (energy < 65) return "Energia moderada · Misture tarefas médias com pequenas entregas.";
  if (energy < 85) return "Energia alta · Ideal para estudo profundo e freelas complexos.";
  return "Energia máxima · Excelente para projetos de alto impacto.";
}

function updateEnergyUI() {
  const energy = state.energy;
  const percent = energy == null ? 0 : energy;

  const barDash = $("#dash-energy-bar");
  const barProd = $("#prod-energy-bar");
  const dashVal = $("#dash-energy-value");
  const prodVal = $("#prod-energy-value");
  const dashLbl = $("#dash-energy-label");
  const prodLbl = $("#prod-energy-label");
  const sidebarEnergy = $("#sidebar-energy");

  if (barDash) barDash.style.width = percent + "%";
  if (barProd) barProd.style.width = percent + "%";
  if (dashVal) dashVal.textContent = energy == null ? "–" : energy;
  if (prodVal) prodVal.textContent = energy == null ? "–" : energy;
  if (dashLbl) dashLbl.textContent = energyLabel(energy);
  if (prodLbl) prodLbl.textContent = energyLabel(energy);
  if (sidebarEnergy) sidebarEnergy.textContent = energy == null ? "–" : energy;
}

function setupEnergyForm() {
  const form = $("#energy-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const sleep = parseFloat($("#sleep-hours").value || "0");
    const training = parseFloat($("#training-level").value || "0");
    const focus = parseFloat($("#focus-level").value || "0");
    const nutrition = parseFloat($("#nutrition-level").value || "0");

    const energy = calculateEnergy({ sleep, training, focus, nutrition });
    state.energy = energy;
    updateEnergyUI();

    const summary = $("#prod-energy-summary");
    if (summary) {
      summary.textContent = `Sua energia hoje está em ${energy}/100. O sistema usará esse valor para priorizar tarefas, estudos e compromissos financeiros.`;
    }

    renderMiniTaskMap();
    renderPsychInsights();
  });
}

// FOCUS MODE
function setupFocusMode() {
  const startBtn = $("#focus-start");
  const stopBtn = $("#focus-stop");
  const sessionBox = $("#focus-session");
  const timerEl = $("#focus-timer");
  const titleEl = $("#focus-session-title");
  const energyLive = $("#focus-energy-live");

  if (!startBtn || !stopBtn || !sessionBox) return;

  startBtn.addEventListener("click", () => {
    const title = $("#focus-task").value.trim() || "Sessão de foco";
    const duration = parseInt($("#focus-duration").value || "25", 10);
    if (!duration || duration <= 0) return;

    focusRemaining = duration * 60;
    titleEl.textContent = title;
    timerEl.textContent = formatTime(focusRemaining);
    energyLive.textContent = state.energy == null ? "–" : state.energy;
    sessionBox.classList.remove("focus-hidden");

    if (focusTimerId) clearInterval(focusTimerId);
    focusTimerId = setInterval(() => {
      focusRemaining--;
      if (focusRemaining <= 0) {
        clearInterval(focusTimerId);
        focusTimerId = null;
        timerEl.textContent = "00:00";
        registerFocusSession(title, duration);
        sessionBox.classList.add("focus-hidden");
      } else {
        timerEl.textContent = formatTime(focusRemaining);
      }
    }, 1000);
  });

  stopBtn.addEventListener("click", () => {
    if (focusTimerId) {
      clearInterval(focusTimerId);
      focusTimerId = null;
    }
    const total = parseInt($("#focus-duration").value || "25", 10);
    const elapsed = Math.max(1, Math.round(total - focusRemaining / 60));
    const title = $("#focus-session-title").textContent || "Sessão de foco";
    registerFocusSession(title, elapsed);
    sessionBox.classList.add("focus-hidden");
  });
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function registerFocusSession(title, minutes) {
  const energyStart = state.energy;
  const energyEnd =
    energyStart == null ? null : Math.max(0, Math.min(100, energyStart - minutes * 0.25));

  state.focusSessions.unshift({
    title,
    minutes,
    energyStart,
    energyEnd,
    date: new Date().toISOString(),
  });
  if (state.focusSessions.length > 20) state.focusSessions.length = 20;

  // Atualiza humor básico
  if (minutes >= 25) {
    shiftMood(1);
  } else if (minutes >= 10) {
    shiftMood(0);
  } else {
    shiftMood(-1);
  }

  renderFocusHistory();
  renderMoodLines();
  renderPsychInsights();
}

function renderFocusHistory() {
  const list = $("#focus-history-list");
  if (!list) return;
  list.innerHTML = "";

  if (!state.focusSessions.length) {
    const li = document.createElement("li");
    li.className = "list-item";
    li.textContent = "Nenhuma sessão registrada ainda.";
    list.appendChild(li);
    return;
  }

  state.focusSessions.slice(0, 6).forEach((s) => {
    const li = document.createElement("li");
    li.className = "list-item";

    const title = document.createElement("div");
    title.textContent = s.title;
    const meta = document.createElement("div");
    meta.style.fontSize = "0.75rem";
    meta.style.color = "#9ca3af";
    meta.textContent = `${s.minutes} min · Energia ${s.energyStart ?? "–"} → ${
      s.energyEnd ?? "–"
    }`;

    li.appendChild(title);
    li.appendChild(meta);
    list.appendChild(li);
  });
}

// HUMOR
function shiftMood(value) {
  state.moodHistory.shift();
  state.moodHistory.push(value);
}

function moodString() {
  const map = { "-1": "_", 0: "-", 1: "^" };
  return state.moodHistory.map((v) => map[v]).join(" ");
}

function renderMoodLines() {
  const str = moodString();
  const dash = $("#dash-mood");
  const psych = $("#psych-mood");
  if (dash) dash.textContent = str;
  if (psych) psych.textContent = str;
}

// ESTUDOS
function setupStudy() {
  const form = $("#study-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const topic = $("#study-topic").value.trim();
    const duration = parseInt($("#study-duration").value || "40", 10);
    if (!topic || !duration) return;

    state.studyQueue.push({
      topic,
      duration,
      createdAt: new Date().toISOString(),
    });
    if (state.studyQueue.length > 12) state.studyQueue.shift();
    $("#study-topic").value = "";
    renderStudyQueue();
  });
}

function renderStudyQueue() {
  const list = $("#study-queue");
  if (!list) return;
  list.innerHTML = "";

  if (!state.studyQueue.length) {
    const li = document.createElement("li");
    li.className = "list-item";
    li.textContent = "Nenhum bloco de estudo adicionado.";
    list.appendChild(li);
    return;
  }

  state.studyQueue.forEach((b) => {
    const li = document.createElement("li");
    li.className = "list-item";
    const title = document.createElement("div");
    title.textContent = b.topic;
    const meta = document.createElement("div");
    meta.style.fontSize = "0.75rem";
    meta.style.color = "#9ca3af";
    meta.textContent = `${b.duration} min · ideal para momento de energia média/alta`;
    li.appendChild(title);
    li.appendChild(meta);
    list.appendChild(li);
  });
}

// FINANCEIRO
function setupFinance() {
  const form = $("#finance-form");
  const goalForm = $("#goal-form");
  if (!form || !goalForm) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const type = $("#finance-type").value;
    const desc = $("#finance-desc").value.trim();
    const value = parseFloat($("#finance-value").value || "0");
    if (!desc || !value) return;

    state.finance.unshift({
      type,
      desc,
      value,
      date: new Date().toISOString(),
    });
    if (state.finance.length > 60) state.finance.length = 60;

    $("#finance-desc").value = "";
    $("#finance-value").value = "";
    renderFinanceList();
    renderFinanceSummary();
  });

  goalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const rawGoal = $("#goal-value").value;
    const rawDate = $("#goal-deadline").value;
    const resultEl = $("#goal-result");
    if (!rawGoal || !rawDate || !resultEl) return;

    const goal = parseFloat(rawGoal || "0");
    if (!goal) return;

    const now = new Date();
    const end = new Date(rawDate);
    const diffMonths =
      (end.getFullYear() - now.getFullYear()) * 12 +
      (end.getMonth() - now.getMonth()) +
      1;

    if (diffMonths <= 0) {
      resultEl.textContent =
        "Defina um prazo futuro para calcular o plano financeiro.";
      return;
    }

    const perMonth = goal / diffMonths;
    resultEl.textContent = `Para alcançar ${formatCurrency(
      goal
    )} até ${end.toLocaleDateString(
      "pt-BR"
    )}, será necessário gerar em média ${formatCurrency(
      perMonth
    )} por mês com design e outras fontes.`;
  });
}

function renderFinanceList() {
  const list = $("#finance-list");
  if (!list) return;
  list.innerHTML = "";

  if (!state.finance.length) {
    const li = document.createElement("li");
    li.className = "list-item";
    li.textContent = "Nenhum lançamento financeiro registrado.";
    list.appendChild(li);
    return;
  }

  state.finance.slice(0, 8).forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-item";
    const title = document.createElement("div");
    title.textContent = item.desc;
    const meta = document.createElement("div");
    meta.style.fontSize = "0.75rem";
    meta.style.color = "#9ca3af";
    meta.textContent = `${item.type === "entrada" ? "Entrada" : "Saída"} · ${formatCurrency(
      item.value
    )}`;
    li.appendChild(title);
    li.appendChild(meta);
    list.appendChild(li);
  });
}

function renderFinanceSummary() {
  const totalIn = state.finance
    .filter((f) => f.type === "entrada")
    .reduce((s, f) => s + f.value, 0);
  const totalOut = state.finance
    .filter((f) => f.type === "saida")
    .reduce((s, f) => s + f.value, 0);
  const balance = totalIn - totalOut;

  $("#finance-in").textContent = formatCurrency(totalIn);
  $("#finance-out").textContent = formatCurrency(totalOut);
  $("#finance-balance").textContent = formatCurrency(balance);
}

// TAREFAS
function setupTasks() {
  const form = $("#task-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("#task-title").value.trim();
    const urgency = parseInt($("#task-urgency").value || "0", 10);
    const effort = parseInt($("#task-effort").value || "0", 10);
    const impact = parseInt($("#task-impact").value || "0", 10);
    const date = $("#task-date").value || null;
    const time = $("#task-time").value || null;
    const category = $("#task-category").value || "pessoal";

    if (!title) return;

    const weight = Math.round((urgency + effort + impact) / 3);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

    state.tasks.unshift({
      id,
      title,
      urgency,
      effort,
      impact,
      weight,
      date,
      time,
      category,
      done: false,
    });
    if (state.tasks.length > 40) state.tasks.length = 40;

    form.reset();
    renderTaskList();
    renderTaskMap();
    renderMiniTaskMap();
    renderPsychInsights();
  });
}

function renderTaskList() {
  const list = $("#task-list");
  if (!list) return;
  list.innerHTML = "";

  if (!state.tasks.length) {
    const li = document.createElement("li");
    li.className = "list-item";
    li.textContent =
      "Nenhuma tarefa cadastrada ainda. Comece adicionando algo que você precisa fazer hoje.";
    list.appendChild(li);
    return;
  }

  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const main = document.createElement("div");
    main.className = "task-main";
    const tTitle = document.createElement("div");
    tTitle.className = "task-title";
    tTitle.textContent = task.title;
    if (task.done) {
      tTitle.style.opacity = "0.5";
      tTitle.style.textDecoration = "line-through";
    }
    const meta = document.createElement("div");
    meta.className = "task-meta";
    const deadline =
      task.date || task.time
        ? `Prazo: ${task.date || ""} ${task.time || ""}`.trim()
        : "Sem prazo";
    meta.textContent = `${deadline} · ${task.category}`;
    main.appendChild(tTitle);
    main.appendChild(meta);

    const tags = document.createElement("div");
    tags.className = "task-tags";

    const tagUrg = document.createElement("span");
    tagUrg.className = "tag" + (task.urgency >= 7 ? " tag-urgent" : "");
    tagUrg.textContent = `Urgência ${task.urgency}`;

    const tagEff = document.createElement("span");
    tagEff.className = "tag";
    tagEff.textContent = `Esforço ${task.effort}`;

    const tagImp = document.createElement("span");
    tagImp.className = "tag";
    tagImp.textContent = `Impacto ${task.impact}`;

    const tagWeight = document.createElement("span");
    tagWeight.className = "tag tag-weight";
    tagWeight.textContent = `Peso ${task.weight}`;

    tags.appendChild(tagUrg);
    tags.appendChild(tagEff);
    tags.appendChild(tagImp);
    tags.appendChild(tagWeight);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn-ghost";
    toggleBtn.textContent = task.done ? "Reabrir" : "Concluir";
    toggleBtn.addEventListener("click", () => {
      task.done = !task.done;
      renderTaskList();
      renderMiniTaskMap();
      renderPsychInsights();
    });
    actions.appendChild(toggleBtn);

    li.appendChild(main);
    li.appendChild(tags);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

function renderTaskMap() {
  const map = $("#task-map");
  if (!map) return;
  map.innerHTML = "";

  if (!state.tasks.length) {
    const msg = document.createElement("div");
    msg.style.color = "#9ca3af";
    msg.style.fontSize = "0.8rem";
    msg.style.textAlign = "center";
    msg.style.padding = "1rem";
    msg.textContent =
      "As tarefas aparecerão aqui como nós neurais, com tamanho proporcional ao peso (urgência + esforço + impacto).";
    map.appendChild(msg);
    return;
  }

  const width = map.clientWidth || 320;
  const height = map.clientHeight || 320;
  const padding = 40;
  const count = state.tasks.length;
  const radius = Math.min(width, height) / 2 - padding;

  state.tasks.forEach((task, i) => {
    const node = document.createElement("div");
    node.className = "task-node";

    const normWeight = Math.max(1, task.weight || 1);
    const size = 20 + (normWeight / 10) * 40;
    node.style.width = size + "px";
    node.style.height = size + "px";

    const angle = (i / count) * Math.PI * 2;
    const cx = width / 2 + Math.cos(angle) * radius * 0.7;
    const cy = height / 2 + Math.sin(angle) * radius * 0.7;

    node.style.left = cx - size / 2 + "px";
    node.style.top = cy - size / 2 + "px";
    node.textContent = normWeight;

    map.appendChild(node);
  });
}

function renderMiniTaskMap() {
  const mini = $("#mini-task-map");
  if (!mini) return;
  mini.innerHTML = "";

  const totalEl = $("#mini-tasks-total");
  const urgEl = $("#mini-tasks-urgent");
  const doneEl = $("#mini-tasks-done");

  const today = todayISO();
  const todays = state.tasks.filter((t) => !t.date || t.date === today);
  const urgent = todays.filter((t) => t.urgency >= 7 && !t.done);
  const done = todays.filter((t) => t.done);

  if (totalEl) totalEl.textContent = todays.length;
  if (urgEl) urgEl.textContent = urgent.length;
  if (doneEl) doneEl.textContent = done.length;

  if (!todays.length) {
    const span = document.createElement("span");
    span.style.fontSize = "0.78rem";
    span.style.color = "#9ca3af";
    span.textContent = "Nenhuma tarefa cadastrada para hoje.";
    mini.appendChild(span);
    return;
  }

  todays.forEach((t) => {
    const dot = document.createElement("div");
    const size = 8 + t.weight * 0.6;
    dot.style.width = size + "px";
    dot.style.height = size + "px";
    dot.style.borderRadius = "999px";
    dot.style.boxShadow = "0 0 12px rgba(0, 248, 253, 0.6)";
    dot.style.background =
      t.done === true
        ? "rgba(34,197,94,0.95)"
        : t.urgency >= 7
        ? "rgba(248,113,113,0.95)"
        : "rgba(56,189,248,0.95)";
    mini.appendChild(dot);
  });
}

// PSICÓLOGO
function setupPsychologist() {
  const log = $("#psych-log");
  const form = $("#psych-form");
  const input = $("#psych-message");
  if (!log || !form || !input) return;

  appendPsychMessage(
    "bot",
    "Olá, eu sou o Psicólogo do NEURA OS. Me conte brevemente como foi seu dia que eu interpreto dentro do contexto de energia, foco e tarefas."
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendPsychMessage("user", text);
    input.value = "";

    setTimeout(() => {
      const response = buildPsychResponse(text);
      appendPsychMessage("bot", response);
      renderPsychInsights();
    }, 350);
  });
}

function appendPsychMessage(sender, text) {
  const log = $("#psych-log");
  if (!log) return;
  const msg = document.createElement("div");
  msg.className = "chat-msg " + sender;
  msg.textContent = text;
  log.appendChild(msg);
  log.scrollTop = log.scrollHeight;
}

function buildPsychResponse(text) {
  const energy = state.energy;
  const openTasks = state.tasks.filter((t) => !t.done);
  const urgent = openTasks.filter((t) => t.urgency >= 7);
  const longFocus = state.focusSessions.filter((s) => s.minutes >= 25);

  let base =
    "Obrigado por compartilhar. Vou considerar o que você descreveu junto com seus dados de energia, sessões de foco e tarefas. ";

  if (energy != null) {
    if (energy < 40) {
      base +=
        "Sua energia está baixa hoje, então é importante reduzir a cobrança interna e priorizar tarefas curtas e simples. ";
    } else if (energy < 70) {
      base +=
        "Sua energia está moderada, o que é bom para equilibrar coisas operacionais com alguma tarefa mais profunda. ";
    } else {
      base +=
        "Sua energia está alta, esse é um ótimo momento para avançar em algo que você vem adiando há um tempo. ";
    }
  }

  if (urgent.length) {
    base += `Percebo que existem ${urgent.length} tarefa(s) com urgência alta acumuladas. Selecione apenas uma ou duas para serem o foco principal do dia, em vez de tentar resolver tudo de uma vez. `;
  }

  if (longFocus.length) {
    base +=
      "Você já realizou sessões de foco consistentes recentemente, o que mostra disciplina. Use esse histórico como prova de que você consegue entrar em estado de concentração novamente. ";
  }

  base +=
    "Se possível, faça uma pausa curta, respire fundo e escolha conscientemente qual será o próximo passo de hoje, em vez de entrar no piloto automático.";

  return base;
}

function renderPsychInsights() {
  const list = $("#psych-insights");
  if (!list) return;
  list.innerHTML = "";

  const energy = state.energy;
  const openTasks = state.tasks.filter((t) => !t.done);
  const urgent = openTasks.filter((t) => t.urgency >= 7);
  const longFocus = state.focusSessions.filter((s) => s.minutes >= 25);

  if (energy != null) {
    const li = document.createElement("li");
    li.textContent =
      energy < 40
        ? "Energia baixa detectada: organize o dia com tarefas curtas e revisões, evitando decisões pesadas."
        : energy < 70
        ? "Energia moderada: bom momento para mesclar tarefas operacionais com um bloco de estudo ou projeto."
        : "Energia alta: momento ideal para puxar um projeto importante ou estudar conteúdo difícil.";
    list.appendChild(li);
  }

  if (urgent.length) {
    const li = document.createElement("li");
    li.textContent = `Existem ${urgent.length} tarefas com urgência alta pendentes. Sugestão: defina no máximo 3 como prioridade de hoje.`;
    list.appendChild(li);
  }

  if (longFocus.length) {
    const li = document.createElement("li");
    li.textContent = `Foram registradas ${longFocus.length} sessão(ões) de foco profundo. Aproveite esse padrão para criar uma rotina fixa de horário de estudo.`;
    list.appendChild(li);
  }

  if (!list.children.length) {
    const li = document.createElement("li");
    li.textContent =
      "Sem dados suficientes. Registre sua energia, use o Focus Mode e adicione tarefas para que eu possa gerar insights mais precisos.";
    list.appendChild(li);
  }
}


// ===== OVERRIDES COM BACKEND =====

// Energy form integrado ao backend
function setupEnergyForm() {
  const form = $("#energy-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const sleep = parseFloat($("#sleep-hours")?.value || "0");
    const training = parseFloat($("#training-level")?.value || "0");
    const focus = parseFloat($("#focus-level")?.value || "0");
    const nutrition = parseFloat($("#nutrition-level")?.value || "0");

    try {
      const data = await apiPost("/api/energy/calculate", {
        sleep,
        training,
        focus,
        nutrition,
      });
      const energy = data && typeof data.energy === "number" ? data.energy : null;
      state.energy = energy;
      updateEnergyUI();

      const summary = $("#prod-energy-summary");
      if (summary && energy != null) {
        const label = data && data.label ? data.label : "";
        summary.textContent = `Sua energia hoje está em ${energy}/100. ${label}`;
      }
    } catch (err) {
      console.error("Erro ao calcular energia no backend, usando fallback local.", err);
      const energy = calculateEnergy({ sleep, training, focus, nutrition });
      state.energy = energy;
      updateEnergyUI();
    }

    renderMiniTaskMap();
    renderPsychInsights();
  });
}

// Tarefas integradas ao backend
async function syncTasksFromBackend() {
  try {
    const tasks = await apiGet("/api/tasks");
    if (Array.isArray(tasks)) {
      state.tasks = tasks;
    }
  } catch (err) {
    console.error("Erro ao carregar tarefas do backend.", err);
  }
}

function setupTasks() {
  const form = $("#task-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = $("#task-title").value.trim();
      const urgency = parseInt($("#task-urgency").value || "0", 10);
      const effort = parseInt($("#task-effort").value || "0", 10);
      const impact = parseInt($("#task-impact").value || "0", 10);
      const date = $("#task-date").value || null;
      const time = $("#task-time").value || null;
      const category = $("#task-category").value || "pessoal";

      if (!title) return;

      const payload = { title, urgency, effort, impact, date, time, category };

      try {
        const created = await apiPost("/api/tasks", payload);
        state.tasks.unshift(created);
        if (state.tasks.length > 40) state.tasks.length = 40;
      } catch (err) {
        console.error("Erro ao criar tarefa no backend, usando fallback local.", err);
        const weight = Math.round((urgency + effort + impact) / 3);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        state.tasks.unshift({
          id,
          title,
          urgency,
          effort,
          impact,
          weight,
          date,
          time,
          category,
          done: false,
        });
        if (state.tasks.length > 40) state.tasks.length = 40;
      }

      form.reset();
      renderTaskList();
      renderTaskMap();
      renderMiniTaskMap();
      renderPsychInsights();
    });
  }

  // Carrega tarefas existentes
  syncTasksFromBackend().then(() => {
    renderTaskList();
    renderTaskMap();
    renderMiniTaskMap();
    renderPsychInsights();
  });
}

// Lista de tarefas com toggle integrado ao backend
function renderTaskList() {
  const list = $("#task-list");
  if (!list) return;
  list.innerHTML = "";

  if (!state.tasks.length) {
    const li = document.createElement("li");
    li.className = "list-item";
    li.textContent =
      "Nenhuma tarefa cadastrada ainda. Comece adicionando algo que você precisa fazer hoje.";
    list.appendChild(li);
    return;
  }

  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const main = document.createElement("div");
    main.className = "task-main";
    const tTitle = document.createElement("div");
    tTitle.className = "task-title";
    tTitle.textContent = task.title;
    if (task.done) {
      tTitle.style.opacity = "0.5";
      tTitle.style.textDecoration = "line-through";
    }
    const meta = document.createElement("div");
    meta.className = "task-meta";
    const deadline =
      task.date || task.time
        ? `Prazo: ${task.date || ""} ${task.time || ""}`.trim()
        : "Sem prazo";
    meta.textContent = `${deadline} · ${task.category}`;
    main.appendChild(tTitle);
    main.appendChild(meta);

    const tags = document.createElement("div");
    tags.className = "task-tags";

    const tagUrg = document.createElement("span");
    tagUrg.className = "tag" + (task.urgency >= 7 ? " tag-urgent" : "");
    tagUrg.textContent = `Urgência ${task.urgency}`;

    const tagEff = document.createElement("span");
    tagEff.className = "tag";
    tagEff.textContent = `Esforço ${task.effort}`;

    const tagImp = document.createElement("span");
    tagImp.className = "tag";
    tagImp.textContent = `Impacto ${task.impact}`;

    const tagWeight = document.createElement("span");
    tagWeight.className = "tag tag-weight";
    tagWeight.textContent = `Peso ${task.weight}`;

    tags.appendChild(tagUrg);
    tags.appendChild(tagEff);
    tags.appendChild(tagImp);
    tags.appendChild(tagWeight);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn-ghost";
    toggleBtn.textContent = task.done ? "Reabrir" : "Concluir";
    toggleBtn.addEventListener("click", async () => {
      const original = task.done;
      task.done = !task.done;
      renderTaskList();
      renderMiniTaskMap();
      renderPsychInsights();

      try {
        if (task.id) {
          await apiPatch(`/api/tasks/${encodeURIComponent(task.id)}/toggle`);
        }
      } catch (err) {
        console.error("Erro ao alternar tarefa no backend, revertendo estado local.", err);
        task.done = original;
        renderTaskList();
        renderMiniTaskMap();
        renderPsychInsights();
      }
    });
    actions.appendChild(toggleBtn);

    li.appendChild(main);
    li.appendChild(tags);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

// Focus sessions integradas ao backend
async function syncFocusSessionsFromBackend() {
  try {
    const sessions = await apiGet("/api/focus-sessions");
    if (Array.isArray(sessions)) {
      state.focusSessions = sessions;
    }
  } catch (err) {
    console.error("Erro ao carregar sessões de foco do backend.", err);
  }
}

async function registerFocusSession(title, minutes) {
  const energyStart = state.energy == null ? null : state.energy;

  try {
    const created = await apiPost("/api/focus-sessions", {
      title,
      minutes,
      energyStart,
    });
    state.focusSessions.unshift(created);
    if (state.focusSessions.length > 20) state.focusSessions.length = 20;
  } catch (err) {
    console.error("Erro ao registrar sessão de foco no backend, usando fallback local.", err);
    const energyEnd =
      energyStart == null ? null : Math.max(0, Math.min(100, energyStart - minutes * 0.25));

    state.focusSessions.unshift({
      title,
      minutes,
      energyStart,
      energyEnd,
      date: new Date().toISOString(),
    });
    if (state.focusSessions.length > 20) state.focusSessions.length = 20;
  }

  if (minutes >= 25) {
    shiftMood(1);
  } else if (minutes >= 10) {
    shiftMood(0);
  } else {
    shiftMood(-1);
  }

  renderFocusHistory();
  renderMoodLines();
  renderPsychInsights();
}

// Psicólogo integrado ao backend
function setupPsychologist() {
  const log = $("#psych-log");
  const form = $("#psych-form");
  const input = $("#psych-message");
  if (!log || !form || !input) return;

  appendPsychMessage(
    "bot",
    "Olá, eu sou o Psicólogo do NEURA OS. Me conte brevemente como você está e o que está pegando hoje que eu interpreto dentro do contexto de energia, foco e tarefas."
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendPsychMessage("user", text);
    input.value = "";
    input.focus();

    try {
      const data = await apiPost("/api/psychologist/message", {
        text,
        energy: state.energy,
      });
      const reply =
        data && data.reply
          ? data.reply
          : "Não consegui acessar o módulo de psicólogo agora, mas tente escolher um próximo passo pequeno e concreto para hoje.";
      appendPsychMessage("bot", reply);
    } catch (err) {
      console.error("Erro no psicólogo backend.", err);
      appendPsychMessage(
        "bot",
        "Tive um problema técnico para interpretar com o módulo de psicólogo agora. Mas lembre-se: reduza a autocobrança e escolha uma única tarefa viável para concluir hoje."
      );
    }

    renderPsychInsights();
  });
}

// Integração simples com endpoint mock de Google Fit / Mi Band
function setupGoogleFitBackend() {
  const btn = document.getElementById("fit-simulate-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      const data = await apiGet("/api/google-fit/mock");
      console.log("Google Fit (mock)", data);

      const sleepInput = document.getElementById("sleep-hours");
      if (sleepInput && typeof data.sleepHours === "number") {
        sleepInput.value = data.sleepHours.toFixed(1);
      }

      const info = document.getElementById("fit-last-sync");
      if (info) {
        info.textContent = `BPM ${data.heartRate} · Sono ${data.sleepHours}h · Passos ${data.steps}`;
      }
    } catch (err) {
      console.error("Erro ao consultar Google Fit mock.", err);
    }
  });
}

// Inicialização extra para carregar dados do backend
document.addEventListener("DOMContentLoaded", () => {
  syncTasksFromBackend()
    .then(renderTaskList)
    .catch(() => {});
  syncFocusSessionsFromBackend()
    .then(() => {
      renderFocusHistory();
      renderMoodLines();
      renderPsychInsights();
    })
    .catch(() => {});
  setupGoogleFitBackend();
});

// ===== FIM OVERRIDES BACKEND =====

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  // Simulação de conexão com API Google Fit (front-end apenas)
  const fitBtn = document.getElementById("fit-simulate-btn");
  if (fitBtn) {
    fitBtn.addEventListener("click", () => {
      const pillMain = document.getElementById("fit-connection-pill");
      const labelMain = document.getElementById("fit-connection-label");
      const pillSide = document.getElementById("fit-connection-pill-sidebar");
      const labelSide = document.getElementById("fit-connection-label-sidebar");

      const connected =
        pillMain && pillMain.classList.contains("connected");

      if (!connected) {
        if (pillMain) pillMain.classList.add("connected");
        if (labelMain) labelMain.textContent = "Conectado (simulado)";
        if (pillSide) pillSide.classList.add("connected");
        if (labelSide) labelSide.textContent = "Conectado (simulado)";
      } else {
        if (pillMain) pillMain.classList.remove("connected");
        if (labelMain) labelMain.textContent = "Desconectado";
        if (pillSide) pillSide.classList.remove("connected");
        if (labelSide) labelSide.textContent = "Desconectado";
      }
    });
  }

  setupTopbarDate();
  setupNavigation();
  setupEnergyForm();
  setupFocusMode();
  setupStudy();
  setupFinance();
  setupTasks();
  setupPsychologist();

  updateEnergyUI();
  renderFocusHistory();
  renderMoodLines();
  renderStudyQueue();
  renderFinanceList();
  renderFinanceSummary();
  renderTaskList();
  renderTaskMap();
  renderMiniTaskMap();
  renderPsychInsights();
});
