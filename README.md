# 多人在线协作Markdown笔记应用

## 项目简介
本项目是一个支持多人实时编辑的Markdown笔记应用。用户可以创建笔记并邀请他人协作，所有参与者能够同步看到内容的变更。适合团队头脑风暴、文档编写或学习笔记共享。

## 技术栈
- **前端**：React + WebSocket
- **后端**：Python (FastAPI) + Redis
- **冲突处理**：最后修改优先

## 功能特点
- 实时协作编辑Markdown笔记
- 支持多人同时在线编辑
- 自动保存和同步内容变更
- 简单的冲突处理机制（最后修改优先）

## 安装与运行

### 前置条件
- Node.js（用于前端）
- Python 3.8+（用于后端）
- Redis（用于存储和消息广播）

### 步骤
1. **克隆仓库**：
   ```bash
   git clone https://github.com/your-repo-name.git
   cd your-repo-name
