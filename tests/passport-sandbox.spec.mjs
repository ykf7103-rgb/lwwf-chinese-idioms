import { expect, test } from "@playwright/test";
import path from "node:path";

const SITE_ID = "lwwf-chinese-idioms";
const CONTENT_VERSION = "idiom-master-p5-2026.08-v1";
const FORBIDDEN_DEBUG_TEXT = /(Bearer\s+|sessionToken|pwdHash|student_scores|student_edx)/i;

function sdkFixture(mode) {
  const ready = mode !== "login-required";
  const preview = mode === "teacher-preview";
  const snapshot = {
    ready,
    mode: ready ? (preview ? "teacher-preview" : "student") : "",
    readOnly: preview,
    grade: mode === "wrong-grade" ? "p4" : "p5",
    site: { id: mode === "wrong-site" ? "wrong-site" : SITE_ID },
    loginUrl: "https://lwwf-learning-passport.lwwfaiteams.workers.dev/",
    studentView: ready ? {
      id: preview ? "synthetic-preview" : "student-fixture",
      classCode: preview ? "P5" : "7A",
      classNo: preview ? "00" : "01",
      displayName: preview ? "巡堂預覽學生" : "測試學生",
      synthetic: preview,
      readOnly: preview,
    } : null,
    siteProgress: null,
  };
  return `(() => {
    const fragment = new URLSearchParams(location.hash.slice(1));
    if (fragment.has("lwwfHandoff")) history.replaceState(null, "", location.pathname + location.search);
    const snapshot = ${JSON.stringify(snapshot)};
    window.__PASSPORT_RECORDS = [];
    window.LWWFPassport = {
      init: async () => {
        if (snapshot.ready && !document.getElementById("lwwf-passport-feedback-widget")) {
          const host = document.createElement("div");
          host.id = "lwwf-passport-feedback-widget";
          host.setAttribute("aria-label", "回報問題");
          document.body.appendChild(host);
        }
        return snapshot;
      },
      getState: () => snapshot,
      authorizedFetch: async (input, init) => fetch(input, init),
      recordProgress: async (payload) => {
        if (snapshot.readOnly) throw new Error("read only");
        window.__PASSPORT_RECORDS.push(payload);
        return { ok: true, siteProgress: null };
      }
    };
  })();`;
}

async function installFixture(page, mode) {
  await page.route("**/lwwf-passport-sdk.js", (route) => route.fulfill({ contentType: "application/javascript", body: sdkFixture(mode) }));
  await page.route("**/lwwf-shared-nav.js", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", (route) => route.fulfill({ body: "" }));
  await page.addInitScript(() => {
    window.__PERSISTENCE_WRITES__ = 0;
    window.__INDEXED_DB_OPENS__ = 0;
    for (const method of ["setItem", "removeItem", "clear"]) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function monitoredStorage(...args) {
        window.__PERSISTENCE_WRITES__ += 1;
        return original.apply(this, args);
      };
    }
    if (window.indexedDB?.open) {
      const originalOpen = window.indexedDB.open.bind(window.indexedDB);
      window.indexedDB.open = (...args) => {
        window.__INDEXED_DB_OPENS__ += 1;
        return originalOpen(...args);
      };
    }
  });
}

async function expectSafeDebug(page, mode) {
  await page.waitForFunction(() => Boolean(window.__TOOL_DEBUG__));
  const debug = await page.evaluate(() => window.__TOOL_DEBUG__);
  expect(debug.siteId).toBe(SITE_ID);
  expect(debug.mode).toBe(mode);
  expect(debug.privacy.containsToken).toBe(false);
  expect(debug.privacy.containsPassword).toBe(false);
  expect(debug.privacy.containsRoster).toBe(false);
  expect(JSON.stringify(debug)).not.toMatch(FORBIDDEN_DEBUG_TEXT);
  return debug;
}

async function expectNoVisibleBrokenImages(page) {
  const broken = await page.locator("img").evaluateAll((images) => images
    .filter((image) => {
      const style = getComputedStyle(image);
      return style.display !== "none" && style.visibility !== "hidden" && image.getClientRects().length > 0;
    })
    .filter((image) => image.complete && image.naturalWidth === 0)
    .map((image) => image.getAttribute("src") || "missing-src"));
  expect(broken).toEqual([]);
}

test("沒有 Passport 工作階段時只顯示中央入口", async ({ page }) => {
  await installFixture(page, "login-required");
  await page.goto("/");
  await expect(page.locator("#loginOverlay")).toHaveClass(/active/);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator("#passportEntryStatus")).toContainText("Learning Passport");
  await expectSafeDebug(page, "login-required");
});

for (const mode of ["wrong-site", "wrong-grade"]) {
  test(`${mode} 工作階段會 fail closed`, async ({ page }) => {
    await installFixture(page, mode);
    await page.goto("/");
    await expect(page.locator("#loginOverlay")).toHaveClass(/active/);
    await expect(page.locator("#passportEntryStatus")).toContainText("重新進入");
    expect(await page.evaluate(() => window.__PASSPORT_RECORDS.length)).toBe(0);
    const debug = await expectSafeDebug(page, "login-required");
    expect(debug.canPersist).toBe(false);
  });
}

test("7A 測試身分免第二登入並依序送出開始及任務證據", async ({ page }) => {
  await installFixture(page, "student");
  await page.goto("/#lwwfHandoff=opaque-fixture");
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("");
  await expect(page.locator("#loginOverlay")).not.toHaveClass(/active/);
  await page.waitForFunction(() => window.__PASSPORT_RECORDS.length === 1);
  const start = await page.evaluate(() => window.__PASSPORT_RECORDS[0]);
  expect(start).toMatchObject({ taskId: "idiom-v1:start:p5", completed: false, score: 0, coins: 0 });
  expect(start.metadata).toMatchObject({
    schemaVersion: "lwwf-progress/v2",
    contentVersion: CONTENT_VERSION,
    action: "start_learning",
    activityType: "idiom-learning-start",
    completedTasks: 0,
    totalTasks: 5,
  });

  await page.locator('[data-tab="missions"]').click();
  const first = page.locator("#missionsList .mission-card").first();
  await first.locator('[data-mission-option="1"]').click();
  await first.locator('[data-mission-option="0"]').click();
  await page.waitForFunction(() => window.__PASSPORT_RECORDS.length === 2);
  const records = await page.evaluate(() => window.__PASSPORT_RECORDS);
  const completion = records[1];
  expect(completion).toMatchObject({ taskId: "idiom-v1:mission:meaning", completed: true, coins: 0 });
  expect(completion.metadata).toMatchObject({
    schemaVersion: "lwwf-progress/v2",
    contentVersion: CONTENT_VERSION,
    action: "complete_task",
    activityType: "idiom-mission",
    missionId: "meaning",
    objectiveId: "idiom-meaning",
    completedTasks: 1,
    totalTasks: 5,
    attempts: 2,
    mistakes: 1,
    accuracy: 50,
  });
  expect(completion.metadata.teacherEvidence).toMatchObject({
    schemaVersion: "teacher-evidence/v1",
    objectiveId: "idiom-meaning",
    completed: true,
    attempts: 2,
    mistakes: 1,
    skillsPracticed: ["meaning-recognition"],
    supportUsed: true,
  });
  expect(JSON.stringify(records)).not.toMatch(/studentName|classCode|classNo|voice|transcript|prompt|provider/i);
  expect(await page.evaluate(() => window.__PERSISTENCE_WRITES__)).toBe(0);
  expect(await page.evaluate(() => window.__INDEXED_DB_OPENS__)).toBe(0);
  await expect(page.locator("#lwwf-passport-feedback-widget")).toHaveCount(1);
});

test("本機語音文字回饋不呼叫外部評分服務", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await installFixture(page, "student");
  await page.goto("/");
  await page.locator('[data-tab="voice"]').click();
  const picker = page.locator("#voiceIdiomPick");
  await expect(picker.locator("option")).toHaveCount(16, { timeout: 30_000 });
  const firstIdiom = await picker.locator("option").nth(1).getAttribute("value");
  await picker.selectOption(firstIdiom);
  await page.locator("#voiceText").fill("這個成語形容非常讚歎欣賞，例如看到精彩表演時會大聲叫好。");
  await page.locator("#voiceSubmitBtn").click();
  await expect(page.locator("#voiceFeedback")).toHaveClass(/show/);
  await expect(page.locator("#voiceScore")).not.toHaveText("—");
  expect(requests.some((url) => /lwwf-math-ai|openai|dashscope|supabase/i.test(url))).toBe(false);
});

test("教師巡堂只使用 synthetic 記憶體沙盒且零寫入", async ({ page }, testInfo) => {
  const requests = [];
  const consoleErrors = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await installFixture(page, "teacher-preview");
  await page.goto("/");
  await expect(page.locator("#previewBanner")).toBeVisible();
  await expect(page.locator("#voiceMicBtn")).toBeDisabled();
  await expect(page.locator("#voiceSubmitBtn")).toBeDisabled();
  await page.locator('[data-tab="missions"]').click();
  await page.locator("#missionsList .mission-card").first().locator("[data-mission-option]").first().click();
  await expect(page.locator("#missionCompleted")).toHaveText("1");
  const debug = await expectSafeDebug(page, "teacher-preview");
  expect(debug.readOnly).toBe(true);
  expect(debug.synthetic).toBe(true);
  expect(debug.sandboxMode).toBe("memory-only");
  expect(debug.canPersist).toBe(false);
  expect(debug.canGenerate).toBe(false);
  expect(debug.canTransact).toBe(false);
  expect(await page.evaluate(() => window.__PASSPORT_RECORDS.length)).toBe(0);
  expect(await page.evaluate(() => window.__PERSISTENCE_WRITES__)).toBe(0);
  expect(await page.evaluate(() => window.__INDEXED_DB_OPENS__)).toBe(0);
  expect(requests.some((url) => /supabase|student_scores|student_edx|lwwf-math-ai/i.test(url))).toBe(false);
  expect(consoleErrors).toEqual([]);
  await expectNoVisibleBrokenImages(page);
  await expect(page.locator("#lwwf-passport-feedback-widget")).toHaveCount(1);
  await page.screenshot({ path: path.resolve("_verification", `passport-preview-${testInfo.project.name}.png`), fullPage: true });
});

test("手機尺寸沒有水平溢出", async ({ page }) => {
  await installFixture(page, "teacher-preview");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('[data-tab="missions"]').click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
