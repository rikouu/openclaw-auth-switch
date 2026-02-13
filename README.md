# 🔑 OpenClaw Auth Switch Plugin

**English** | **[中文说明](./README_CN.md)**

> Switch between Anthropic OAT and API key authentication — right from your chat.

**No more editing config files.** Just type `/auth oat` or `/auth api` and you're done.

<p align="center">
  <img src="https://img.shields.io/badge/OpenClaw-Plugin-blue?style=flat-square" alt="OpenClaw Plugin" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

---

## ✨ Features

| Command | Description |
|---------|-------------|
| `/auth` | View current auth status (mode, base URL, masked keys) |
| `/auth oat` | Switch to OAT mode (official `api.anthropic.com`) |
| `/auth api` | Switch to API mode (remembers your last URL & key) |
| `/auth api <url> <key>` | Switch to API mode with a new endpoint and key |

### Why?

If you use [OpenClaw](https://github.com/openclaw/openclaw) with Anthropic models, you might need to switch between:

- **OAT (OAuth Token)** — Official Anthropic authentication
- **API Key** — Third-party proxies or custom endpoints

Previously, this meant manually editing `openclaw.json`, updating `auth-profiles.json`, changing the base URL, and restarting. 😵

Now it's just **one command + `/restart`**. That's it.

### How It Works

```
You: /auth
Bot: Mode: OAT
     Base URL: api.anthropic.com
     API Key: sk-ant-a…abc123
     OAT Token: oat-xxx…yz5678

You: /auth api
Bot: Switched to API mode.
     Base URL: https://your-proxy.example.com
     Send /restart to apply.

You: /restart
Bot: ✅ Restarted.
```

## 🚀 Quick Start

### 🧑 If you're a human:

Just copy the message below and send it to your OpenClaw agent — it will handle the rest:

> Please install the auth-switch plugin for me. Clone it from https://github.com/rikouu/openclaw-auth-switch.git to /opt/openclaw-auth-switch/plugin, then register it in my openclaw.json plugins config (add the path to plugins.load.paths and set plugins.entries.auth-switch.enabled to true), and restart the gateway. After that, verify it works by running /auth.

### 🤖 If you're an AI:

Please get your human's permission first, then follow the [Installation](#-installation) steps below to install and enable this plugin.

---

## 📦 Installation

### 1. Clone the plugin

```bash
git clone https://github.com/rikouu/openclaw-auth-switch.git /opt/openclaw-auth-switch/plugin
```

### 2. Register in OpenClaw config

Add to your `~/.openclaw/openclaw.json`:

```jsonc
{
  "plugins": {
    "load": {
      "paths": [
        "/opt/openclaw-auth-switch/plugin"
        // ... your other plugin paths
      ]
    },
    "entries": {
      "auth-switch": {
        "enabled": true
      }
    }
  }
}
```

### 3. Restart OpenClaw

```bash
openclaw gateway restart
```

Done! Type `/auth` in any chat to verify it's working.

## ⚙️ Configuration

The plugin reads and writes to these files:

| File | Purpose |
|------|---------|
| `~/.openclaw/openclaw.json` | Main config (auth order, base URL) |
| `~/.openclaw/agents/main/agent/auth-profiles.json` | Auth credentials |
| `~/.openclaw/auth-switch-state.json` | Remembers your last API base URL |

### Customizing Profiles

By default, the plugin uses these profile names:

```typescript
const OAT_PROFILE = "anthropic:your-oat-profile";
const API_PROFILE = "anthropic:default";
```

Edit `index.ts` to match your own profile names if they differ.

## 🔒 Security

- Keys are **never** displayed in full — always masked (e.g., `sk-ant-a…abc123`)
- Credentials stay local in your OpenClaw config files
- No network requests — everything is file-based

## 📁 Project Structure

```
openclaw-auth-switch/
├── index.ts                  # Plugin source (~180 lines)
├── openclaw.plugin.json      # Plugin manifest
├── package.json              # Package metadata
├── README.md                 # English
├── README_CN.md              # 中文说明
└── LICENSE                   # MIT License
```

## 🤝 Contributing

Issues and PRs welcome! This is a simple plugin — feel free to fork and adapt to your needs.

## 📄 License

MIT © [rikouu](https://github.com/rikouu)
