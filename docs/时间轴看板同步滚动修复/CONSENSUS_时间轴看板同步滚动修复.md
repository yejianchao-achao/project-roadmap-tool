# 时间轴看板同步滚动修复 - 共识文档

## 明确的需求描述
修复时间轴头部（月份刻度）和内容区域（看板）可以各自独立滚动的bug，实现两者的水平同步滚动。

## 验收标准
1. ✅ 用户滚动内容区域时，头部同步水平滚动
2. ✅ 用户无法直接滚动头部（头部不响应鼠标滚轮和拖拽）
3. ✅ 头部和内容区域始终保持水平位置一致
4. ✅ 不影响垂直滚动功能
5. ✅ 不影响其他现有功能（缩放、初始定位等）

## 技术实现方案

### 方案概述
通过CSS禁用TimelineHeader的滚动能力，使其只能被动跟随内容区域的滚动。

### 具体实现

#### 1. 修改CSS样式
**文件**: `frontend/src/styles/timeline.css`

**修改内容**:
```css
.timeline-header {
  height: 60px;
  background: #fafafa;
  border-bottom: 2px solid #d9d9d9;
  position: sticky;
  top: 0;
  z-index: 10;
  overflow-x: hidden;  /* 改为hidden，禁止独立滚动 */
  overflow-y: hidden;
}
```

**原理说明**:
- 将 `overflow-x: auto` 改为 `overflow-x: hidden`
- 这样header就无法独立滚动
- 但通过JS设置 `scrollLeft` 仍然有效
- 实现了单向控制：内容区域 → 头部

#### 2. 保持现有JS代码
**文件**: `frontend/src/components/Timeline/TimelineView.jsx`

现有的同步滚动代码无需修改，继续工作：
```javascript
useEffect(() => {
  const scrollContainer = scrollContainerRef.current
  const header = headerRef.current

  if (!scrollContainer || !header) return

  const handleScroll = () => {
    header.scrollLeft = scrollContainer.scrollLeft
  }

  scrollContainer.addEventListener('scroll', handleScroll)
  return () => scrollContainer.removeEventListener('scroll', handleScroll)
}, [])
```

### 技术约束
- ✅ 保持现有React组件结构不变
- ✅ 保持现有样式风格不变
- ✅ 不影响其他功能
- ✅ 最小化代码改动

## 任务边界限制
- ✅ 只修改CSS样式文件
- ✅ 不修改React组件代码
- ✅ 只处理水平滚动同步
- ✅ 不改变垂直滚动行为

## 风险评估
- **风险等级**: 极低
- **影响范围**: 仅影响时间轴头部的滚动行为
- **回滚方案**: 将 `overflow-x: hidden` 改回 `overflow-x: auto`

## 所有不确定性已解决
✅ 问题根源明确
✅ 解决方案简单有效
✅ 无需人工决策
✅ 可以直接实施
