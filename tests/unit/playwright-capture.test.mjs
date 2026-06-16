import assert from "node:assert/strict";
import { test } from "node:test";

import { createPlaywrightCaptureAdapter } from "../../src/tools/playwright-capture.mjs";

test("Playwright capture adapter returns screenshot, console, and pageerror evidence", async () => {
  const events = {};
  let closed = false;
  const fakePlaywright = {
    chromium: {
      async launch() {
        return {
          async newPage(options) {
            assert.deepEqual(options.viewport, { width: 390, height: 844 });
            return {
              on(eventName, handler) {
                events[eventName] = handler;
              },
              async goto(url, options) {
                assert.equal(url, "http://localhost:5173");
                assert.equal(options.waitUntil, "domcontentloaded");
                assert.equal(options.timeout, 500);
                events.console?.({
                  type: () => "info",
                  text: () => "ready",
                });
                events.pageerror?.(new Error("boom"));
              },
              async screenshot(options) {
                assert.equal(options.fullPage, true);
                assert.equal(options.type, "png");
                return Buffer.from("png-bytes");
              },
              viewportSize() {
                return { width: 390, height: 844 };
              },
            };
          },
          async close() {
            closed = true;
          },
        };
      },
    },
  };

  const adapter = createPlaywrightCaptureAdapter({
    playwright: fakePlaywright,
    viewport: { width: 390, height: 844 },
    timeoutMs: 500,
    waitUntil: "domcontentloaded",
  });

  const result = await adapter({
    url: "http://localhost:5173",
    outputDir: "/tmp/poison-test",
  });

  assert.equal(result.screenshot.fileName, "capture.png");
  assert.equal(result.screenshot.bytes.toString("utf8"), "png-bytes");
  assert.equal(result.screenshot.width, 390);
  assert.equal(result.screenshot.height, 844);
  assert.equal(result.consoleEntries[0].level, "info");
  assert.equal(result.consoleEntries[0].text, "ready");
  assert.equal(result.pageErrors[0].text, "boom");
  assert.equal(result.metadata.adapter, "playwright");
  assert.equal(result.metadata.browserName, "chromium");
  assert.equal(closed, true);
});
