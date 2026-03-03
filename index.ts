import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const API_PROFILE = "anthropic:default";
const AUTH_PROFILES_PATH = join(
  homedir(),
  ".openclaw/agents/main/agent/auth-profiles.json",
);
const AUTH_JSON_PATH = join(
  homedir(),
  ".openclaw/agents/main/agent/auth.json",
);
const STATE_PATH = join(homedir(), ".openclaw/auth-switch-state.json");

function mask(s: string): string {
  if (s.length <= 12) return "***";
  return s.slice(0, 8) + "…" + s.slice(-6);
}

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf-8"));
}

async function writeJson(path: string, data: any): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n");
}

async function loadState(): Promise<{ lastBaseUrl: string }> {
  try {
    return await readJson(STATE_PATH);
  } catch {
    return { lastBaseUrl: "https://aiapi.of.ci" };
  }
}

/** Find the first OAT (token-type) profile in auth-profiles.json */
async function findOatProfile(): Promise<{
  id: string;
  token: string;
} | null> {
  try {
    const data = await readJson(AUTH_PROFILES_PATH);
    const profiles = data.profiles ?? {};
    for (const [id, profile] of Object.entries<any>(profiles)) {
      if (profile.type === "token" && profile.token) {
        return { id, token: profile.token };
      }
    }
  } catch {}
  return null;
}

/** Sync auth.json so the gateway picks up the correct credential on restart */
async function syncAuthJson(profile: {
  type: "api_key" | "token";
  key?: string;
  token?: string;
}): Promise<void> {
  const auth: Record<string, any> = {};
  if (profile.type === "api_key" && profile.key) {
    auth.anthropic = { type: "api_key", key: profile.key };
  } else if (profile.type === "token" && profile.token) {
    auth.anthropic = { type: "api_key", key: profile.token };
  }
  await writeJson(AUTH_JSON_PATH, auth);
}

export default function register(api: OpenClawPluginApi) {
  // --- Auto-fallback on billing errors ---
  api.on("agent_end", async (event, _ctx) => {
    if (!event.success && event.error) {
      const errMsg = event.error.toLowerCase();
      const isBilling =
        errMsg.includes("billing") ||
        errMsg.includes("credit") ||
        errMsg.includes("insufficient") ||
        errMsg.includes("balance") ||
        errMsg.includes("run out");
      if (!isBilling) return;

      const cfg = api.runtime.config.loadConfig();
      const order: string[] = cfg.auth?.order?.anthropic ?? [];
      if (order.length < 2) {
        api.logger.warn(
          `[auth-switch] Billing error on ${order[0] ?? "unknown"}, but no fallback profile available`,
        );
        return;
      }

      const failed = order[0];
      const next = order[1];

      // Rotate: move failed to end
      const newOrder = [...order.slice(1), failed];
      const updated = JSON.parse(JSON.stringify(cfg)) as any;
      updated.auth ??= {};
      updated.auth.order ??= {};
      updated.auth.order.anthropic = newOrder;
      await api.runtime.config.writeConfigFile(updated);

      // Sync auth.json so the fallback actually takes effect
      try {
        const profiles = await readJson(AUTH_PROFILES_PATH);
        const nextProfile = profiles.profiles?.[next];
        if (nextProfile) {
          await syncAuthJson(nextProfile);
          profiles.lastGood ??= {};
          profiles.lastGood.anthropic = next;
          await writeJson(AUTH_PROFILES_PATH, profiles);
        }
      } catch (err: any) {
        api.logger.warn(
          `[auth-switch] Failed to sync auth.json for fallback: ${err?.message ?? err}`,
        );
      }

      api.logger.warn(
        `[auth-switch] Billing error on ${failed}, auto-switched to ${next}. Send /restart to apply.`,
      );
    }
  });

  // Suppress billing error messages from being sent to users
  api.on("message_sending", (event, _ctx) => {
    const content = (event.content ?? "").toLowerCase();
    if (
      content.includes("billing error") &&
      content.includes("run out of credits")
    ) {
      api.logger.info(
        "[auth-switch] Suppressed billing error message to user",
      );
      return { cancel: true };
    }
  });

  api.registerCommand({
    name: "auth",
    description: "View/switch Anthropic auth mode (OAT / API).",
    acceptsArgs: true,
    handler: async (ctx) => {
      const args = ctx.args?.trim() ?? "";
      const tokens = args.split(/\s+/).filter(Boolean);
      const action = (tokens[0] ?? "").toLowerCase();
      const cfg = api.runtime.config.loadConfig();
      const order: string[] = cfg.auth?.order?.anthropic ?? [];
      const baseUrl: string | null =
        cfg.models?.providers?.anthropic?.baseUrl ?? null;

      const oatInfo = await findOatProfile();
      const isOat = oatInfo ? order[0] === oatInfo.id : false;

      // --- /auth ---
      if (!action || action === "status") {
        let apiKeyDisplay = "(none)";
        let oatDisplay = "(none)";
        try {
          const p = await readJson(AUTH_PROFILES_PATH);
          const k = p.profiles?.[API_PROFILE]?.key ?? "";
          if (k) apiKeyDisplay = mask(k);
          if (oatInfo) oatDisplay = mask(oatInfo.token);
        } catch {}

        return {
          text: [
            `Mode: ${isOat ? "OAT" : "API"}`,
            `Base URL: ${baseUrl ?? "api.anthropic.com"}`,
            `API Key: ${apiKeyDisplay}`,
            `OAT Token: ${oatDisplay}`,
            oatInfo ? `OAT Profile: ${oatInfo.id}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        };
      }

      // --- /auth oat ---
      if (action === "oat") {
        try {
          if (!oatInfo) {
            return {
              text:
                "No OAT profile found in auth-profiles.json.\n" +
                "Run `openclaw authorize` to add an OAT credential first.",
            };
          }

          if (baseUrl) await writeJson(STATE_PATH, { lastBaseUrl: baseUrl });

          const next = JSON.parse(JSON.stringify(cfg)) as any;
          next.auth ??= {};
          next.auth.order ??= {};
          next.auth.order.anthropic = [oatInfo.id];
          next.auth.profiles = {
            [oatInfo.id]: { provider: "anthropic", mode: "token" },
          };
          if (next.models?.providers?.anthropic) {
            next.models.providers.anthropic.baseUrl =
              "https://api.anthropic.com";
            next.models.providers.anthropic.models ??= [];
          }
          await api.runtime.config.writeConfigFile(next);

          // Sync auth.json
          await syncAuthJson({ type: "token", token: oatInfo.token });

          const profiles = await readJson(AUTH_PROFILES_PATH);
          profiles.lastGood ??= {};
          profiles.lastGood.anthropic = oatInfo.id;
          await writeJson(AUTH_PROFILES_PATH, profiles);

          return {
            text:
              `Switched to OAT mode (api.anthropic.com, profile: ${oatInfo.id}).\n` +
              "Send /restart to apply.",
          };
        } catch (err: any) {
          return { text: `[auth oat error] ${err?.message ?? err}` };
        }
      }

      // --- /auth api  |  /auth api <url> <key> ---
      if (action === "api") {
        const hasArgs = tokens.length >= 3;
        let url: string;
        let newKey = "";

        if (hasArgs) {
          url = tokens[1];
          newKey = tokens[2];
        } else {
          const p = await readJson(AUTH_PROFILES_PATH);
          if (!p.profiles?.[API_PROFILE]?.key) {
            return {
              text:
                `API profile (${API_PROFILE}) has no key.\n` +
                "Use: /auth api <url> <key>",
            };
          }
          const state = await loadState();
          url = state.lastBaseUrl;
        }

        const next = JSON.parse(JSON.stringify(cfg)) as any;
        next.auth ??= {};
        next.auth.order ??= {};
        next.auth.order.anthropic = [API_PROFILE];
        next.auth.profiles = {
          [API_PROFILE]: { provider: "anthropic", mode: "api_key" },
        };
        next.models ??= {};
        next.models.providers ??= {};
        next.models.providers.anthropic ??= {};
        next.models.providers.anthropic.baseUrl = url;
        next.models.providers.anthropic.models ??= [];
        await api.runtime.config.writeConfigFile(next);

        await writeJson(STATE_PATH, { lastBaseUrl: url });

        const profiles = await readJson(AUTH_PROFILES_PATH);
        profiles.lastGood ??= {};
        profiles.lastGood.anthropic = API_PROFILE;
        if (newKey) {
          profiles.profiles ??= {};
          profiles.profiles[API_PROFILE] ??= {
            type: "api_key",
            provider: "anthropic",
          };
          profiles.profiles[API_PROFILE].key = newKey;
        }
        await writeJson(AUTH_PROFILES_PATH, profiles);

        // Sync auth.json
        const apiKey = newKey || profiles.profiles?.[API_PROFILE]?.key;
        if (apiKey) {
          await syncAuthJson({ type: "api_key", key: apiKey });
        }

        const keyLine = newKey ? `\nAPI Key: ${mask(newKey)}` : "";
        return {
          text:
            `Switched to API mode.\nBase URL: ${url}` +
            keyLine +
            "\n\nSend /restart to apply.",
        };
      }

      // --- help ---
      return {
        text: [
          "/auth — Show current auth status",
          "/auth oat — Switch to OAT (official)",
          "/auth api — Switch to API (last used URL & key)",
          "/auth api <url> <key> — Switch to API (custom)",
        ].join("\n"),
      };
    },
  });
}
