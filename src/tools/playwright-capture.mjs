const DEFAULT_VIEWPORT = { width: 1440, height: 900 };
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_WAIT_UNTIL = "networkidle";

function now() {
  return new Date().toISOString();
}

function errorText(error) {
  return error?.message || String(error);
}

export function createPlaywrightCaptureAdapter({
  playwright,
  viewport = DEFAULT_VIEWPORT,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  waitUntil = DEFAULT_WAIT_UNTIL,
} = {}) {
  if (!playwright?.chromium?.launch) {
    throw new Error("Playwright chromium launcher is required");
  }

  return async function playwrightCaptureAdapter({ url }) {
    const browser = await playwright.chromium.launch();
    const consoleEntries = [];
    const pageErrors = [];

    try {
      const page = await browser.newPage({ viewport });
      page.on("console", (message) => {
        consoleEntries.push({
          level: message.type(),
          text: message.text(),
          timestamp: now(),
        });
      });
      page.on("pageerror", (error) => {
        pageErrors.push({
          text: errorText(error),
          timestamp: now(),
        });
      });

      await page.goto(url, {
        waitUntil,
        timeout: timeoutMs,
      });
      const bytes = await page.screenshot({
        fullPage: true,
        type: "png",
      });
      const size = page.viewportSize?.() || viewport;

      return {
        screenshot: {
          fileName: "capture.png",
          bytes,
          width: size.width,
          height: size.height,
        },
        consoleEntries,
        pageErrors,
        metadata: {
          adapter: "playwright",
          browserName: "chromium",
          waitUntil,
          timeoutMs,
        },
      };
    } finally {
      await browser.close();
    }
  };
}
