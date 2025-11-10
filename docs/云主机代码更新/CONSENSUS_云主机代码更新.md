# CONSENSUS｜云主机代码更新

## 明确需求与验收标准
- 仅同步代码到云主机，严格排除 `data/` 目录。
- 同步前在云主机上自动备份 `data` 为压缩包（含时间戳）。
- 脚本可通过 `.env.deploy` 配置目标主机与目录信息。

## 技术实现方案
- 备份：远程执行 `tar -czf backup/data-<timestamp>.tgz` 对 `REMOTE_DATA_DIR` 归档。
- 同步：`rsync -avz --delete` 同步到 `REMOTE_DIR`，并 `--exclude data/`。
- 配置：`.env.deploy` 提供 `SSH_HOST/SSH_USER/SSH_PORT/REMOTE_DIR/REMOTE_DATA_DIR/BACKUP_DIR`。
- 安全：`.env.deploy` 忽略提交，脚本默认不上传数据目录。

## 集成方案
- 脚本位于 `scripts/deploy_cloud.sh`，在项目根目录运行。
- 预览与测试不依赖云主机；远程部署需主机信息准备完毕。

## 边界与限制
- 不处理数据库迁移；仅文件级代码更新与 data 备份。
- 不包含远程服务重启步骤（如需，请提供具体命令）。

## 不确定性确认
- 需用户提供云主机连接与路径信息后执行部署。