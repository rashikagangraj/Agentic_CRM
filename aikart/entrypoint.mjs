#!/usr/bin/env node
// Container entrypoint dispatcher.
//
// mode "serve" (default): runs the existing Next.js standalone server,
// unchanged — this is what keeps the web app + /api/health on port 8100.
//
// mode "aikart-run": boots the same server internally, waits for it to
// become healthy, runs the aiKart runner (aikart/runner.mjs) against it,
// then shuts the server down and exits with the runner's exit code.

import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const mode = process.argv[2] || "serve";
const PORT = process.env.PORT || "8100";
const HEALTH_URL = `http://127.0.0.1:${PORT}/api/health`;

function startServer() {
  return spawn("node", ["server.js"], { stdio: "inherit", env: process.env });
}

async function waitForHealth(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(HEALTH_URL);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await delay(500);
  }
  throw new Error(`Server did not become healthy within ${timeoutMs}ms at ${HEALTH_URL}`);
}

async function main() {
  if (mode === "serve") {
    const server = startServer();
    server.on("exit", (code) => process.exit(code ?? 0));
    return;
  }

  if (mode === "aikart-run") {
    const server = startServer();
    let exitCode = 1;
    try {
      await waitForHealth();
      exitCode = await new Promise((resolve) => {
        const runner = spawn("node", ["aikart/runner.mjs"], {
          stdio: "inherit",
          env: process.env,
        });
        runner.on("exit", (code) => resolve(code ?? 1));
      });
    } catch (err) {
      console.error("[aikart-run] Failed:", err.message);
      exitCode = 1;
    } finally {
      server.kill("SIGTERM");
    }
    process.exit(exitCode);
    return;
  }

  console.error(`Unknown mode "${mode}". Use "serve" or "aikart-run".`);
  process.exit(1);
}

main();
