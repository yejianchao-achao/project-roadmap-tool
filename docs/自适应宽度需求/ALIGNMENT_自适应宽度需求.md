# 自适应宽度需求对齐文档

## 需求描述
项目看板与时间轴默认按照时间窗口要求的月份数，自适应撑满屏幕。

## 当前实现分析

### 现有逻辑
查看 `TimelineView.jsx` 中的 `getViewportWidth()` 函数：

```javascript
const getViewportWidth = () => {
  if (!timelineParams) return '100%'
  
  // 平均每月30天
  const avgDaysPerMonth = 30
  const viewportWidth = visibleMonths * avgDaysPerMonth * timelineParams.pixelsPerDay
  
  return `${viewportWidth}px`  // 返回固定像素值
}
```

**问题**：
- 视口宽度是基于月份数和每天像素数计算的固定值
- 不会自适应屏幕宽度
- 当屏幕宽度变化时，视口宽度不会自动调整

### 需求理解

#### 核心需求
1. **自适应撑满屏幕**：时间轴视口应该始终占满可用屏幕宽度（100%）
2. **按月份数调整密度**：根据设置的月份数，自动调整每天的像素宽度
3. **保持滚动功能**：内容总宽度（12个月）仍然大于视口宽度，需要滚动查看

#### 实现逻辑
- **视口宽度**：固定为100%（撑满屏幕）
- **内容宽度**：保持原有的12个月总宽度
- **每天像素数**：根据视口宽度和显示月份数动态计算
- **缩放效果**：改变月份数时，调整每天像素数，而不是改变视口宽度

## 解决方案

### 方案设计

#### 1. 修改视口宽度逻辑
```javascript
// 修改前：返回固定像素值
const getViewportWidth = () => {
  return `${viewportWidth}px`
}

// 修改后：返回100%
const getViewportWidth = () => {
  return '100%'  // 始终撑满屏幕
}
```

#### 2. 动态计算每天像素数
需要根据实际视口宽度和显示月份数，动态计算 `pixelsPerDay`：

```javascript
// 获取实际视口宽度（像素）
const viewportWidthPx = scrollContainerRef.current?.offsetWidth || 1200

// 计算每天像素数
const avgDaysPerMonth = 30
const pixelsPerDay = viewportWidthPx / (visibleMonths * avgDaysPerMonth)

// 更新timelineParams
const updatedParams = {
  ...timelineParams,
  pixelsPerDay: pixelsPerDay,
  totalWidth: totalDays * pixelsPerDay
}
```

#### 3. 响应窗口大小变化
添加窗口resize监听，当窗口大小变化时重新计算：

```javascript
useEffect(() => {
  const handleResize = () => {
    // 重新计算pixelsPerDay和totalWidth
  }
  
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [visibleMonths])
```

## 技术约束
- 必须保持现有的滚动同步机制
- 必须保持缩放功能（改变月份数）
- 需要响应窗口大小变化
- 确保性能不受影响

## 验收标准
1. ✅ 时间轴视口始终撑满屏幕宽度（100%）
2. ✅ 改变月份数时，每天像素数自动调整
3. ✅ 窗口大小变化时，自动重新计算布局
4. ✅ 滚动功能正常工作
5. ✅ 头部和内容区域保持同步
6. ✅ 所有现有功能正常工作
