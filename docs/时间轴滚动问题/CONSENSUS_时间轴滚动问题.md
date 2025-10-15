# 时间轴滚动问题共识文档

## 问题确认
时间轴头部（月份刻度）没有跟着看板内容区域进行缩放与滚动同步。

## 根本原因
1. **视口宽度不一致**：TimelineHeader组件没有应用与内容区域相同的视口宽度限制
2. **CSS样式冲突**：头部设置了 `overflow-x: auto`，导致可以独立滚动

## 解决方案（已确认）

### 采用方案1：统一视口宽度控制

#### 修改内容

**1. TimelineView.jsx**
- 将 `getViewportWidth()` 的返回值传递给 TimelineHeader 组件
- 确保头部和内容区域使用相同的宽度限制

**2. TimelineHeader.jsx**
- 添加 `viewportWidth` 参数
- 在头部容器上应用宽度样式

**3. timeline.css**
- 修改 `.timeline-header` 的 `overflow-x` 从 `auto` 改为 `hidden`
- 防止头部出现独立滚动条

## 技术实现方案

### 代码修改点

#### 1. TimelineView.jsx 修改
```javascript
// 传递视口宽度给头部组件
<TimelineHeader 
  timelineParams={timelineParams} 
  headerRef={headerRef}
  viewportWidth={getViewportWidth()}
/>
```

#### 2. TimelineHeader.jsx 修改
```javascript
function TimelineHeader({ timelineParams, headerRef, viewportWidth }) {
  const monthTicks = generateMonthTicks(timelineParams)

  return (
    <div 
      className="timeline-header" 
      ref={headerRef}
      style={{ width: viewportWidth }}  // 应用视口宽度
    >
      <div 
        className="timeline-header-content" 
        style={{ width: `${timelineParams.totalWidth}px` }}
      >
        {/* ... */}
      </div>
    </div>
  )
}
```

#### 3. timeline.css 修改
```css
.timeline-header {
  height: 60px;
  background: #fafafa;
  border-bottom: 2px solid #d9d9d9;
  position: sticky;
  top: 0;
  z-index: 10;
  overflow: hidden;  /* 改为 hidden，防止独立滚动 */
}
```

## 验收标准
1. ✅ 时间轴头部宽度与内容区域宽度一致
2. ✅ 缩放时头部和内容区域同步缩放
3. ✅ 滚动时头部和内容区域同步滚动
4. ✅ 头部不出现独立的滚动条
5. ✅ 所有现有功能正常工作（缩放、初始定位、产品线过滤等）

## 风险评估
- **风险等级**：低
- **影响范围**：仅影响时间轴头部的显示和滚动行为
- **回滚方案**：简单，只需恢复三个文件的修改

## 实施计划
1. 修改 TimelineHeader.jsx（添加视口宽度参数）
2. 修改 TimelineView.jsx（传递视口宽度）
3. 修改 timeline.css（修改overflow样式）
4. 测试验证所有功能
