# 自适应宽度需求共识文档

## 需求确认
项目看板与时间轴默认按照时间窗口要求的月份数，自适应撑满屏幕。

## 解决方案（已确认）

### 核心思路
将视口宽度从固定像素值改为100%，同时根据实际视口宽度和显示月份数动态计算每天的像素宽度。

### 实现方案

#### 1. 修改视口宽度计算
```javascript
// 修改前
const getViewportWidth = () => {
  if (!timelineParams) return '100%'
  const avgDaysPerMonth = 30
  const viewportWidth = visibleMonths * avgDaysPerMonth * timelineParams.pixelsPerDay
  return `${viewportWidth}px`  // 固定像素值
}

// 修改后
const getViewportWidth = () => {
  return '100%'  // 始终撑满屏幕
}
```

#### 2. 动态计算时间轴参数
添加新的effect来根据视口宽度和月份数重新计算timelineParams：

```javascript
useEffect(() => {
  if (!scrollContainerRef.current || !timelineParams) return
  
  // 获取实际视口宽度
  const viewportWidthPx = scrollContainerRef.current.offsetWidth
  
  // 计算每天像素数（基于显示的月份数）
  const avgDaysPerMonth = 30
  const pixelsPerDay = viewportWidthPx / (visibleMonths * avgDaysPerMonth)
  
  // 计算总天数
  const totalDays = timelineParams.maxDate.diff(timelineParams.minDate, 'day')
  
  // 更新timelineParams
  setTimelineParams(prev => ({
    ...prev,
    pixelsPerDay: pixelsPerDay,
    totalWidth: totalDays * pixelsPerDay
  }))
}, [visibleMonths, scrollContainerRef.current?.offsetWidth])
```

#### 3. 添加窗口resize监听
```javascript
useEffect(() => {
  const handleResize = () => {
    // 触发重新计算（通过改变一个状态来触发上面的effect）
    if (scrollContainerRef.current) {
      const viewportWidthPx = scrollContainerRef.current.offsetWidth
      // 重新计算timelineParams
    }
  }
  
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [visibleMonths])
```

### 关键变化

#### 变化1：视口宽度
- **之前**：根据月份数计算固定像素值
- **现在**：固定为100%，撑满屏幕

#### 变化2：每天像素数
- **之前**：从calculateTimelineParams获取固定值
- **现在**：根据视口宽度和月份数动态计算

#### 变化3：缩放效果
- **之前**：改变视口宽度
- **现在**：改变每天像素数，视口宽度保持100%

## 技术实现细节

### 计算公式
```
视口宽度（像素） = scrollContainer.offsetWidth
每天像素数 = 视口宽度 / (显示月份数 × 30天)
内容总宽度 = 总天数 × 每天像素数
```

### 示例计算
假设：
- 视口宽度 = 1200px
- 显示月份数 = 4个月
- 总天数 = 365天

计算：
- 每天像素数 = 1200 / (4 × 30) = 10px/天
- 内容总宽度 = 365 × 10 = 3650px

### 响应式行为
1. **改变月份数**：
   - 4个月 → 5个月：每天像素数从10px减少到8px
   - 内容更密集，可以看到更多月份

2. **改变窗口大小**：
   - 窗口变大：每天像素数增加，内容更宽松
   - 窗口变小：每天像素数减少，内容更密集

## 验收标准
1. ✅ 时间轴视口始终撑满屏幕宽度（100%）
2. ✅ 改变月份数时，每天像素数自动调整
3. ✅ 窗口大小变化时，自动重新计算布局
4. ✅ 滚动功能正常工作
5. ✅ 头部和内容区域保持同步
6. ✅ 初始定位到当前月份功能正常
7. ✅ 所有现有功能正常工作

## 风险评估
- **风险等级**：中
- **影响范围**：时间轴的宽度计算和渲染逻辑
- **潜在问题**：
  - 需要确保resize监听不会导致性能问题
  - 需要处理好初始化时的计算时机
  - 需要避免无限循环更新

## 实施计划
1. 修改getViewportWidth函数，返回'100%'
2. 添加动态计算pixelsPerDay的useEffect
3. 添加窗口resize监听
4. 测试各种场景（缩放、resize、初始加载）
5. 验证所有功能正常
