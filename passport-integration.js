const PASSPORT_SITE_ID = "lwwf-chinese-idioms";
const PASSPORT_GRADE = "p5";
const PASSPORT_ORIGIN = "https://lwwf-learning-passport.lwwfaiteams.workers.dev";
const PASSPORT_SCHEMA_VERSION = "lwwf-progress/v2";
const PASSPORT_CONTENT_VERSION = "idiom-master-p5-2026.08-v1";
const PASSPORT_START_TASK_ID = "idiom-v1:start:p5";
const PASSPORT_MISSION_PREFIX = "idiom-v1:mission:";
const PASSPORT_TOTAL_TASKS = 5;

let currentUser = null;
let passportState = { ready: false, mode: "pending", readOnly: true, studentView: null };
let passportSaveStatus = "idle";
let passportProgressQueue = Promise.resolve();
let passportStartQueued = false;

function isReadOnlyPreview() {
  return passportState.mode === "teacher-preview"
    && passportState.readOnly === true
    && passportState.site?.id === PASSPORT_SITE_ID
    && String(passportState.grade || "").toLowerCase() === PASSPORT_GRADE
    && passportState.studentView?.synthetic === true
    && passportState.studentView?.readOnly === true;
}

function canPersistLearning() {
  return passportState.ready === true
    && passportState.mode === "student"
    && passportState.site?.id === PASSPORT_SITE_ID
    && String(passportState.grade || "").toLowerCase() === PASSPORT_GRADE
    && passportState.readOnly !== true
    && passportState.studentView?.synthetic !== true
    && passportState.studentView?.readOnly !== true;
}

async function waitForPassportSdk(timeoutMs = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (window.LWWFPassport?.init && window.LWWFPassport?.recordProgress) return window.LWWFPassport;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  return null;
}

function makeTeacherEvidence({ objectiveId, completed, score, accuracy, attempts, mistakes, skillsPracticed, needsSupport, supportUsed }) {
  return {
    schemaVersion: "teacher-evidence/v1",
    objectiveId,
    completed,
    score,
    accuracy,
    attempts,
    mistakes,
    skillsPracticed,
    needsSupport,
    supportUsed,
  };
}

function enqueueProgress(payload) {
  if (!canPersistLearning() || !window.LWWFPassport?.recordProgress) return Promise.resolve(null);
  passportProgressQueue = passportProgressQueue
    .catch(() => null)
    .then(async () => {
      passportSaveStatus = "saving";
      updateToolDebug();
      try {
        const result = await window.LWWFPassport.recordProgress(payload);
        passportSaveStatus = "recorded";
        return result;
      } catch (error) {
        passportSaveStatus = "error";
        return null;
      } finally {
        updateToolDebug();
      }
    });
  return passportProgressQueue;
}

function queuePassportStart() {
  if (!canPersistLearning() || passportStartQueued) return Promise.resolve(null);
  passportStartQueued = true;
  const objectiveId = "idiom-foundation";
  return enqueueProgress({
    taskId: PASSPORT_START_TASK_ID,
    taskTitle: "成語小博士：開始學習",
    completed: false,
    score: 0,
    coins: 0,
    metadata: {
      schemaVersion: PASSPORT_SCHEMA_VERSION,
      contentVersion: PASSPORT_CONTENT_VERSION,
      action: "start_learning",
      activityType: "idiom-learning-start",
      objectiveId,
      completedTasks: 0,
      totalTasks: PASSPORT_TOTAL_TASKS,
      attempts: 0,
      mistakes: 0,
      accuracy: 0,
      teacherEvidence: makeTeacherEvidence({
        objectiveId,
        completed: false,
        score: 0,
        accuracy: 0,
        attempts: 0,
        mistakes: 0,
        skillsPracticed: [],
        needsSupport: false,
        supportUsed: false,
      }),
    },
  });
}

async function initializePassportIdentity() {
  const status = document.getElementById("passportEntryStatus");
  const link = document.getElementById("passportEntryLink");
  const passport = await waitForPassportSdk();
  if (!passport) {
    if (status) status.textContent = "未能載入 Learning Passport 安全元件，請返回入口後重試。";
    updateToolDebug();
    return false;
  }

  try {
    const initialized = await passport.init({
      siteId: PASSPORT_SITE_ID,
      grade: PASSPORT_GRADE,
      passportOrigin: PASSPORT_ORIGIN,
      renderStatus: false,
      feedbackWidget: true,
    });
    passportState = passport.getState?.() || initialized || passportState;
    if (link && passportState.loginUrl) link.href = passportState.loginUrl;
    const studentView = passportState.studentView;
    if (!passportState.ready || !studentView) {
      if (status) status.textContent = "沒有可用的工作階段，請由 Learning Passport 選擇本站進入。";
      updateToolDebug();
      return false;
    }
    if (passportState.site?.id !== PASSPORT_SITE_ID || String(passportState.grade || "").toLowerCase() !== PASSPORT_GRADE) {
      throw new Error("Learning Passport 站點或年級範圍不正確。");
    }
    if (passportState.mode === "teacher-preview" && (
      passportState.readOnly !== true
      || studentView.synthetic !== true
      || studentView.readOnly !== true
    )) {
      throw new Error("巡堂身分不是合成唯讀資料，已停止載入。");
    }
    if (passportState.mode !== "student" && passportState.mode !== "teacher-preview") {
      throw new Error("Learning Passport 身分範圍不正確。");
    }
    if (passportState.mode === "student" && (
      passportState.readOnly === true
      || studentView.synthetic === true
      || studentView.readOnly === true
    )) {
      throw new Error("學生工作階段不可使用合成或唯讀身分。");
    }

    currentUser = {
      role: "student",
      class: String(studentView.classCode || ""),
      number: String(studentView.classNo || ""),
      name: String(studentView.displayName || (isReadOnlyPreview() ? "巡堂預覽學生" : "學生")),
      synthetic: studentView.synthetic === true,
      readOnly: passportState.readOnly === true,
    };
    document.getElementById("loginOverlay")?.classList.remove("active");
    const badge = document.getElementById("userBadge");
    const name = document.getElementById("userName");
    if (name) name.textContent = isReadOnlyPreview() ? "巡堂預覽學生" : currentUser.name;
    if (badge) badge.style.display = "";
    applyPassportModeUi();
    updateToolDebug();
    await queuePassportStart();
    return true;
  } catch (error) {
    passportState = { ready: false, mode: "login-required", readOnly: true, studentView: null };
    currentUser = null;
    if (status) status.textContent = "安全工作階段未能建立，請返回 Learning Passport 後重新進入。";
    updateToolDebug(error?.message || "Passport initialization failed");
    return false;
  }
}

function returnToPassport() {
  window.location.assign(passportState.loginUrl || PASSPORT_ORIGIN);
}

function logout() {
  returnToPassport();
}

function applyPassportModeUi() {
  const preview = isReadOnlyPreview();
  document.documentElement.dataset.passportMode = passportState.mode || "login-required";
  document.documentElement.dataset.passportReadOnly = String(preview);
  document.documentElement.dataset.passportSynthetic = String(Boolean(passportState.studentView?.synthetic));
  const banner = document.getElementById("previewBanner");
  if (banner) banner.hidden = !preview;
  const edx = document.querySelector(".stat-pill.edx");
  if (edx) {
    edx.setAttribute("aria-disabled", String(preview));
    edx.title = preview ? "教師巡堂模式不會進行積分交易" : "本次安全工作階段的模擬兌換";
  }
  for (const id of ["voiceMicBtn", "voiceSubmitBtn"]) {
    const control = document.getElementById(id);
    if (!control) continue;
    control.disabled = preview;
    control.dataset.readonlyDisabled = String(preview);
    if (preview) control.title = "教師巡堂模式不會使用麥克風或評分服務";
  }
}

function scheduleCloudSave() {
  updateToolDebug();
}

async function saveCloudProgress() {
  return queuePassportStart();
}

async function saveCloudActivity() {
  updateToolDebug();
  return null;
}

function recordMissionCompletion(mission, state) {
  if (!mission || !state?.done) return Promise.resolve(null);
  const completedTasks = [...missionState.values()].filter((item) => item.done).length;
  const attempts = Math.max(1, Number(state.attempts || 1));
  const mistakes = Math.max(0, attempts - 1);
  const accuracy = Math.max(0, Math.min(100, Math.round(100 / attempts)));
  const objectiveId = `idiom-${mission.id}`;
  const taskId = `${PASSPORT_MISSION_PREFIX}${mission.id}`;
  const skillsPracticed = [mission.skillId];
  const needsSupport = mistakes >= 2;
  return enqueueProgress({
    taskId,
    taskTitle: `成語任務章：${mission.title}`,
    completed: true,
    score: accuracy,
    coins: 0,
    metadata: {
      schemaVersion: PASSPORT_SCHEMA_VERSION,
      contentVersion: PASSPORT_CONTENT_VERSION,
      action: "complete_task",
      activityType: "idiom-mission",
      missionId: mission.id,
      objectiveId,
      completedTasks,
      totalTasks: PASSPORT_TOTAL_TASKS,
      attempts,
      mistakes,
      accuracy,
      teacherEvidence: makeTeacherEvidence({
        objectiveId,
        completed: true,
        score: accuracy,
        accuracy,
        attempts,
        mistakes,
        skillsPracticed,
        needsSupport,
        supportUsed: mistakes > 0,
      }),
    },
  });
}

async function loadCloudProgress() {
  refreshEdxState();
  updateToolDebug();
}

function openTeacherDashboard() {
  openModal(`
    <div style="max-width:620px;text-align:center;padding:14px">
      <h2 style="color:var(--red-dark);font-family:var(--font-han);margin-bottom:12px">教師巡堂唯讀沙盒</h2>
      <p style="line-height:1.8">本站不會在巡堂模式讀取全校名冊、真實學生進度或作品。教師可在目前頁面操作合成學生介面，所有變化只保留在記憶體。</p>
    </div>`);
}
async function loadTeacherData() {}
function renderTeacherTable() {}
function sortTd() {}

const EDX_TIERS = [
  { coins: 10, edx: 5, name: "🥉 基礎", cls: "tier-bronze" },
  { coins: 50, edx: 28, name: "🥈 超值", cls: "tier-silver" },
  { coins: 100, edx: 60, name: "🥇 進階", cls: "tier-gold" },
];
let edxSpent = 0;
let edxTotal = 0;

async function refreshEdxState() {
  updateTopbar();
}

function availableCoins() {
  return Math.max(0, Number(coins || 0) - edxSpent);
}

async function openEdxModal() {
  if (isReadOnlyPreview()) {
    alert("教師巡堂模式不會進行積分或付費交易。");
    return;
  }
  if (!currentUser) {
    returnToPassport();
    return;
  }
  const available = availableCoins();
  const tiers = EDX_TIERS.map((tier) => {
    const disabled = available < tier.coins;
    return `<div class="edx-tier ${tier.cls}">
      <div class="t-emoji">${tier.name.split(" ")[0]}</div>
      <div class="t-name">${tier.name.split(" ")[1]}</div>
      <div class="t-cost">${tier.coins} 🪙</div>
      <div class="t-arrow">⬇︎</div>
      <div class="t-reward">${tier.edx} EDX</div>
      <button ${disabled ? "disabled" : ""} onclick="doExchange(${tier.coins},${tier.edx})">${disabled ? "金幣不足" : "模擬兌換"}</button>
    </div>`;
  }).join("");
  openModal(`<div style="max-width:min(640px,92vw)">
    <h2 style="text-align:center;color:var(--red-dark);font-family:var(--font-han)">EDX 記憶體模擬</h2>
    <p style="text-align:center;line-height:1.7;margin:8px 0 14px">只供本次安全工作階段練習，不會進行真實交易。</p>
    <div class="edx-stats"><div class="edx-stat"><div class="label">可用金幣</div><div class="value">${available}</div></div><div class="edx-stat"><div class="label">模擬 EDX</div><div class="value">${edxTotal}</div></div></div>
    <div class="edx-tiers">${tiers}</div>
  </div>`);
}

async function doExchange(coinsSpent, edxEarned) {
  if (isReadOnlyPreview()) {
    alert("教師巡堂模式不會進行積分或付費交易。");
    return;
  }
  if (availableCoins() < coinsSpent) return;
  edxSpent += Number(coinsSpent || 0);
  edxTotal += Number(edxEarned || 0);
  updateTopbar();
  closeModal();
}

const IDIOM_MISSIONS = [
  { id: "meaning", skillId: "meaning-recognition", idiom: "畫蛇添足", skill: "核心意思", title: "辨認成語意思", prompt: "哪一項最能說明「畫蛇添足」？", options: ["做了多餘的事，反而弄巧成拙", "做事非常迅速", "刻苦練習後成功"], answer: 0 },
  { id: "context", skillId: "context-application", idiom: "一箭雙鵰", skill: "語境判斷", title: "找出合適語境", prompt: "哪個情境最適合使用「一箭雙鵰」？", options: ["一次行動同時達成兩個目標", "反覆做同一件事", "遇到困難立即放棄"], answer: 0 },
  { id: "misuse", skillId: "misuse-detection", idiom: "守株待兔", skill: "錯用修正", title: "修正成語錯用", prompt: "同學努力溫習後取得進步，可否說他「守株待兔」？", options: ["可以，因為他很勤力", "不可以，這成語指不主動努力，只盼意外收穫", "可以，所有進步都靠運氣"], answer: 1 },
  { id: "value", skillId: "value-connection", idiom: "鍥而不捨", skill: "價值理解", title: "連結學習態度", prompt: "哪種表現最能體現「鍥而不捨」？", options: ["遇到一次失敗便停止", "持續嘗試並按回饋改良", "把任務交給別人"], answer: 1 },
  { id: "writing", skillId: "sentence-writing", idiom: "井井有條", skill: "寫作應用", title: "選出準確句子", prompt: "哪一句正確使用「井井有條」？", options: ["圖書館的書分類清楚，排列得井井有條。", "暴雨下得井井有條。", "他跑步跑得井井有條。"], answer: 0 },
];
const missionState = new Map(IDIOM_MISSIONS.map((mission) => [mission.id, { done: false, attempts: 0, selected: null, recorded: false }]));
const memoryBestScores = new Map();

function escapeMissionHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function renderMissions() {
  const root = document.getElementById("missionsList");
  if (!root) return;
  root.innerHTML = IDIOM_MISSIONS.map((mission, index) => {
    const state = missionState.get(mission.id);
    return `<article class="mission-card ${state.done ? "done" : ""}" data-mission-id="${mission.id}">
      <div class="mission-stage"><span class="mission-stage-badge">第 ${index + 1} 關</span><span class="mission-idiom">${escapeMissionHtml(mission.idiom)}</span><span class="mission-skill">${escapeMissionHtml(mission.skill)}</span></div>
      <div><div class="mission-title">${escapeMissionHtml(mission.title)}</div><p class="mission-prompt">${escapeMissionHtml(mission.prompt)}</p>
      <div class="mission-options">${mission.options.map((option, optionIndex) => `<button type="button" class="mission-option" data-mission-option="${optionIndex}" ${state.done ? "disabled" : ""}>${escapeMissionHtml(option)}</button>`).join("")}</div>
      <div class="mission-feedback" ${state.selected === null ? "hidden" : ""}>${state.done ? "答對了！已掌握這項成語技能。" : "請重新閱讀語境線索，再選一次。"}</div></div>
    </article>`;
  }).join("");
  root.querySelectorAll("[data-mission-option]").forEach((button) => {
    button.addEventListener("click", () => answerMission(button.closest("[data-mission-id]").dataset.missionId, Number(button.dataset.missionOption)));
  });
  updateMissionSummary();
}

function answerMission(missionId, selected) {
  const mission = IDIOM_MISSIONS.find((item) => item.id === missionId);
  const state = missionState.get(missionId);
  if (!mission || !state || state.done) return;
  state.attempts += 1;
  state.selected = selected;
  state.done = selected === mission.answer;
  if (state.done) {
    addCoins(2);
    if (!state.recorded) {
      state.recorded = true;
      recordMissionCompletion(mission, state);
    }
  }
  renderMissions();
}

function resetMissions() {
  for (const state of missionState.values()) Object.assign(state, { done: false, attempts: 0, selected: null, recorded: false });
  renderMissions();
  updateToolDebug();
}

function updateMissionSummary() {
  const completed = [...missionState.values()].filter((state) => state.done).length;
  const wrong = [...missionState.values()].reduce((sum, state) => sum + Math.max(0, state.attempts - (state.done ? 1 : 0)), 0);
  const skills = IDIOM_MISSIONS.filter((mission) => missionState.get(mission.id).done).map((mission) => mission.skill);
  const next = IDIOM_MISSIONS.find((mission) => !missionState.get(mission.id).done);
  document.getElementById("missionCompleted").textContent = completed;
  document.getElementById("missionTotal").textContent = IDIOM_MISSIONS.length;
  document.getElementById("missionProgressFill").style.width = `${Math.round((completed / IDIOM_MISSIONS.length) * 100)}%`;
  document.getElementById("missionProgressText").textContent = completed === IDIOM_MISSIONS.length ? "全部任務章已完成" : `已完成 ${completed} 關`;
  document.getElementById("missionSkillSummary").textContent = skills.length ? skills.join("、") : "尚未完成";
  document.getElementById("missionWrongSummary").textContent = String(wrong);
  document.getElementById("missionNextStep").textContent = next ? `下一步：${next.skill}` : "可嘗試把成語寫入自己的段落。";
  updateToolDebug();
}

function updateToolDebug(error = "") {
  const completedMissions = [...missionState.values()].filter((state) => state.done).length;
  window.__TOOL_DEBUG__ = {
    schemaVersion: "lwwf-tool-debug/v1",
    siteId: PASSPORT_SITE_ID,
    mode: passportState.mode || "login-required",
    readOnly: isReadOnlyPreview(),
    synthetic: passportState.studentView?.synthetic === true,
    sandboxMode: isReadOnlyPreview() ? "memory-only" : "off",
    canPersist: canPersistLearning(),
    canGenerate: false,
    canTransact: false,
    completedMissions,
    totalMissions: IDIOM_MISSIONS.length,
    passportStatus: passportSaveStatus,
    feedbackWidget: Boolean(document.getElementById("lwwf-passport-feedback-widget")),
    error: error ? "safe-error" : "",
    privacy: { containsToken: false, containsPassword: false, containsRoster: false, containsBackendPayload: false },
  };
  document.documentElement.dataset.toolDebug = JSON.stringify({
    siteId: PASSPORT_SITE_ID,
    mode: window.__TOOL_DEBUG__.mode,
    readOnly: window.__TOOL_DEBUG__.readOnly,
    synthetic: window.__TOOL_DEBUG__.synthetic,
    sandboxMode: window.__TOOL_DEBUG__.sandboxMode,
    completedMissions,
  });
}
