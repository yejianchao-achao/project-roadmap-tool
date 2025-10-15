# 项目路线图工具

一个基于Web的项目路线图可视化管理工具，支持项目的创建、编辑、删除和时间轴可视化展示。

## ✨ 项目特性

- 📊 **时间轴可视化** - 直观的甘特图式项目展示
- 🎨 **状态管理** - 7种项目状态，颜色区分
- 🏊 **产品线泳道** - 按产品线分组展示项目
- 🔄 **智能布局** - 自动处理项目时间重叠
- 📝 **完整CRUD** - 项目和产品线的增删改查
- 🚀 **一键启动** - 自动检查环境、安装依赖、启动服务

## 📸 功能展示

### 核心功能
- ✅ 项目创建/编辑/删除
- ✅ 产品线管理
- ✅ 时间轴可视化（月份刻度 + 周网格）
- ✅ 项目块智能排列（自动避免重叠）
- ✅ 产品线筛选
- ✅ 状态颜色映射
- ✅ 响应式布局

## 🛠 技术栈

### 后端
- **Python 3.8+**
- **Flask 3.0.0** - Web框架
- **Flask-CORS 4.0.0** - 跨域支持

### 前端
- **React 18.2.0** - UI框架
- **Ant Design 5.12.0** - 组件库
- **Vite 5.0.8** - 构建工具
- **dayjs 1.11.10** - 日期处理

### 数据存储
- **JSON文件** - 本地持久化存储

## 📦 项目结构

```
项目路线图/
├── start.py                   # 一键启动脚本 ⭐
├── backend/                   # 后端代码
│   ├── app.py                # Flask应用入口
│   ├── models/               # 数据模型
│   │   ├── productline.py   # 产品线模型
│   │   └── project.py       # 项目模型
│   ├── services/             # 业务逻辑层
│   │   ├── productline_service.py
│   │   └── project_service.py
│   ├── routes/               # API路由
│   │   ├── productlines.py
│   │   └── projects.py
│   ├── utils/                # 工具函数
│   │   └── file_handler.py  # 文件读写（支持文件锁）
│   └── requirements.txt      # Python依赖
├── frontend/                  # 前端代码
│   ├── src/
│   │   ├── App.jsx          # 根组件
│   │   ├── main.jsx         # 入口文件
│   │   ├── components/      # React组件
│   │   │   ├── ProjectModal.jsx        # 项目表单
│   │   │   ├── ProductLineFilter.jsx   # 产品线筛选
│   │   │   └── Timeline/                # 时间轴组件
│   │   │       ├── TimelineView.jsx
│   │   │       ├── TimelineHeader.jsx
│   │   │       ├── TimelineGrid.jsx
│   │   │       ├── ProjectBar.jsx
│   │   │       └── Swimlane.jsx
│   │   ├── services/        # API服务
│   │   │   └── api.js
│   │   ├── utils/           # 工具函数
│   │   │   ├── constants.js    # 常量定义
│   │   │   ├── dateUtils.js    # 日期工具
│   │   │   └── layoutUtils.js  # 布局算法
│   │   └── styles/          # 样式文件
│   │       ├── index.css
│   │       └── timeline.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── data/                      # 数据文件
│   ├── projects.json         # 项目数据
│   └── productlines.json     # 产品线数据
└── docs/                      # 项目文档
    └── 项目路线图工具/
        ├── ALIGNMENT_项目路线图工具.md      # 需求对齐
        ├── CONSENSUS_项目路线图工具.md      # 需求共识
        ├── DESIGN_项目路线图工具.md         # 架构设计
        ├── TASK_项目路线图工具.md           # 任务拆分
        ├── ACCEPTANCE_项目路线图工具.md     # 验收文档
        ├── PROGRESS_SUMMARY.md              # 进度总结
        ├── TODO_项目路线图工具.md           # 待办事项
        └── FINAL_项目路线图工具.md          # 最终报告
```

## 🚀 快速开始

### 环境要求

- **macOS** 操作系统
- **Python 3.8+**
- **Node.js 16+**

### 方式1：一键启动（推荐）⭐

```bash
# 在项目根目录执行
python3 start.py
```

启动脚本会自动：
1. ✅ 检查Python和Node.js版本
2. ✅ 创建data目录和初始数据文件
3. ✅ 安装Python依赖
4. ✅ 安装npm依赖
5. ✅ 启动Flask后端服务（端口5000）
6. ✅ 启动Vite前端服务（端口5173）
7. ✅ 自动打开浏览器

按 `Ctrl+C` 停止所有服务。

### 方式2：手动启动

#### 1. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 2. 安装前端依赖

```bash
cd frontend
npm install
```

#### 3. 启动后端服务

```bash
cd backend
python app.py
```

后端服务将在 http://localhost:5000 启动

#### 4. 启动前端服务

```bash
cd frontend
npm run dev
```

前端服务将在 http://localhost:5173 启动

#### 5. 访问应用

在浏览器中打开 http://localhost:5173

## 📖 使用说明

### 创建项目

1. 点击右上角"新建项目"按钮
2. 填写项目信息：
   - 项目名称（必填，最多100字符）
   - 产品线（必选，可新建）
   - 开始日期（必填）
   - 结束日期（必填，需>=开始日期）
   - 项目状态（必选）
3. 点击"确定"保存

### 编辑项目

- 点击时间轴上的项目块即可编辑

### 筛选产品线

- 使用左侧筛选器选择要显示的产品线
- 支持全选/取消全选
- 支持多选

### 状态图例

左侧筛选器底部显示所有状态的颜色图例：
- **规划**: 浅蓝色
- **方案**: 蓝色
- **设计**: 绿色
- **开发**: 橙色
- **测试**: 黄色
- **已上**: 深红色
- **暂停**: 灰色虚线边框

## 🔌 API文档

### 产品线API

#### 获取所有产品线
```http
GET /api/productlines
```

响应示例：
```json
{
  "productlines": [
    {
      "id": "pl-uuid-001",
      "name": "核心业务线",
      "createdAt": 1704067200000
    }
  ]
}
```

#### 创建产品线
```http
POST /api/productlines
Content-Type: application/json

{
  "name": "新产品线"
}
```

### 项目API

#### 获取所有项目
```http
GET /api/projects
```

#### 获取单个项目
```http
GET /api/projects/:id
```

#### 创建项目
```http
POST /api/projects
Content-Type: application/json

{
  "name": "项目名称",
  "productLineId": "pl-uuid-001",
  "startDate": "2025-01-01",
  "endDate": "2025-03-31",
  "status": "开发"
}
```

#### 更新项目
```http
PUT /api/projects/:id
Content-Type: application/json

{
  "name": "更新后的名称",
  "status": "测试"
}
```

#### 删除项目
```http
DELETE /api/projects/:id
```

## 🎯 核心算法

### 时间轴渲染算法

1. 计算时间范围（最早到最晚 + 前后各2个月留白）
2. 计算像素比例（每天3像素）
3. 生成月份刻度和周网格
4. 计算每个项目块的位置和宽度

### 重叠检测与行分配算法

1. 按产品线分组项目
2. 在每个产品线内按开始时间排序
3. 使用贪心算法分配行号：
   - 尝试放在第一行
   - 如果与该行已有项目时间重叠，则尝试下一行
   - 直到找到不冲突的行

## 📊 项目进度

**当前进度**: 85.7% (12/14 任务完成)

### ✅ 已完成
- [x] T1: 项目初始化
- [x] T2: 后端基础架构
- [x] T3: 前端基础架构
- [x] T4: 数据模型与文件处理
- [x] T5: 产品线API
- [x] T6: 项目API
- [x] T7: API服务封装
- [x] T8: 工具函数库
- [x] T9: 项目表单组件
- [x] T10: 时间轴核心组件
- [x] T11: 产品线筛选组件
- [x] T13: 启动脚本

### ⏳ 待完成
- [ ] T12: 前后端集成测试
- [ ] T14: 文档与部署

## 📝 开发文档

详细的开发文档位于 `docs/项目路线图工具/` 目录：

- **ALIGNMENT** - 需求对齐文档
- **CONSENSUS** - 需求共识文档
- **DESIGN** - 系统架构设计（包含详细的算法说明）
- **TASK** - 任务拆分文档（14个原子任务）
- **ACCEPTANCE** - 验收文档（进度跟踪）
- **PROGRESS_SUMMARY** - 进度总结
- **TODO** - 待办事项清单
- **FINAL** - 最终报告

## 🏗 开发规范

本项目遵循 **6A工作流** 规范：

1. **Align** - 需求对齐
2. **Architect** - 架构设计
3. **Atomize** - 任务拆分
4. **Approve** - 人工审批
5. **Automate** - 自动化执行
6. **Assess** - 质量评估

## 🐛 常见问题

### Q: 启动脚本报错"未找到Python"
A: 请确保已安装Python 3.8+，并且在PATH中。macOS可以使用 `python3 --version` 检查。

### Q: npm install 很慢
A: 可以使用国内镜像：`npm install --registry=https://registry.npmmirror.com`

### Q: 端口被占用
A: 修改配置文件中的端口号：
- 后端：`backend/app.py` 中的 `port=5000`
- 前端：`frontend/vite.config.js` 中的 `port: 5173`

### Q: 数据文件在哪里？
A: 数据存储在 `data/` 目录下的JSON文件中：
- `data/projects.json` - 项目数据
- `data/productlines.json` - 产品线数据

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交Issue和Pull Request！

## 📧 联系方式

如有问题或建议，请查看项目文档或提交Issue。

---

**开发时间**: 2025年10月15日  
**技术栈**: React + Ant Design + Flask  
**开发模式**: 6A工作流规范化开发
