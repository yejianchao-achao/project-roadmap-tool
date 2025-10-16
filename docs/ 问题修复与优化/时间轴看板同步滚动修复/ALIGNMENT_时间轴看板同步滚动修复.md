# 时间轴看板同步滚动修复 - 对齐文档

## 原始需求
时间轴和看板没有一起滚动，而是可以各自单独滚动，请修复这一 bug

## 项目上下文分析

### 现有项目结构
- 前端：React + Vite + Ant Design
- 时间轴组件：`frontend/src/components/Timeline/`
  - `TimelineView.jsx` - 主视图组件
  - `TimelineHeader.jsx` - 头部月份刻度
  - `TimelineGrid.jsx` - 背景网格
  - `Swimlane.jsx` - 产品线泳道
- 样式文件：`frontend/src/styles/timeline.css`

### 现有代码分析

#### TimelineView.jsx
```javascript
// 已有同步滚动代码
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

#### timeline.css
```css
.timeline-header {
  height: 60px;
  background: #fafafa;
  border-bottom: 2px solid #d9d9d9;
  position: sticky;
  top: 0;
  z-index: 10;
  overflow-x: auto;  /* 问题所在：允许独立滚动 */
  overflow-y: hidden;
}
```

## 问题根源识别

### 核心问题
TimelineHeader 设置了 `overflow-x: auto`，这使得：
1. Header 可以独立滚动
2. 虽然有JS代码监听内容区域滚动并同步到header，但用户也可以直接滚动header
3. 当用户滚动header时，内容区域不会同步滚动
4. 导致两者可以各自独立滚动，不同步

### 技术约束
- 必须保持现有的React组件结构
- 必须保持现有的样式风格
- 不能影响其他功能（如缩放、初始定位等）

## 需求理解

### 期望行为
1. 时间轴头部（月份刻度）和内容区域（看板）应该水平同步滚动
2. 用户只能通过滚动内容区域来驱动整体滚动
3. 头部应该被动跟随内容区域的滚动

### 边界确认
- 只修复水平滚动同步问题
- 不改变垂直滚动行为
- 不影响其他现有功能

## 疑问澄清
无疑问，问题明确，解决方案清晰。
