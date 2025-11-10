# 共识阶段（CONSENSUS）- 项目与人员看板定位增强

## 明确需求与验收标准
- 今日红线：
  - 显示在时间轴上，颜色红色（`#ff4d4f`），线宽2px。
  - 位于项目块之上，滚动同步；若今天不在当前时间范围内则不显示。
- 本周阴影：
  - 半透明背景（`rgba(24,144,255,0.12)`），覆盖本周7天范围。
  - 位于项目块下方，与周刻度线共存；超出范围进行裁剪。

## 技术实现方案
- 新增组件 `TimelineOverlay`（叠加层）用于绘制今日红线。
- 在 `TimelineGrid` 中渲染周刻度线与本周阴影背景。
- 在 `dateUtils` 中新增计算函数：
  - `generateTodayOffset(timelineParams)`：返回今日相对 `minDate` 的像素偏移或 `null`。
  - `generateCurrentWeekHighlightRange(timelineParams)`：返回阴影 `{left, width}` 或 `null`。

## 任务边界与集成
- 不改动后端与数据结构；仅前端视图层变更。
- 与自定义时间范围、滚动同步逻辑兼容。

## 不确定性已解决
- 颜色采用固定值，后续如需自定义再扩展设置模块。
- 周起始日遵循 dayjs 默认（周日），后续可通过配置切换。