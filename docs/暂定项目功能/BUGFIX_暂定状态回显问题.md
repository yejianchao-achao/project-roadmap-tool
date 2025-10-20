# Bug修复报告 - 暂定状态回显问题

## 问题描述

**发现时间**: 2025-10-20 14:57

**问题现象**: 
用户在编辑项目时勾选"暂定"选项并保存后，再次打开该项目的编辑弹窗时，发现"暂定"复选框仍然显示为未勾选状态。

**影响范围**:
- 新建项目时勾选暂定 → 保存失败
- 编辑项目时勾选暂定 → 保存失败
- 编辑项目时取消暂定 → 保存失败

**严重程度**: 🔴 高（核心功能完全不可用）

## 问题分析

### 根本原因

后端API层（routes）和服务层（service）在处理 `isPending` 字段时存在遗漏：

1. **routes/projects.py - create_project函数**
   - 问题：未从请求体中获取 `isPending` 参数
   - 结果：创建项目时 `isPending` 始终为默认值 `False`

2. **routes/projects.py - update_project函数**
   - 问题：`allowed_fields` 列表中未包含 `isPending`
   - 结果：更新项目时 `isPending` 字段被忽略

3. **services/project_service.py - create方法**
   - 问题：方法签名中缺少 `isPending` 参数
   - 结果：无法接收和处理 `isPending` 值

### 数据流分析

```
前端表单 → API请求 → routes层 → service层 → model层 → 数据文件
   ✅         ✅         ❌          ❌         ✅         ❌
```

**问题点**:
- routes层：未传递 `isPending` 参数
- service层：未接收 `isPending` 参数

## 修复方案

### 修复内容

#### 1. 修复 backend/services/project_service.py

**修改位置**: 第45行 - create方法签名

**修改前**:
```python
def create(self, name, productLineId, ownerId, startDate, endDate, status):
```

**修改后**:
```python
def create(self, name, productLineId, ownerId, startDate, endDate, status, isPending=False):
```

**修改位置**: 第66-72行 - Project对象创建

**修改前**:
```python
project = Project(
    name=name,
    productLineId=productLineId,
    ownerId=ownerId,
    startDate=startDate,
    endDate=endDate,
    status=status
)
```

**修改后**:
```python
project = Project(
    name=name,
    productLineId=productLineId,
    ownerId=ownerId,
    startDate=startDate,
    endDate=endDate,
    status=status,
    isPending=isPending
)
```

#### 2. 修复 backend/routes/projects.py

**修改位置**: 第92-98行 - create_project函数

**修改前**:
```python
project = service.create(
    name=data['name'],
    productLineId=data['productLineId'],
    ownerId=data['ownerId'],
    startDate=data['startDate'],
    endDate=data['endDate'],
    status=data['status']
)
```

**修改后**:
```python
project = service.create(
    name=data['name'],
    productLineId=data['productLineId'],
    ownerId=data['ownerId'],
    startDate=data['startDate'],
    endDate=data['endDate'],
    status=data['status'],
    isPending=data.get('isPending', False)
)
```

**修改位置**: 第137行 - update_project函数

**修改前**:
```python
allowed_fields = ['name', 'productLineId', 'ownerId', 'startDate', 'endDate', 'status']
```

**修改后**:
```python
allowed_fields = ['name', 'productLineId', 'ownerId', 'startDate', 'endDate', 'status', 'isPending']
```

## 修复验证

### 验证步骤

1. ✅ 重启后端服务
2. ⏳ 创建新项目并勾选暂定
3. ⏳ 验证项目保存成功
4. ⏳ 重新打开编辑弹窗
5. ⏳ 验证暂定复选框已勾选
6. ⏳ 取消暂定并保存
7. ⏳ 验证复选框已取消勾选

### 预期结果

- 新建项目时勾选暂定 → 保存成功，再次打开显示已勾选
- 编辑项目时勾选暂定 → 保存成功，再次打开显示已勾选
- 编辑项目时取消暂定 → 保存成功，再次打开显示未勾选
- 项目块边框样式正确（暂定=虚线，非暂定=实线）

## 修复总结

### 修改文件
- `backend/services/project_service.py` - 2处修改
- `backend/routes/projects.py` - 2处修改

### 修改行数
- 总计约10行代码修改

### 修复时间
- 发现问题：2025-10-20 14:57
- 开始修复：2025-10-20 14:58
- 完成修复：2025-10-20 14:59
- 总耗时：约2分钟

### 经验教训

1. **完整性检查**：新增字段时需要检查完整的数据流路径
   - 前端表单 ✅
   - API请求 ✅
   - routes层 ❌（遗漏）
   - service层 ❌（遗漏）
   - model层 ✅
   - 数据存储 ✅

2. **测试覆盖**：应该进行端到端测试
   - 不仅测试UI显示
   - 还要测试数据持久化
   - 以及数据回显

3. **代码审查**：新功能开发时应该审查所有相关层
   - Model层（数据模型）
   - Service层（业务逻辑）
   - Routes层（API接口）
   - Frontend层（用户界面）

## 后续行动

### 立即行动
- [x] 修复代码
- [x] 重启服务
- [ ] 用户验证测试

### 改进措施
1. 建立字段变更检查清单
2. 增加端到端测试用例
3. 完善代码审查流程

## 附录

### 相关文件
- `backend/models/project.py` - 数据模型（已正确实现）
- `backend/services/project_service.py` - 服务层（已修复）
- `backend/routes/projects.py` - API路由（已修复）
- `frontend/src/components/ProjectModal.jsx` - 前端表单（已正确实现）
- `frontend/src/components/Timeline/ProjectBar.jsx` - 显示组件（已正确实现）

### 测试数据
```json
{
  "name": "测试暂定项目",
  "productLineId": "pl_001",
  "ownerId": "owner_001",
  "startDate": "2025-10-21",
  "endDate": "2025-10-31",
  "status": "开发",
  "isPending": true
}
```

---

**修复人员**: Cline AI  
**修复日期**: 2025-10-20  
**修复版本**: v1.0.1  
**修复状态**: ✅ 代码已修复，⏳ 待用户验证
