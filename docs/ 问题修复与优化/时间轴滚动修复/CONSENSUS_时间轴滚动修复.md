# 时间轴滚动修复 - 共识文档

## 一、需求确认

### 1.1 核心问题
1. **头部滚动同步失效**：时间轴头部（月份刻度）没有跟随内容区域滚动
2. **初始定位缺失**：页面加载时没有自动滚动到当前时间位置

### 1.2 期望行为
1. 滚动内容区域时，头部月份刻度实时同步滚动
2. 页面加载后自动定位到当前月份，且当前月份显示在视口左侧1/4位置
3. 缩放视图后重新定位到当前月份

## 二、技术实现方案

### 2.1 问题1修复：头部滚动同步

**根本原因**：
- CSS设置了`overflow: hidden`，阻止了头部的滚动显示
- 虽然JS正确设置了scrollLeft，但视觉上无法看到滚动效果

**解决方案**：
```css
.timeline-header {
  overflow-x: auto;      /* 允许水平滚动 */
  overflow-y: hidden;    /* 禁止垂直滚动 */
}

.timeline-header::-webkit-scrollbar {
  display: none;         /* 隐藏滚动条，保持界面简洁 */
}
```

### 2.2 问题2修复：初始定位

**根本原因**：
- useEffect依赖项不够精确，pixelsPerDay是异步计算的
- 100ms延迟可能不够，DOM可能还未完全渲染
- 滚动位置计算不够合理

**解决方案**：
```javascript
/**
 * 初始化时滚动到当前月份（改进版）
 */
useEffect(() => {
  if (!timelineParams?.pixelsPerDay || !scrollContainerRef.current) return

  const scrollContainer = scrollContainerRef.current
  const { minDate, pixelsPerDay, totalWidth } = timelineParams
  const now = dayjs()
  
  // 计算当前日期距离起始日期的天数
  const daysFromStart = now.diff(minDate, 'day')
  
  // 计算当前日期的像素位置
  const currentDatePosition = daysFromStart * pixelsPerDay
  
  // 获取视口宽度
  const viewportWidth = scrollContainer.offsetWidth
  
  // 让当前日期显示在视口左侧1/4位置
  const scrollLeft = Math.max(0, currentDatePosition - viewportWidth / 4)
  
  // 使用requestAnimationFrame确保DOM已渲染
  requestAnimationFrame(() => {
    scrollContainer.scrollLeft = scrollLeft
  })
}, [timelineParams?.pixelsPerDay, timelineParams?.minDate, timelineParams?.totalWidth])
```

### 2.3 缩放后重新定位

**需求**：缩放改变显示月份数后，应重新定位到当前月份

**解决方案**：
- 监听visibleMonths变化
- 在pixelsPerDay重新计算后，触发重新定位
- 复用初始定位的逻辑

## 三、实现约束

### 3.1 技术约束
- 不引入新的依赖库
- 使用React Hooks机制
- 保持代码简洁可维护
- 不影响现有功能

### 3.2 性能约束
- 滚动同步不能有明显延迟
- 避免频繁的DOM操作
- 使用requestAnimationFrame优化渲染

### 3.3 兼容性约束
- 支持不同窗口尺寸
- 支持窗口大小调整
- 支持缩放功能
- 支持产品线筛选

## 四、验收标准

### 4.1 功能验收

**测试场景1：头部滚动同步**
- 操作：滚动内容区域
- 预期：头部月份刻度实时同步滚动，完全对齐
- 验证：头部和内容的月份标记始终对齐

**测试场景2：初始定位**
- 操作：刷新页面或首次加载
- 预期：自动滚动到当前月份，当前月份在视口左侧1/4位置
- 验证：当前月份可见，且有合理的前后上下文

**测试场景3：缩放后定位**
- 操作：点击缩放按钮改变显示月份数
- 预期：缩放完成后重新定位到当前月份
- 验证：缩放后当前月份仍然可见

**测试场景4：窗口调整**
- 操作：调整浏览器窗口大小
- 预期：布局自适应，滚动同步正常
- 验证：窗口调整后功能正常

### 4.2 性能验收
- 滚动流畅，无卡顿
- 初始定位快速，无明显延迟
- 缩放响应及时

### 4.3 兼容性验证
- Chrome浏览器正常工作
- Safari浏览器正常工作
- 不同分辨率下正常工作

## 五、实施计划

### 5.1 修改文件清单
1. `frontend/src/styles/timeline.css` - 修复头部滚动样式
2. `frontend/src/components/Timeline/TimelineView.jsx` - 改进初始定位逻辑

### 5.2 实施步骤
1. 修改CSS样式，允许头部水平滚动
2. 改进初始定位useEffect的依赖项和逻辑
3. 测试头部滚动同步
4. 测试初始定位
5. 测试缩放后定位
6. 测试窗口调整场景

### 5.3 风险评估
- **风险等级**：低
- **影响范围**：仅影响时间轴滚动行为
- **回滚方案**：保留原始代码备份，可快速回滚

## 六、最终确认

- ✅ 问题根因已明确
- ✅ 解决方案已确定
- ✅ 验收标准已明确
- ✅ 实施计划已制定
- ✅ 风险可控

**准备进入实施阶段**
