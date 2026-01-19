# 技术背景 (Tech Context)

## 开发环境
- **操作系统**: macOS (主要目标平台)
- **语言**: Python 3.8+, Node.js 16+
- **Shell**: zsh / bash

## 项目结构
```text
项目路线图/
├── backend/                # Flask 应用
│   ├── models/             # 数据类 (Project, ProductLine)
│   ├── routes/             # API 端点
│   ├── services/           # 业务逻辑
│   └── utils/              # 文件 I/O
├── frontend/               # React 应用
│   ├── src/
│   │   ├── components/     # UI 组件 (Timeline, Modals)
│   │   ├── services/       # API 客户端
│   │   └── utils/          # 辅助逻辑 (Date, Layout)
├── data/                   # 运行时数据存储 (JSON)
├── docs/                   # 项目文档 (遵循 6A 工作流)
└── scripts/                # 部署脚本
```

## 关键配置
- **端口**:
    - 后端: 5000
    - 前端: 5173
- **数据位置**: 相对于项目根目录的 `./data/`。
- **环境变量**:
    - `.env.deploy`: 部署脚本使用 (Host, User, Paths)。

## 依赖项
- **后端**: `flask`, `flask-cors`
- **前端**: `react`, `react-dom`, `antd`, `dayjs`, `vite`

## 自动化
- `start.py`: 自动安装 pip/npm 包，初始化 `data/` 目录。
- `deploy_cloud.sh`: 基于 Rsync 的部署脚本，具有备份和服务重启功能。
