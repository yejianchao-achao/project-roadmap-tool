# 泳道空白问题优化

## 问题描述
时间轴视图中，泳道占用了大量垂直空间，即使当前视图只显示少量项目，泳道高度仍然基于所有项目的最大重叠来计算。

## 问题分析

### 根本原因
1. **泳道高度计算基于所有项目**：`Swimlane.jsx` 中的 `assignRows` 和 `calculateSwimlaneHeight` 函数处理的是产品线的所有项目，而不是当前时间范围内可见的项目
2. **CSS与JS高度不一致**：CSS中 `.project-bar` 高度是 48px，但 `constants.js` 中用于计算位置的 `PROJECT_BAR_HEIGHT` 是 40px，导致项目块重叠

## 解决方案

### 1. 添加时间范围过滤 (Swimlane.jsx)
在 `Swimlane.jsx` 中添加 `isProjectVisible` 函数，只对当前时间范围内可见的项目进行行号分配和高度计算：

```javascript
function isProjectVisible(project, timelineParams) {
  if (!timelineParams || !timelineParams.minDate || !timelineParams.maxDate) {
    return true
  }
  const projectStart = dayjs(project.startDate)
  const projectEnd = dayjs(project.endDate)
  const timelineStart = dayjs(timelineParams.minDate)
  const timelineEnd = dayjs(timelineParams.maxDate)
  return projectStart.isBefore(timelineEnd) && projectEnd.isAfter(timelineStart)
}
```

### 2. 同步CSS和JS高度 (timeline.css)
将 `.project-bar` 的 height 从 48px 改为 40px，与 `constants.js` 保持一致。

### 3. 优化项目块间距 (constants.js)
将 `PROJECT_BAR_MARGIN` 从 16px 减小到 8px，使泳道更紧凑。

## 修改的文件

1. **frontend/src/components/Timeline/Swimlane.jsx**
   - 添加 `isProjectVisible` 函数
   - 过滤可见项目后再分配行号和计算高度
   - 显示可见项目数量而非总项目数量

2. **frontend/src/styles/timeline.css**
   - `.project-bar` height: 48px → 40px

3. **frontend/src/utils/constants.js**
   - `PROJECT_BAR_MARGIN`: 16 → 8

## 效果
- 选择"最近3个月"时，泳道高度显著减小
- 选择"最近1年"时，泳道高度基于该年内可见项目的最大重叠
- 项目块不再重叠
- 整体布局更紧凑

## 测试验证
- ✅ 切换时间范围筛选器，泳道高度正确变化
- ✅ 项目块不重叠
- ✅ 网格线和今日线正确显示
- ✅ 滚动功能正常
