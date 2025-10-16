# 时间轴头部滚动同步问题 - 共识文档

## 问题确认

### 用户反馈
测试后发现看板内容滚动时，头部时间轴没有跟随滚动，导致项目的起止时间与时间轴对不上。

### 问题验证（通过Chrome DevTools）
1. **初始状态检查**：
   - `scrollContainer.scrollLeft`: 650.5（内容已滚动）
   - `headerContent.transform`: "none"（头部未同步）
   - 结果：头部和内容不同步

2. **手动同步测试**：
   - 手动设置：`headerContent.style.transform = 'translateX(-650.5px)'`
   - 结果：头部立即同步，时间轴与项目条完美对齐
   - 结论：transform机制本身是有效的

### 根本原因
虽然代码中存在滚动同步逻辑，但存在以下问题：

1. **事件监听器时机问题**：
   ```javascript
   useEffect(() => {
     const scrollContainer = scrollContainerRef.current
     const header = headerRef.current
     // ...
     scrollContainer.addEventListener('scroll', handleScroll)
     return () => scrollContainer.removeEventListener('scroll', handleScroll)
   }, [])  // 空依赖数组
   ```
   - 空依赖数组导致只在组件首次挂载时执行
   - 但初始化滚动位置的useEffect在后面执行
   - 导致初始滚动不会触发同步

2. **初始化顺序问题**：
   - 先建立scroll事件监听器
   - 后执行初始化滚动（scrollLeft = xxx）
   - 但初始化滚动可能不触发scroll事件（某些浏览器行为）

## 技术方案

### 方案：增强滚动同步逻辑

#### 1. 添加初始同步
在建立事件监听器后，立即执行一次同步，确保初始状态正确。

#### 2. 在初始化滚动后也执行同步
在设置初始scrollLeft后，手动触发一次同步。

#### 3. 添加依赖项
将timelineParams添加到依赖数组，确保参数变化时重新建立监听器。

### 实现细节

```javascript
// 1. 提取同步函数
const syncHeaderScroll = useCallback(() => {
  const scrollContainer = scrollContainerRef.current
  const header = headerRef.current
  if (!scrollContainer || !header) return
  
  const headerContent = header.querySelector('.timeline-header-content')
  if (headerContent) {
    headerContent.style.transform = `translateX(-${scrollContainer.scrollLeft}px)`
  }
}, [])

// 2. 滚动事件监听（添加初始同步）
useEffect(() => {
  const scrollContainer = scrollContainerRef.current
  if (!scrollContainer) return

  scrollContainer.addEventListener('scroll', syncHeaderScroll)
  
  // 立即执行一次同步，确保初始状态正确
  syncHeaderScroll()
  
  return () => scrollContainer.removeEventListener('scroll', syncHeaderScroll)
}, [syncHeaderScroll])

// 3. 初始化滚动后也执行同步
useEffect(() => {
  if (!timelineParams?.pixelsPerDay || !scrollContainerRef.current) return
  
  // ... 设置scrollLeft的代码 ...
  
  requestAnimationFrame(() => {
    scrollContainer.scrollLeft = scrollLeft
    // 手动触发一次同步
    syncHeaderScroll()
  })
}, [timelineParams?.pixelsPerDay, timelineParams?.minDate, timelineParams?.totalWidth, syncHeaderScroll])
```

## 验收标准

1. ✅ 页面加载后，头部时间轴与内容区域初始位置对齐
2. ✅ 用户滚动内容区域时，头部时间轴实时同步
3. ✅ 切换产品线、缩放视图后，同步功能仍然正常
4. ✅ 无性能问题，滚动流畅

## 技术约束

- 使用React Hooks（useCallback, useEffect）
- 保持现有组件结构
- 不引入新的依赖库
- 确保性能不受影响

## 风险评估

- **低风险**：修改仅涉及事件监听器的建立和同步函数的调用时机
- **兼容性**：transform和scroll事件在所有现代浏览器中都有良好支持
- **性能**：useCallback确保函数引用稳定，避免不必要的重新渲染
