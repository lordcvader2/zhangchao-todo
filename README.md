# ⚡ 模仿Microsoft To Do开发的待办事项

> 一款专门借鉴Microsoft To Do打造的跨平台待办事项管理工具，基于 Electron + React + Tailwind CSS 构建，配备深色 Z 字专属图标。

![Platform](https://img.shields.io/badge/Platform-Windows-blue?style=flat-square&logo=windows)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-28.2.0-47848F?style=flat-square&logo=electron)

---

## 🎯 功能特性

| 功能 | 说明 |
|------|------|
| 📋 任务管理 | 创建、编辑、完成、删除待办事项 |
| 🔍 搜索过滤 | 侧边栏实时搜索，关键词高亮匹配 |
| 🌙 暗色模式 | 适配深色系界面，保护眼睛 |
| ⚡ 托盘运行 | 最小化到系统托盘，随时调用 |
| 🔔 系统通知 | 任务到期提醒，不错过任何事项 |
| 💾 本地存储 | SQLite 数据库，数据安全可靠 |

---

## 🖼️ 界面预览

```
┌─────────────────────────────────────────────────────┐
│  ⚡ 张超专属待办事项                    [🌙] [搜索...]│
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ 📌 全部   │   🟢 完成皮神 Todo 应用开发             │
│ ✅ 已完成 │   🟡 优化深色 Z 字图标                   │
│ 📝 待办   │   🔴 修复打包签名问题                   │
│          │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

---

## 🛠️ 技术栈

- **运行时**：Electron 28.2.0
- **前端框架**：React 18 + TypeScript
- **样式**：Tailwind CSS 3
- **状态管理**：React Hooks
- **数据存储**：SQLite（`better-sqlite3`）
- **构建工具**：Electron Vite
- **打包工具**：electron-builder

---

## 🚀 运行项目

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
cd todo-app
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建 Windows 安装包

```bash
npm run build
```

构建产物位于 `dist2/win-unpacked/皮神Todo.exe`（绿色版，可直接分发）

---

## 📦 下载使用

### 最新版本

| 平台 | 文件 | 大小 |
|------|------|------|
| Windows | `皮神Todo.exe` | ~182 MB |

> 下载地址：⚡ 即将发布 Release（见 [Releases](https://github.com/lordcvader2/zhangchao-todo/releases)）

---

## 🎨 图标设计

本项目采用了 **B 方案**专属深色 Z 字图标：
- 深灰色背景（#1E1E1E）
- 金色 Z 字轮廓（#FFC832）
- 适配系统托盘（32×32）
- 支持高 DPI 显示

---

## 📝 更新日志

### v1.0.0（首发版本）
- ✨ 完成基础待办事项 CRUD
- 🔍 实现搜索过滤功能
- 🌙 支持暗色模式
- ⚡ 深色 Z 字专属托盘图标
- 📦 Windows 绿色版打包完成

---

## 👤 作者

**（lordcvader2）**  
📧   
🌐 <https://github.com/lordcvader2>

---

## 📄 许可证

本项目仅供个人学习与使用，未经授权禁止商用。

