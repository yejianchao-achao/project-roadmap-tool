# 时间轴滚动问题对齐文档

## 问题描述
测试发现时间轴头部（月份刻度）没有跟着看板内容区域进行缩放与滚动同步。

## 问题分析

### 1. 当前实现逻辑
查看 `TimelineView.jsx` 代码，发现：

**滚动同步机制**：
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

**视口宽度控制**：
```javascript
<div 
  className="timeline-scroll-container" 
  ref={scrollContainerRef}
  style={{ width: getViewportWidth() }}
>
```

### 2. 问题根源

#### 问题1：时间轴头部没有应用视口宽度限制
- **现象**：`timeline-header` 没有设置宽度限制，始终显示完整宽度
- **原因**：TimelineHeader组件没有接收和应用视口宽度参数
- **影响**：当缩放改变视口宽度时，头部不会跟着缩放

#### 问题2：CSS样式冲突
查看 `timeline.css`：
```css
.timeline-header {
  height: 60px;
  background: #fafafa;
  border-bottom: 2px solid #d9d9d9;
  position: sticky;
  top: 0;
  z-index: 10;
  overflow-x: auto;  /* 这里允许头部独立滚动 */
  overflow-y: hidden;
}
```

- **问题**：`overflow-x: auto` 使头部可以独立滚动，但实际上我们需要它跟随内容区域滚动
- **冲突**：头部有自己的滚动条，与内容区域的滚动不同步

### 3. 预期行为
1. 时间轴头部应该与内容区域保持相同的视口宽度
2. 当用户缩放（改变visibleMonths）时，头部和内容区域应该同步缩放
3. 当用户水平滚动内容区域时，头部应该同步滚动
4. 头部不应该有独立的滚动条

## 解决方案

### 方案1：统一视口宽度控制（推荐）
1. 修改 `TimelineView.jsx`：
   - 将视口宽度参数传递给 TimelineHeader
   - 让头部和内容区域使用相同的宽度限制

2. 修改 `TimelineHeader.jsx`：
   - 接收视口宽度参数
   - 应用宽度限制到头部容器

3. 修改 `timeline.css`：
   - 移除头部的 `overflow-x: auto`
   - 改为 `overflow: hidden`，防止独立滚动

### 方案2：使用容器包裹（备选）
- 创建一个外层容器同时包裹头部和内容区域
- 在外层容器上应用视口宽度和滚动控制
- 头部和内容区域都不设置overflow

## 技术约束
- 必须保持现有的滚动同步机制
- 不能破坏现有的缩放功能
- 需要保持响应式设计
- 确保性能不受影响

## 验收标准
1. 时间轴头部宽度与内容区域宽度一致
2. 缩放时头部和内容区域同步缩放
3. 滚动时头部和内容区域同步滚动
4. 头部不出现独立的滚动条
5. 所有现有功能正常工作
