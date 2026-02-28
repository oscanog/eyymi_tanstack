import { chromium, expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

type SeededUser = {
  deviceId: string;
  userId: string;
  username: string;
};

type ConvexResponse<T> = {
  status: "success" | "error";
  value?: T;
  errorMessage?: string;
  error?: string;
};

type ScreenshotUserSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  user: SeededUser;
};

function getConvexUrl() {
  const value = process.env.VITE_CONVEX_URL?.trim();
  if (!value) {
    throw new Error("Missing VITE_CONVEX_URL for Playwright tests.");
  }
  return value;
}

function getAppUrl() {
  return process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";
}

async function convexMutation<T>(
  request: APIRequestContext,
  pathName: string,
  args: Record<string, unknown>,
): Promise<T> {
  const response = await request.post(`${getConvexUrl()}/api/mutation`, {
    data: {
      path: pathName,
      args,
    },
  });

  if (!response.ok()) {
    throw new Error(`Convex mutation failed (${response.status()}): ${await response.text()}`);
  }

  const payload = (await response.json()) as ConvexResponse<T>;
  if (payload.status !== "success") {
    throw new Error(payload.errorMessage || payload.error || `Convex mutation failed: ${pathName}`);
  }
  return payload.value as T;
}

async function seedUser(
  request: APIRequestContext,
  params: {
    username: string;
    gender: "male" | "female" | "gay" | "lesbian";
    preferredMatchGender: "male" | "female" | "gay" | "lesbian";
    avatarId: string;
  },
): Promise<SeededUser> {
  const deviceId = crypto.randomUUID();
  const user = await convexMutation<{ _id: string; username: string }>(request, "users:upsert", {
    deviceId,
    username: params.username,
    gender: params.gender,
    preferredMatchGender: params.preferredMatchGender,
    avatarId: params.avatarId,
  });

  return {
    deviceId,
    userId: user._id,
    username: user.username,
  };
}

async function primeIdentity(page: Page, user: SeededUser) {
  await page.addInitScript((payload) => {
    window.localStorage.setItem("man2man_device_id", payload.deviceId);
    window.localStorage.setItem("man2man_username", payload.username);
    window.localStorage.setItem("man2man_last_username", payload.username);
    window.localStorage.setItem("man2man_user_id", payload.userId);
  }, user);
}

async function beginHold(page: Page) {
  await page.getByTestId("copy-press-button").dispatchEvent("pointerdown", {
    button: 0,
    buttons: 1,
    pointerType: "touch",
    isPrimary: true,
  });
}

async function endHold(page: Page) {
  await page.getByTestId("copy-press-button").dispatchEvent("pointerup", {
    button: 0,
    buttons: 0,
    pointerType: "touch",
    isPrimary: true,
  });
}

async function createUserSession(
  user: SeededUser,
  runId: string,
): Promise<ScreenshotUserSession> {
  const browser = await chromium.launch({
    headless: process.env.COPY_SHOTS_HEADLESS === "1",
  });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await primeIdentity(page, user);
  await page.goto(`${getAppUrl()}/copy?e2e=${runId}&debug=shots`);
  return { browser, context, page, user };
}

async function readWindowState(page: Page) {
  const countdown = page.getByTestId("copy-window-countdown");
  const windowId = (await countdown.getAttribute("data-window-id")) ?? "";
  const remainingMs = Number((await countdown.getAttribute("data-remaining-ms")) ?? "0");
  const label = ((await countdown.textContent()) ?? "").trim();
  return { windowId, remainingMs, label };
}

async function waitForSharedWindowWithBudget(
  pageA: Page,
  pageB: Page,
  minimumRemainingMs: number,
) {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    const [stateA, stateB] = await Promise.all([readWindowState(pageA), readWindowState(pageB)]);
    if (
      stateA.windowId &&
      stateA.windowId === stateB.windowId &&
      stateA.remainingMs >= minimumRemainingMs &&
      stateB.remainingMs >= minimumRemainingMs
    ) {
      return {
        windowId: stateA.windowId,
        remainingA: stateA.remainingMs,
        remainingB: stateB.remainingMs,
      };
    }
    await pageA.waitForTimeout(100);
  }

  throw new Error("Two-user screenshot run never aligned on a shared focus window with enough hold budget.");
}

async function waitForReciprocalRing(page: Page) {
  await expect(page.getByTestId("copy-self-ring")).toHaveAttribute("data-visible", "true");
  await expect(page.getByTestId("copy-partner-ring")).toHaveAttribute("data-visible", "true");
}

async function saveShot(page: Page, outputDir: string, filename: string) {
  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: false,
  });
}

test.describe.serial("/copy screenshot diagnostics", () => {
  test("captures the four agreed screenshot states", async ({ request }) => {
    const runId = `copy-shots-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const outputDir = path.join(process.cwd(), "test-results", "copy-shots", runId);
    fs.mkdirSync(outputDir, { recursive: true });

    const user1 = await seedUser(request, {
      username: `copyalfa${runId.slice(-6)}`,
      gender: "male",
      preferredMatchGender: "female",
      avatarId: "copy-ava-01",
    });
    const user2 = await seedUser(request, {
      username: `copybravo${runId.slice(-6)}`,
      gender: "female",
      preferredMatchGender: "male",
      avatarId: "copy-ava-02",
    });

    const session1 = await createUserSession(user1, runId);
    const session2 = await createUserSession(user2, runId);

    try {
      await expect(session1.page.getByText(`@${user1.username}`)).toBeVisible();
      await expect(session2.page.getByText(`@${user2.username}`)).toBeVisible();
      await expect(session1.page.getByTestId("copy-center-username")).toHaveText(`@${user2.username}`);
      await expect(session2.page.getByTestId("copy-center-username")).toHaveText(`@${user1.username}`);
      await expect(session1.page.getByTestId("copy-debug-overlay")).toBeVisible();
      await expect(session2.page.getByTestId("copy-debug-overlay")).toBeVisible();

      const baselineWindow = await waitForSharedWindowWithBudget(session1.page, session2.page, 2400);
      await saveShot(session1.page, outputDir, "user1-before.png");
      await saveShot(session2.page, outputDir, "user2-before.png");

      await Promise.all([beginHold(session1.page), beginHold(session2.page)]);
      await session1.page.waitForTimeout(1000);

      await waitForReciprocalRing(session1.page);
      await waitForReciprocalRing(session2.page);
      await expect(session1.page.getByTestId("copy-self-ring")).toHaveAttribute("data-direction", "clockwise");
      await expect(session1.page.getByTestId("copy-partner-ring")).toHaveAttribute("data-direction", "counter-clockwise");
      await expect(session2.page.getByTestId("copy-self-ring")).toHaveAttribute("data-direction", "clockwise");
      await expect(session2.page.getByTestId("copy-partner-ring")).toHaveAttribute("data-direction", "counter-clockwise");

      const plusOneState = await waitForSharedWindowWithBudget(session1.page, session2.page, 200);
      expect(plusOneState.windowId).toBe(baselineWindow.windowId);
      expect(plusOneState.remainingA).toBeLessThan(baselineWindow.remainingA);
      expect(plusOneState.remainingB).toBeLessThan(baselineWindow.remainingB);

      await saveShot(session1.page, outputDir, "user1-plus1s-both-pressing.png");
      await saveShot(session2.page, outputDir, "user2-plus1s-both-pressing.png");

      await Promise.all([endHold(session1.page), endHold(session2.page)]);
    } finally {
      await session1.context.close();
      await session1.browser.close();
      await session2.context.close();
      await session2.browser.close();
    }
  });
});
