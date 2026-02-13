# 🔑 OpenClaw Auth Switch Plugin

**[English](#-features)** | **[中文说明](#-中文说明)**

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
└── README.md                 # You are here
```

## 🤝 Contributing

Issues and PRs welcome! This is a simple plugin — feel free to fork and adapt to your needs.

## 📄 License

MIT © [rikouu](https://github.com/rikouu)

---

<details>
<summary>🇨🇳 中文说明</summary>

# 🔑 OpenClaw 认证切换插件

> 在聊天中一键切换 Anthropic 的 OAT 和 API Key 认证模式。

**告别手动改配置文件。** 输入 `/auth oat` 或 `/auth api` 即可完成切换。

## ✨ 功能

| 命令 | 说明 |
|------|------|
| `/auth` | 查看当前认证状态（模式、Base URL、脱敏密钥） |
| `/auth oat` | 切换到 OAT 模式（官方 `api.anthropic.com`） |
| `/auth api` | 切换到 API 模式（自动记住上次的 URL 和 Key） |
| `/auth api <url> <key>` | 使用新的地址和密钥切换到 API 模式 |

## 为什么需要这个？

使用 OpenClaw + Anthropic 模型时，你可能需要在两种认证方式之间切换：

- **OAT（OAuth Token）**— 官方认证
- **API Key** — 第三方代理或自定义端点

以前需要手动编辑配置文件、修改 auth order、改 base URL、重启……现在只要 **一条命令 + `/restart`** 搞定！

## 📦 安装

```bash
# 1. 克隆插件
git clone https://github.com/rikouu/openclaw-auth-switch.git /opt/openclaw-auth-switch/plugin

# 2. 在 ~/.openclaw/openclaw.json 中注册（见上方英文说明）

# 3. 重启 OpenClaw
openclaw gateway restart
```

## 🔒 安全

- 密钥始终脱敏显示（如 `sk-ant-a…abc123`）
- 所有数据保存在本地配置文件中
- 无网络请求，纯本地操作

</details>
