# 🔑 OpenClaw 认证切换插件

> 在聊天中一键切换 Anthropic 的 OAT 和 API Key 认证模式。

**告别手动改配置文件。** 输入 `/auth oat` 或 `/auth api` 即可完成切换。

<p align="center">
  <img src="https://img.shields.io/badge/OpenClaw-Plugin-blue?style=flat-square" alt="OpenClaw Plugin" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

---

## ✨ 功能

| 命令 | 说明 |
|------|------|
| `/auth` | 查看当前认证状态（模式、Base URL、脱敏密钥） |
| `/auth oat` | 切换到 OAT 模式（官方 `api.anthropic.com`） |
| `/auth api` | 切换到 API 模式（自动记住上次的 URL 和 Key） |
| `/auth api <url> <key>` | 使用新的地址和密钥切换到 API 模式 |

## 🤔 为什么需要这个？

使用 [OpenClaw](https://github.com/openclaw/openclaw) + Anthropic 模型时，你可能需要在两种认证方式之间切换：

- **OAT（OAuth Token）**— 官方认证
- **API Key** — 第三方代理或自定义端点

以前需要：打开配置文件 → 改 auth order → 改 baseUrl → 重启 😵

现在只要 **一条命令 + `/restart`**，2秒搞定！

## 💬 使用示例

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

## 📦 安装

### 1. 克隆插件

```bash
git clone https://github.com/rikouu/openclaw-auth-switch.git /opt/openclaw-auth-switch/plugin
```

### 2. 在 OpenClaw 配置中注册

在 `~/.openclaw/openclaw.json` 中添加：

```jsonc
{
  "plugins": {
    "load": {
      "paths": [
        "/opt/openclaw-auth-switch/plugin"
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

### 3. 重启 OpenClaw

```bash
openclaw gateway restart
```

输入 `/auth` 验证插件是否生效！

## ⚙️ 配置

插件读写以下文件：

| 文件 | 用途 |
|------|------|
| `~/.openclaw/openclaw.json` | 主配置（auth order、base URL） |
| `~/.openclaw/agents/main/agent/auth-profiles.json` | 认证凭据 |
| `~/.openclaw/auth-switch-state.json` | 记住上次的 API base URL |

### 自定义 Profile 名称

默认使用以下 profile 名：

```typescript
const OAT_PROFILE = "anthropic:your-oat-profile";
const API_PROFILE = "anthropic:default";
```

如需修改，编辑 `index.ts` 中对应的常量。

## 🔒 安全

- 密钥始终脱敏显示（如 `sk-ant-a…abc123`）
- 所有数据保存在本地配置文件中
- 无网络请求，纯本地操作

## 📁 项目结构

```
openclaw-auth-switch/
├── index.ts                  # 插件源码（~180 行）
├── openclaw.plugin.json      # 插件清单
├── package.json              # 包信息
├── README.md                 # English
├── README_CN.md              # 中文说明（本文件）
└── LICENSE                   # MIT 许可证
```

## 🤝 贡献

欢迎提 Issue 和 PR！这是一个简单的插件，随意 fork 和修改。

## 📄 许可证

MIT © [rikouu](https://github.com/rikouu)
