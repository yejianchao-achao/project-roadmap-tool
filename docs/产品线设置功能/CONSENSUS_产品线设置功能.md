# 产品线设置功能 - 共识文档

## 一、需求描述

将现有的"产品线筛选"功能改造为"产品线显示设置"功能，实现配置的持久化存储，使用户的产品线显示偏好在页面刷新后仍然保持。

## 二、明确的需求边界

### 2.1 功能范围
- ✅ 将临时筛选改为持久化设置
- ✅ 配置自动保存，无需手动操作
- ✅ 页面刷新后自动加载之前的配置
- ✅ 首次使用时默认显示所有产品线
- ✅ UI文案从"筛选"改为"设置"

### 2.2 不包含的功能
- ❌ 多用户配置隔离（当前为单用户系统）
- ❌ 配置的导入导出功能
- ❌ 配置历史记录
- ❌ 其他类型的用户设置（本次只涉及产品线显示）

## 三、技术实现方案

### 3.1 配置存储方案
**方案：后端JSON文件存储**
- 存储位置：`data/settings.json`
- 存储格式：
```json
{
  "visibleProductLines": ["id1", "id2", "id3"]
}
```
- 理由：与现有架构一致，便于备份和迁移，可扩展性好

### 3.2 保存时机
**方案：实时自动保存**
- 触发时机：每次用户勾选/取消勾选产品线时
- 实现方式：前端调用保存API，后端立即写入文件
- 理由：用户体验最佳，符合"设置"的语义

### 3.3 默认配置
**方案：首次使用时全选所有产品线**
- 判断逻辑：如果settings.json不存在或visibleProductLines为空
- 默认行为：自动选中所有产品线ID
- 理由：避免空白页面，符合用户预期

### 3.4 UI文案
**方案：改为"产品线显示设置"**
- 原文案：产品线筛选
- 新文案：产品线显示设置
- 理由：更准确表达功能含义

## 四、技术架构设计

### 4.1 后端架构

#### 4.1.1 数据模型
```python
# backend/models/settings.py
class Settings:
    def __init__(self, visibleProductLines=None):
        self.visibleProductLines = visibleProductLines or []
    
    def to_dict(self):
        return {
            'visibleProductLines': self.visibleProductLines
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(visibleProductLines=data.get('visibleProductLines', []))
```

#### 4.1.2 服务层
```python
# backend/services/settings_service.py
class SettingsService:
    def __init__(self):
        self.data_file = get_data_file_path('settings.json')
    
    def get_settings(self):
        """获取用户设置"""
        pass
    
    def update_visible_productlines(self, productline_ids):
        """更新可见产品线配置"""
        pass
```

#### 4.1.3 路由层
```python
# backend/routes/settings.py
@bp.route('/settings', methods=['GET'])
def get_settings():
    """获取用户设置"""
    pass

@bp.route('/settings/visible-productlines', methods=['PUT'])
def update_visible_productlines():
    """更新可见产品线配置"""
    pass
```

### 4.2 前端架构

#### 4.2.1 API服务
```javascript
// frontend/src/services/api.js
export async function getSettings() {
  // 获取用户设置
}

export async function updateVisibleProductLines(productLineIds) {
  // 更新可见产品线配置
}
```

#### 4.2.2 组件改造
```javascript
// frontend/src/components/ProductLineSettings.jsx
// 重命名并改造ProductLineFilter组件
function ProductLineSettings({ productLines, selectedProductLines, onSelectionChange }) {
  // 保持现有交互逻辑
  // 更新UI文案
}
```

#### 4.2.3 主应用逻辑
```javascript
// frontend/src/App.jsx
function App() {
  // 1. 页面加载时先获取设置
  // 2. 根据设置初始化selectedProductLines
  // 3. 用户更改选择时自动保存
}
```

## 五、数据流设计

### 5.1 初始化流程
```
1. 用户打开页面
2. App组件挂载
3. 并行请求：
   - getSettings() -> 获取配置
   - getProductLines() -> 获取产品线列表
   - getProjects() -> 获取项目列表
4. 处理配置：
   - 如果配置存在：使用配置中的visibleProductLines
   - 如果配置不存在：使用所有产品线ID作为默认值
5. 设置selectedProductLines状态
6. 渲染页面
```

### 5.2 配置更新流程
```
1. 用户勾选/取消勾选产品线
2. 触发onSelectionChange回调
3. 更新本地状态selectedProductLines
4. 调用updateVisibleProductLines(selectedProductLines)
5. 后端保存到settings.json
6. 返回成功响应
```

### 5.3 错误处理流程
```
配置加载失败：
- 使用降级方案：默认显示所有产品线
- 显示警告提示（不阻塞用户使用）

配置保存失败：
- 显示错误提示
- 本地状态已更新（用户当前会话仍可用）
- 下次刷新会恢复到上次成功保存的状态
```

## 六、集成方案

### 6.1 与现有系统的集成点

1. **数据文件系统**
   - 新增：`data/settings.json`
   - 复用：`backend/utils/file_handler.py`

2. **后端路由系统**
   - 新增：`backend/routes/settings.py`
   - 注册：在`backend/app.py`中注册settings蓝图

3. **前端API服务**
   - 扩展：`frontend/src/services/api.js`
   - 新增：settings相关API函数

4. **前端组件系统**
   - 重命名：`ProductLineFilter` -> `ProductLineSettings`
   - 更新：`App.jsx`中的引用和逻辑

### 6.2 不影响的现有功能
- ✅ 项目的创建、编辑、删除
- ✅ 产品线的创建
- ✅ 时间轴的显示和交互
- ✅ 项目状态的管理

## 七、验收标准

### 7.1 功能验收
1. ✅ 首次打开页面，默认显示所有产品线
2. ✅ 勾选/取消勾选产品线后，配置自动保存
3. ✅ 刷新页面后，显示之前保存的配置
4. ✅ 关闭浏览器重新打开，配置仍然保持
5. ✅ UI文案显示为"产品线显示设置"
6. ✅ 全选/取消全选功能正常工作

### 7.2 技术验收
1. ✅ settings.json文件格式正确
2. ✅ API接口返回格式符合规范
3. ✅ 错误处理完善，有合理的降级方案
4. ✅ 代码符合现有规范和注释要求
5. ✅ 无控制台错误或警告

### 7.3 性能验收
1. ✅ 配置加载不阻塞页面渲染
2. ✅ 配置保存响应时间 < 500ms
3. ✅ 不影响现有功能的性能

## 八、实施计划

### 8.1 开发顺序
1. 后端开发（优先）
   - 创建Settings模型
   - 创建SettingsService
   - 创建settings路由
   - 初始化settings.json文件

2. 前端开发
   - 扩展API服务
   - 改造ProductLineFilter组件
   - 更新App.jsx逻辑

3. 集成测试
   - 功能测试
   - 边界测试
   - 错误处理测试

### 8.2 测试策略
1. **单元测试**
   - 后端：SettingsService的读写逻辑
   - 前端：配置加载和保存逻辑

2. **集成测试**
   - 完整的配置保存和加载流程
   - 错误场景的降级处理

3. **手动测试**
   - 首次使用场景
   - 配置更新场景
   - 页面刷新场景
   - 错误场景

## 九、风险控制

### 9.1 技术风险及应对
| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 配置文件损坏 | 低 | 使用try-catch捕获，降级到默认配置 |
| 配置加载时序问题 | 中 | 使用Promise.all确保配置先于渲染完成 |
| 频繁保存影响性能 | 低 | 当前实时保存，如有问题可加防抖 |

### 9.2 用户体验风险及应对
| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 配置丢失 | 低 | 降级到默认配置（全选） |
| 保存失败 | 低 | 显示错误提示，当前会话仍可用 |
| 首次使用困惑 | 极低 | 默认全选，符合用户预期 |

## 十、后续扩展

此次实现为未来功能扩展预留了空间：

1. **更多用户设置**
   - 时间轴缩放比例
   - 主题颜色偏好
   - 默认项目状态

2. **配置管理功能**
   - 配置重置
   - 配置导入导出
   - 配置备份

3. **多用户支持**
   - 用户身份识别
   - 用户级配置隔离
   - 配置同步

## 十一、交付物清单

### 11.1 代码文件
- ✅ `backend/models/settings.py` - 设置数据模型
- ✅ `backend/services/settings_service.py` - 设置服务层
- ✅ `backend/routes/settings.py` - 设置路由
- ✅ `frontend/src/components/ProductLineSettings.jsx` - 重命名后的组件
- ✅ `frontend/src/services/api.js` - 扩展API服务
- ✅ `frontend/src/App.jsx` - 更新主应用逻辑

### 11.2 数据文件
- ✅ `data/settings.json` - 用户设置存储文件

### 11.3 文档
- ✅ ALIGNMENT文档
- ✅ CONSENSUS文档
- ⏳ DESIGN文档
- ⏳ TASK文档
- ⏳ ACCEPTANCE文档
- ⏳ FINAL文档
