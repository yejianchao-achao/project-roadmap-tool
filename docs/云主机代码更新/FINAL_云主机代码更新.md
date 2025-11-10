# FINAL｜云主机代码更新

## 总结
- 已实现安全的云主机代码更新方案：远程 data 备份 + 代码同步（排除 data）。
- 所有实现遵循 6A 工作流与文档同步规范。

## 使用说明（简版）
1. 复制 `.env.deploy.example` 为 `.env.deploy`，填写主机信息：
   - `SSH_HOST=...`、`SSH_USER=...`、`SSH_PORT=22`
   - `REMOTE_DIR=/opt/project-roadmap`
   - `REMOTE_DATA_DIR=/opt/project-roadmap/data`
   - `BACKUP_DIR=/opt/project-roadmap/backup`
2. 演示运行（不执行实际同步）：
   - 在 `.env.deploy` 中设置 `DRY_RUN=1`
   - 执行：`bash scripts/deploy_cloud.sh`
3. 正式同步：将 `DRY_RUN=0` 或移除，执行同一命令。

## 风险与建议
- 建议首次执行使用 `DRY_RUN=1` 检查排除项是否符合预期。
- 若需自动重启后端服务，可在脚本或 README 中追加远程命令（需确认服务管理方式）。