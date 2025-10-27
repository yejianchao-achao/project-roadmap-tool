# AI部署执行计划

## 📋 已知信息

- **目标服务器**: 10.0.20.178
- **SSH认证**: 本地有私钥，服务器已配置公钥
- **部署方式**: SSH远程部署
- **项目类型**: React + Flask 全栈应用

## 🎯 待确认信息（需要用户提供）

在开始部署前，我需要确认以下信息：

### 1. SSH连接信息
- [ ] 私钥文件路径：`/path/to/private_key`
- [ ] SSH用户名：`username`
- [ ] 服务器部署目录：`/path/to/deployment/directory`

### 2. 服务器环境信息
- [ ] 操作系统类型（Linux发行版）
- [ ] Python版本（需要3.8+）
- [ ] 是否已安装Nginx
- [ ] 是否有sudo权限

### 3. 部署配置
- [ ] 是否需要配置域名（还是直接使用IP）
- [ ] 是否需要配置HTTPS
- [ ] Flask后端监听端口（默认5000）
- [ ] 是否需要配置防火墙

---

## 🚀 我的部署执行步骤

### 阶段1: 本地准备（在当前工作目录执行）

#### 步骤1.1: 构建前端
```bash
cd frontend
npm run build
cd ..
```

**验证**: 确认 `frontend/dist/` 目录存在且包含 index.html

#### 步骤1.2: 创建部署包
```bash
# 创建临时部署目录
mkdir -p ~/deploy_temp/project-roadmap

# 复制后端文件
cp -r backend ~/deploy_temp/project-roadmap/

# 复制前端构建产物
cp -r frontend/dist ~/deploy_temp/project-roadmap/frontend_dist

# 复制配置文件
cp .gitignore ~/deploy_temp/project-roadmap/
cp README.md ~/deploy_temp/project-roadmap/

# 创建数据目录（初始化空数据）
mkdir -p ~/deploy_temp/project-roadmap/data
echo '[]' > ~/deploy_temp/project-roadmap/data/projects.json
echo '[]' > ~/deploy_temp/project-roadmap/data/productlines.json
echo '[]' > ~/deploy_temp/project-roadmap/data/owners.json
echo '{}' > ~/deploy_temp/project-roadmap/data/settings.json
```

**验证**: 检查 `~/deploy_temp/project-roadmap/` 目录结构

---

### 阶段2: 上传文件到服务器

#### 步骤2.1: 测试SSH连接
```bash
ssh -i [私钥路径] [用户名]@10.0.20.178 "echo 'SSH连接成功'"
```

#### 步骤2.2: 上传部署包
```bash
rsync -avz --progress \
  -e "ssh -i [私钥路径]" \
  ~/deploy_temp/project-roadmap/ \
  [用户名]@10.0.20.178:[部署目录]/
```

**验证**: 确认文件上传成功

---

### 阶段3: 服务器端配置（SSH登录后执行）

#### 步骤3.1: 登录服务器
```bash
ssh -i [私钥路径] [用户名]@10.0.20.178
```

#### 步骤3.2: 检查环境
```bash
# 检查Python版本
python3 --version

# 检查pip
pip3 --version

# 检查Nginx（如果需要）
nginx -v

# 检查当前目录
pwd
ls -la [部署目录]
```

#### 步骤3.3: 创建Python虚拟环境
```bash
cd [部署目录]

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r backend/requirements.txt
```

**验证**: 
```bash
pip list | grep Flask
```

#### 步骤3.4: 测试Flask应用
```bash
# 临时启动Flask测试
cd [部署目录]
source venv/bin/activate
python backend/app.py
```

**验证**: 在另一个终端测试API
```bash
curl http://127.0.0.1:5000/api/productlines
```

按 Ctrl+C 停止测试

---

### 阶段4: 配置Nginx（如果服务器有Nginx）

#### 步骤4.1: 创建Nginx配置文件
```bash
sudo nano /etc/nginx/sites-available/project-roadmap
```

配置内容：
```nginx
server {
    listen 80;
    server_name 10.0.20.178;

    # 前端静态文件
    location / {
        root [部署目录]/frontend_dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root [部署目录]/frontend_dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 步骤4.2: 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/project-roadmap /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

---

### 阶段5: 配置Flask后端服务

#### 步骤5.1: 创建systemd服务文件
```bash
sudo nano /etc/systemd/system/project-roadmap.service
```

配置内容：
```ini
[Unit]
Description=Project Roadmap Flask Backend
After=network.target

[Service]
Type=simple
User=[用户名]
WorkingDirectory=[部署目录]
Environment="PATH=[部署目录]/venv/bin"
ExecStart=[部署目录]/venv/bin/python backend/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 步骤5.2: 启动服务
```bash
# 重载systemd配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start project-roadmap

# 设置开机自启
sudo systemctl enable project-roadmap

# 查看服务状态
sudo systemctl status project-roadmap
```

---

### 阶段6: 验证部署

#### 步骤6.1: 检查服务状态
```bash
# 检查Flask服务
sudo systemctl status project-roadmap

# 检查Nginx服务
sudo systemctl status nginx

# 查看Flask日志
sudo journalctl -u project-roadmap -n 50
```

#### 步骤6.2: 测试API接口
```bash
# 测试产品线API
curl http://10.0.20.178/api/productlines

# 测试项目API
curl http://10.0.20.178/api/projects

# 测试设置API
curl http://10.0.20.178/api/settings
```

#### 步骤6.3: 浏览器访问测试
在本地浏览器访问: `http://10.0.20.178`

验证功能：
- [ ] 页面正常加载
- [ ] 可以创建产品线
- [ ] 可以创建项目
- [ ] 时间轴正常显示
- [ ] 设置可以保存

---

## 🔧 可选配置

### 配置防火墙（如果需要）
```bash
# 开放HTTP端口
sudo ufw allow 80/tcp

# 开放SSH端口（如果还没开）
sudo ufw allow 22/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

### 配置数据备份（推荐）
```bash
# 创建备份脚本
sudo nano /usr/local/bin/backup-roadmap.sh
```

脚本内容：
```bash
#!/bin/bash
BACKUP_DIR="/backup/project-roadmap"
DATA_DIR="[部署目录]/data"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/data_$DATE.tar.gz -C $DATA_DIR .

# 保留最近7天的备份
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +7 -delete
```

```bash
# 添加执行权限
sudo chmod +x /usr/local/bin/backup-roadmap.sh

# 添加到crontab（每天凌晨2点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-roadmap.sh") | crontab -
```

---

## 🐛 故障排查命令

### 如果Flask服务启动失败
```bash
# 查看详细日志
sudo journalctl -u project-roadmap -n 100 --no-pager

# 手动启动测试
cd [部署目录]
source venv/bin/activate
python backend/app.py
```

### 如果Nginx配置错误
```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 如果数据无法保存
```bash
# 检查data目录权限
ls -la [部署目录]/data/

# 修改权限
sudo chown -R [用户名]:[用户名] [部署目录]/data/
chmod 755 [部署目录]/data/
chmod 644 [部署目录]/data/*.json
```

### 如果端口被占用
```bash
# 查看端口占用
sudo netstat -tlnp | grep 5000
sudo netstat -tlnp | grep 80

# 杀死占用进程
sudo kill -9 [PID]
```

---

## 📝 部署检查清单

### 部署前检查
- [ ] 本地前端构建完成
- [ ] 部署包创建完成
- [ ] SSH连接测试通过
- [ ] 确认服务器部署目录

### 部署中检查
- [ ] 文件上传成功
- [ ] Python虚拟环境创建成功
- [ ] 依赖安装成功
- [ ] Flask应用可以手动启动
- [ ] Nginx配置正确
- [ ] systemd服务配置正确

### 部署后检查
- [ ] Flask服务运行正常
- [ ] Nginx服务运行正常
- [ ] API接口响应正常
- [ ] 浏览器可以访问
- [ ] 数据可以正常保存
- [ ] 日志无错误信息

---

## 🎯 我需要用户提供的信息模板

请用户按以下格式提供信息：

```
SSH连接信息：
- 私钥路径: /Users/xxx/.ssh/id_rsa
- 用户名: ubuntu
- 部署目录: /home/ubuntu/project-roadmap

服务器环境：
- 操作系统: Ubuntu 20.04
- Python版本: 3.8.10
- 是否有Nginx: 是/否
- 是否有sudo权限: 是/否

部署配置：
- 使用域名还是IP: IP (10.0.20.178)
- 是否需要HTTPS: 否
- Flask端口: 5000（默认）
```

---

## 📌 注意事项

1. **所有命令中的占位符需要替换**：
   - `[私钥路径]` → 实际私钥路径
   - `[用户名]` → 实际SSH用户名
   - `[部署目录]` → 实际部署目录路径

2. **执行顺序严格按照阶段进行**，每个阶段完成后验证再继续

3. **遇到错误立即停止**，使用故障排查命令定位问题

4. **保持SSH连接稳定**，建议使用screen或tmux

5. **首次部署建议逐步执行**，不要使用自动化脚本

---

**准备就绪！等待用户提供具体信息后开始部署。**
