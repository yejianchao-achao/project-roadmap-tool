# ACCEPTANCE｜云主机代码更新

## 执行结果记录
- 部署脚本已创建：`scripts/deploy_cloud.sh`（含 DRY_RUN、排除 data、备份远程 data）。
- 部署配置示例已创建：`.env.deploy.example`。
- `.gitignore` 已更新忽略 `.env.deploy`。
- 6A 文档集已创建（ALIGNMENT/CONSENSUS/DESIGN/TASK/ACCEPTANCE）。

## 验收标准核对
- [x] 脚本不上传 `data`，同步前先做远程备份。
- [x] 脚本参数可通过 `.env.deploy` 配置。
- [x] 文档与 README 指引完善。

## 待执行项（需主机信息）
- 运行实际部署：待提供 `SSH_HOST`、`SSH_USER`、`REMOTE_DIR`、`REMOTE_DATA_DIR` 信息。