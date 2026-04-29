# 无名杀 (Noname) — Claude 工作指南

## 开发命令

```bash
pnpm install       # 安装依赖
pnpm dev           # 启动开发服务器（含 Vite + TS 类型检查）
pnpm build         # 生产构建
pnpm lint          # ESLint 检查
```

- Node.js ^20.19.0 || >=22.12.0，pnpm >=9
- 前端需 Chromium >= 91 或 Safari >= 16.4，暂不支持 Firefox

## 我关注的范围

当前仅开发 **guozhan_ee 模式**。详细规范见 [mode/guozhan_ee/CLAUDE.md](mode/guozhan_ee/CLAUDE.md)。

涉及该模式的核心文件路径前缀：
- `mode/guozhan_ee/src/` — 模式源码
- `card/guozhan_ee.js` — 该模式专属卡牌
- `audio/die/gz_vibe_*.mp3`、`audio/skill/vibe_*.mp3` — 角色音频
