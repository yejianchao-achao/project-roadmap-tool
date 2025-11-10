#!/usr/bin/env bash
#
# 功能: 将本地项目代码同步到云主机，且在更新前备份云主机上的 data 目录。
# 使用: 在项目根目录执行 `bash scripts/deploy_cloud.sh`
# 依赖: rsync、ssh、tar
# 配置: 通过 .env.deploy 或环境变量提供以下参数
#
# 必填变量:
#   SSH_HOST        目标云主机地址（如: 192.168.1.10 或 example.com）
#   SSH_USER        SSH 用户名（如: ubuntu）
#   REMOTE_DIR      目标部署目录（如: /opt/project-roadmap）
#   REMOTE_DATA_DIR 目标数据目录（如: /opt/project-roadmap/data）
#
# 可选变量:
#   SSH_PORT        SSH 端口，默认 22
#   EXCLUDES        额外排除的相对路径，逗号分隔（如: "data,node_modules,frontend/dist"）
#   DRY_RUN         设为 1 时仅演示不实际执行
#   BACKUP_DIR      远程备份存放目录，默认 ${REMOTE_DIR}/backup
#   DEPLOY_FRONTEND 是否构建并上传前端产物（1启用，默认0）
#   FRONTEND_DIR    本地前端源码目录（默认 frontend）
#   FRONTEND_BUILD_CMD 前端构建命令（默认 "npm run build"）
#   LOCAL_FRONTEND_DIST 本地构建产物目录（默认 ${FRONTEND_DIR}/dist）
#   REMOTE_FRONTEND_DIR 远程前端产物目录（默认 ${REMOTE_DIR}/frontend_dist）
#   RESTART_BACKEND 是否重启后端服务并健康检查（1启用，默认0）
#   BACKEND_SERVICE 后端 systemd 服务名（默认 project-roadmap）
#   HEALTHCHECK_URL 健康检查URL（默认 http://127.0.0.1:5000/api/projects）
#
# 安全: 不上传 data 目录；备份文件命名包含时间戳，避免覆盖。
# 注意: 不要将 .env.deploy 提交到 git（已在 .gitignore 中忽略）。

set -euo pipefail

# 加载 .env.deploy（若存在）
ENV_DEPLOY_FILE=".env.deploy"
if [[ -f "$ENV_DEPLOY_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_DEPLOY_FILE"
fi

# 默认值
SSH_PORT=${SSH_PORT:-22}
DRY_RUN=${DRY_RUN:-0}
BACKUP_DIR=${BACKUP_DIR:-"${REMOTE_DIR}/backup"}
DEPLOY_FRONTEND=${DEPLOY_FRONTEND:-0}
FRONTEND_DIR=${FRONTEND_DIR:-frontend}
FRONTEND_BUILD_CMD=${FRONTEND_BUILD_CMD:-"npm run build"}
LOCAL_FRONTEND_DIST=${LOCAL_FRONTEND_DIST:-"${FRONTEND_DIR}/dist"}
REMOTE_FRONTEND_DIR=${REMOTE_FRONTEND_DIR:-"${REMOTE_DIR}/frontend_dist"}
RESTART_BACKEND=${RESTART_BACKEND:-0}
BACKEND_SERVICE=${BACKEND_SERVICE:-project-roadmap}
HEALTHCHECK_URL=${HEALTHCHECK_URL:-"http://127.0.0.1:5000/api/projects"}

# 校验必填项
missing=()
[[ -z "${SSH_HOST:-}" ]] && missing+=(SSH_HOST)
[[ -z "${SSH_USER:-}" ]] && missing+=(SSH_USER)
[[ -z "${REMOTE_DIR:-}" ]] && missing+=(REMOTE_DIR)
[[ -z "${REMOTE_DATA_DIR:-}" ]] && missing+=(REMOTE_DATA_DIR)
if (( ${#missing[@]} > 0 )); then
  echo "[错误] 缺少必要配置: ${missing[*]}" >&2
  echo "请在 .env.deploy 填写或以环境变量提供上述参数。" >&2
  exit 1
fi

# 生成时间戳
timestamp=$(date +"%Y%m%d-%H%M%S")

# 构造 rsync 排除项
# 注意：为避免 --delete 误删远程产物与备份，默认排除以下目录：
# - backup/        云端备份目录
# - venv/          云端Python虚拟环境
# - frontend_dist/ 云端前端构建产物（由CI/构建流程生成）
RSYNC_EXCLUDES=(
  "--exclude=.git/"
  "--exclude=node_modules/"
  "--exclude=frontend/dist/"   # 本地开发构建目录（不需要上传）
  "--exclude=frontend_dist/"    # 云端构建产物（保留不删除）
  "--exclude=backup/"           # 云端备份目录（保留不删除）
  "--exclude=venv/"             # 云端虚拟环境目录（保留不删除）
  "--exclude=.DS_Store"
  "--exclude=data/"             # 绝不上传 data
)

# 处理额外排除
if [[ -n "${EXCLUDES:-}" ]]; then
  IFS="," read -r -a extra_excludes <<< "$EXCLUDES"
  for p in "${extra_excludes[@]}"; do
    RSYNC_EXCLUDES+=("--exclude=${p}")
  done
fi

# rsync 基本参数
RSYNC_OPTS=("-avz" "--delete" "-e" "ssh -p ${SSH_PORT}")
if [[ "$DRY_RUN" == "1" ]]; then
  RSYNC_OPTS+=("--dry-run")
  echo "[提示] DRY_RUN=1，仅演示不执行实际同步。"
fi

echo "[步骤1] 远程创建备份目录: ${BACKUP_DIR}"
ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "mkdir -p '${BACKUP_DIR}'"

echo "[步骤2] 备份远程数据目录: ${REMOTE_DATA_DIR} -> ${BACKUP_DIR}/data-${timestamp}.tgz"
ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "\
  if [ -d '${REMOTE_DATA_DIR}' ]; then \
    tar -czf '${BACKUP_DIR}/data-${timestamp}.tgz' -C '${REMOTE_DATA_DIR}' . ; \
    echo '[完成] 已备份 data 到 ${BACKUP_DIR}/data-${timestamp}.tgz'; \
  else \
    echo '[警告] 未发现远程数据目录: ${REMOTE_DATA_DIR}，跳过备份'; \
  fi"

echo "[步骤3] 同步代码到远程: ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}"
rsync "${RSYNC_OPTS[@]}" "${RSYNC_EXCLUDES[@]}" ./ "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"

# 可选：前端构建并上传产物
if [[ "$DEPLOY_FRONTEND" == "1" ]]; then
  echo "[步骤4] 构建前端产物: ${FRONTEND_DIR} -> ${LOCAL_FRONTEND_DIST}"
  if [[ ! -d "$FRONTEND_DIR" ]]; then
    echo "[错误] 未找到前端目录: ${FRONTEND_DIR}，无法构建前端。" >&2
    exit 1
  fi
  # 执行前端构建
  pushd "$FRONTEND_DIR" >/dev/null
  eval "$FRONTEND_BUILD_CMD"
  popd >/dev/null

  # 校验构建产物目录
  if [[ ! -d "$LOCAL_FRONTEND_DIST" ]]; then
    echo "[错误] 构建后未找到产物目录: ${LOCAL_FRONTEND_DIST}" >&2
    exit 1
  fi

  echo "[步骤5] 同步前端产物到远程: ${SSH_USER}@${SSH_HOST}:${REMOTE_FRONTEND_DIR}"
  RSYNC_FE_OPTS=("-avz" "--delete" "-e" "ssh -p ${SSH_PORT}")
  if [[ "$DRY_RUN" == "1" ]]; then
    RSYNC_FE_OPTS+=("--dry-run")
    echo "[提示] DRY_RUN=1（前端），仅演示不执行实际同步。"
  fi
  rsync "${RSYNC_FE_OPTS[@]}" "${LOCAL_FRONTEND_DIST}/" "${SSH_USER}@${SSH_HOST}:${REMOTE_FRONTEND_DIR}/"
else
  echo "[跳过] 未启用 DEPLOY_FRONTEND，前端产物不同步。"
fi

echo "[步骤6] 同步完成，保持远程 data 目录不变。"

# 可选：重启后端服务并健康检查
if [[ "$RESTART_BACKEND" == "1" ]]; then
  echo "[步骤7] 重启后端服务并进行健康检查: ${BACKEND_SERVICE}"
  ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "\
    set -e ; \
    systemctl restart '${BACKEND_SERVICE}' ; \
    sleep 1 ; \
    systemctl status '${BACKEND_SERVICE}' | head -n 60 || true ; \
    if command -v curl >/dev/null 2>&1; then \
      code=\$(curl -s -o /dev/null -w '%{http_code}' '${HEALTHCHECK_URL}'); \
      echo '[健康检查] ${HEALTHCHECK_URL} -> HTTP '"\${code}" ; \
    else \
      echo '[提示] 远程未安装 curl，跳过HTTP健康检查' ; \
    fi"
else
  echo "[跳过] 未启用 RESTART_BACKEND，后端服务不重启。"
fi

echo "[完成] 云主机代码更新成功。"

exit 0