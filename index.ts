import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const OAT_PROFILE = "anthropic:your-oat-profile";
const API_PROFILE = "anthropic:default";
const AUTH_PROFILES_PATH = join(
  homedir(),
  ".openclaw/agents/main/agent/auth-profiles.json",
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
    return { lastBaseUrl: "https://your-proxy.example.com" };
  }
}

export default function register(api: OpenClawPluginApi) {
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
      const isOat = order[0] === OAT_PROFILE;

      // --- /auth ---
      if (!action || action === "status") {
        let apiKeyDisplay = "(none)";
        let oatDisplay = "(none)";
        try {
          const p = await readJson(AUTH_PROFILES_PATH);
          const k = p.profiles?.[API_PROFILE]?.key ?? "";
          const t = p.profiles?.[OAT_PROFILE]?.token ?? "";
          if (k) apiKeyDisplay = mask(k);
          if (t) oatDisplay = mask(t);
        } catch {}

        return {
          text: [
            `Mode: ${isOat ? "OAT" : "API"}`,
            `Base URL: ${baseUrl ?? "api.anthropic.com"}`,
            `API Key: ${apiKeyDisplay}`,
            `OAT Token: ${oatDisplay}`,
          ].join("\n"),
        };
      }

      // --- /auth oat ---
      if (action === "oat") {
        try {
          const profiles = await readJson(AUTH_PROFILES_PATH);
          const oatToken = profiles.profiles?.[OAT_PROFILE]?.token;
          if (!oatToken) {
            return {
              text:
                `OAT profile (${OAT_PROFILE}) not found.\n` +
                "Run openclaw authorize to add an OAT credential first.",
            };
          }

          if (baseUrl) await writeJson(STATE_PATH, { lastBaseUrl: baseUrl });

          const next = JSON.parse(JSON.stringify(cfg)) as any;
          next.auth ??= {};
          next.auth.order ??= {};
          next.auth.order.anthropic = [OAT_PROFILE, API_PROFILE];
          if (next.models?.providers?.anthropic) {
            next.models.providers.anthropic.baseUrl = "https://api.anthropic.com";
            next.models.providers.anthropic.models ??= [];
          }
          await api.runtime.config.writeConfigFile(next);

          profiles.lastGood ??= {};
          profiles.lastGood.anthropic = OAT_PROFILE;
          await writeJson(AUTH_PROFILES_PATH, profiles);

          return {
            text:
              "Switched to OAT mode (api.anthropic.com).\n" +
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
        next.auth.order.anthropic = [API_PROFILE, OAT_PROFILE];
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
