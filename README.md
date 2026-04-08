# openclaw-auth-switch

OpenClaw plugin to view and switch Anthropic auth modes (OAT / API key) from chat.

## Features

- `/auth` — Show current auth status (mode, base URL, masked keys)
- `/auth oat` — Switch to OAT mode (official `api.anthropic.com`)
- `/auth api` — Switch to API mode (last used URL & key)
- `/auth api <url> <key>` — Switch to API mode with custom base URL and key
- **Auto-fallback** — Automatically rotates to next auth profile on billing errors
- **Error suppression** — Suppresses billing error messages from reaching users

## Install

1. Clone or copy the plugin to your server:

```bash
git clone https://github.com/rikouu/openclaw-auth-switch.git /opt/openclaw-auth-switch
```

2. Register in `openclaw.json`:

```json
{
  "plugins": {
    "allow": ["auth-switch"],
    "load": {
      "paths": ["/opt/openclaw-auth-switch/plugin"]
    },
    "entries": {
      "auth-switch": { "enabled": true }
    },
    "installs": {
      "auth-switch": {
        "source": "path",
        "sourcePath": "/opt/openclaw-auth-switch/plugin",
        "installPath": "/opt/openclaw-auth-switch/plugin",
        "version": "1.0.0"
      }
    }
  }
}
```

3. Restart OpenClaw gateway.

## Configuration

Edit the constants at the top of `plugin/index.ts` to match your auth profile names:

```ts
const OAT_PROFILE = "anthropic:max20";   // your OAT profile name
const API_PROFILE = "anthropic:api";      // your API key profile name
```

## How It Works

- Reads/writes `~/.openclaw/agents/main/agent/auth-profiles.json` for credentials
- Updates `openclaw.json` auth order and provider base URL on switch
- Saves last-used API base URL to `~/.openclaw/auth-switch-state.json`
- After switching, send `/restart` to apply changes

## License

MIT
