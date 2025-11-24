# 项目备注字段 - 共识文档

## 一、需求确认

### 1.1 核心需求
为项目（Project）增加备注（remarks）字段，支持在新建和编辑页面中输入，字段为非必填。

### 1.2 最终共识
- **字段名称**：remarks（备注）
- **字段类型**：字符串（String）
- **是否必填**：否
- **最大长度**：500字符
- **显示控件**：TextArea（多行文本框，4行）
- **默认值**：空字符串（""）
- **兼容性**：使用.get()方法读取，兼容旧数据

## 二、验收标准

### 2.1 功能验收
1. ✅ 新建项目时可以输入备注（可选，0-500字符）
2. ✅ 编辑项目时可以查看和修改备注
3. ✅ 备注为空时项目可以正常保存
4. ✅ 备注超过500字符时显示验证错误
5. ✅ 旧项目（无remarks字段）编辑时不报错，自动补充为空字符串

### 2.2 技术验收
1. ✅ 后端模型正确包含remarks字段
2. ✅ 后端API正确处理remarks字段的创建和更新
3. ✅ 前端表单正确显示和验证remarks字段
4. ✅ 数据存储和读取正常
5. ✅ 向后兼容，不影响现有功能

### 2.3 代码质量
1. ✅ 代码符合项目现有规范
2. ✅ 代码注释完整清晰
3. ✅ 变量命名符合规范

## 三、技术方案

### 3.1 数据模型设计

#### 字段定义
```python
{
    "id": "proj-xxx",
    "name": "项目名称",
    "productLineId": "pl-xxx",
    "ownerId": "owner-xxx",
    "isPending": false,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "status": "开发",
    "remarks": "这是项目备注信息",  # 新增字段
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
}
```

#### 验证规则
- 类型：字符串（str）
- 必填：否（可为空字符串）
- 最小长度：0
- 最大长度：500字符
- 允许值：任意字符串

### 3.2 后端实现

#### 3.2.1 模型层修改 (`backend/models/project.py`)

**修改点1：__init__方法**
```python
def __init__(self, name, productLineId, startDate, endDate, status,
             ownerId=None, isPending=False, remarks='', id=None, createdAt=None, updatedAt=None):
    # ... 其他字段
    self.remarks = remarks  # 新增字段
    # ...
```

**修改点2：validate方法**
```python
def validate(self):
    # ... 现有验证
    
    # 验证备注（新增）
    if self.remarks is not None and not isinstance(self.remarks, str):
        raise ValueError("备注必须是字符串类型")
    
    if self.remarks and len(self.remarks) > 500:
        raise ValueError("备注长度不能超过500个字符")
```

**修改点3：to_dict方法**
```python
def to_dict(self):
    return {
        # ... 其他字段
        'remarks': self.remarks,  # 新增字段
        # ...
    }
```

**修改点4：from_dict方法**
```python
@classmethod
def from_dict(cls, data):
    return cls(
        # ... 其他字段
        remarks=data.get('remarks', ''),  # 新增，使用get兼容旧数据
        # ...
    )
```

**修改点5：update方法**
```python
def update(self, **kwargs):
    allowed_fields = ['name', 'productLineId', 'ownerId', 'startDate', 
                      'endDate', 'status', 'isPending', 'remarks']  # 添加remarks
    # ...
```

#### 3.2.2 服务层修改 (`backend/services/project_service.py`)

**修改点：create方法**
```python
def create(self, name, productLineId, ownerId, startDate, endDate, status, 
           isPending=False, remarks=''):
    """
    创建新项目
    
    Args:
        # ... 其他参数
        remarks: 备注（可选，默认为空字符串）
    """
    project = Project(
        name=name,
        productLineId=productLineId,
        ownerId=ownerId,
        startDate=startDate,
        endDate=endDate,
        status=status,
        isPending=isPending,
        remarks=remarks  # 新增参数
    )
    # ...
```

#### 3.2.3 路由层修改 (`backend/routes/projects.py`)

**修改点1：create_project函数**
```python
@projects_bp.route('/api/projects', methods=['POST'])
@handle_errors
def create_project():
    """
    创建新项目
    
    Request Body:
        {
            # ... 其他字段
            "remarks": "备注内容"  # 可选
        }
    """
    data = request.get_json()
    
    # ... 现有代码
    
    project = service.create(
        # ... 其他参数
        remarks=data.get('remarks', '')  # 新增参数
    )
    # ...
```

**修改点2：update_project函数**
```python
@projects_bp.route('/api/projects/<project_id>', methods=['PUT'])
@handle_errors
def update_project(project_id):
    """
    更新项目
    
    Request Body:
        {
            # ... 其他字段
            "remarks": "新的备注内容"  # 可选
        }
    """
    # ... 现有代码
    
    allowed_fields = ['name', 'productLineId', 'ownerId', 'startDate', 
                      'endDate', 'status', 'isPending', 'remarks']  # 添加remarks
    # ...
```

### 3.3 前端实现

#### 3.3.1 组件修改 (`frontend/src/components/ProjectModal.jsx`)

**修改点1：编辑模式表单回填**
```javascript
useEffect(() => {
  if (visible && editingProject) {
    form.setFieldsValue({
      // ... 其他字段
      remarks: editingProject.remarks || ''  // 新增字段回填
    })
  }
  // ...
}, [visible, editingProject, form])
```

**修改点2：表单提交处理**
```javascript
const handleSubmit = async () => {
  try {
    const values = await form.validateFields()
    
    const projectData = {
      // ... 其他字段
      remarks: values.remarks || ''  // 新增字段
    }
    // ...
  }
  // ...
}
```

**修改点3：添加表单项（在"暂定"字段之后）**
```javascript
{/* 暂定 */}
<Form.Item
  label="暂定"
  name="isPending"
  valuePropName="checked"
  tooltip="勾选表示项目计划尚未确定"
>
  <Checkbox>项目计划暂未确定</Checkbox>
</Form.Item>

{/* 备注 - 新增 */}
<Form.Item
  label="备注"
  name="remarks"
  rules={[
    { max: 500, message: '备注不能超过500个字符' }
  ]}
>
  <Input.TextArea 
    placeholder="请输入项目备注（可选）" 
    rows={4}
    maxLength={500}
    showCount
  />
</Form.Item>
```

### 3.4 兼容性处理

#### 旧数据兼容
1. **后端读取**：使用 `data.get('remarks', '')` 确保旧数据没有remarks字段时返回空字符串
2. **前端显示**：使用 `editingProject.remarks || ''` 确保undefined时显示空字符串
3. **存储处理**：新保存的数据都包含remarks字段（即使为空）

## 四、实施计划

### 4.1 实施顺序
1. 修改后端模型层（Project类）
2. 修改后端服务层（ProjectService）
3. 修改后端路由层（projects_bp）
4. 修改前端组件（ProjectModal）
5. 测试验证

### 4.2 测试计划
1. **单元测试**：
   - 创建带remarks的项目
   - 创建不带remarks的项目
   - 更新项目的remarks
   - 验证remarks长度限制

2. **集成测试**：
   - 测试前端表单提交
   - 测试旧项目编辑（无remarks字段）
   - 测试remarks的显示和保存

3. **回归测试**：
   - 确认现有功能不受影响
   - 确认项目列表正常显示
   - 确认其他字段功能正常

## 五、风险和应对

### 5.1 风险识别
1. **数据兼容性风险**：旧项目数据没有remarks字段
   - 应对：使用.get()方法和默认值
   
2. **表单验证风险**：remarks可能为None、空字符串或undefined
   - 应对：统一处理为空字符串

### 5.2 回滚方案
如果出现问题，回滚步骤：
1. 前端：移除remarks表单项
2. 后端：从allowed_fields中移除remarks（不影响已存储数据）
3. 数据：已存储的remarks数据保留（不影响系统运行）

## 六、项目特性对齐

### 6.1 代码规范
- 遵循Python PEP 8规范
- 遵循React代码规范
- 注释使用中文
- 函数添加docstring说明

### 6.2 命名规范
- 后端：使用snake_case（remarks）
- 前端：使用camelCase（remarks）
- 显示：使用中文（备注）

### 6.3 技术约束
- 与现有字段保持一致的处理方式
- 使用项目现有的验证模式
- 复用Ant Design组件
