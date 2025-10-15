#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
项目路线图工具 - 一键启动脚本
自动检查环境、安装依赖、启动前后端服务
"""

import os
import sys
import subprocess
import time
import signal
import platform
import json
from pathlib import Path

# 颜色输出
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    """打印标题"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    """打印成功信息"""
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    """打印错误信息"""
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_warning(text):
    """打印警告信息"""
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_info(text):
    """打印信息"""
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def check_command_exists(command):
    """检查命令是否存在"""
    try:
        subprocess.run(
            [command, '--version'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def get_python_version():
    """获取Python版本"""
    return f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"

def check_python_version():
    """检查Python版本"""
    print_info("检查Python版本...")
    version = get_python_version()
    print_info(f"当前Python版本: {version}")
    
    if sys.version_info < (3, 8):
        print_error(f"Python版本过低！需要 Python 3.8+，当前版本: {version}")
        print_info("请访问 https://www.python.org/downloads/ 下载最新版本")
        return False
    
    print_success(f"Python版本检查通过: {version}")
    return True

def check_node_version():
    """检查Node.js版本"""
    print_info("检查Node.js...")
    
    if not check_command_exists('node'):
        print_error("未检测到Node.js！")
        print_info("请访问 https://nodejs.org/ 下载安装")
        return False
    
    try:
        result = subprocess.run(
            ['node', '--version'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        version = result.stdout.strip()
        print_success(f"Node.js版本: {version}")
        return True
    except subprocess.CalledProcessError:
        print_error("Node.js版本检查失败")
        return False

def check_npm():
    """检查npm"""
    print_info("检查npm...")
    
    if not check_command_exists('npm'):
        print_error("未检测到npm！")
        return False
    
    try:
        result = subprocess.run(
            ['npm', '--version'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        version = result.stdout.strip()
        print_success(f"npm版本: {version}")
        return True
    except subprocess.CalledProcessError:
        print_error("npm版本检查失败")
        return False

def ensure_data_directory():
    """确保data目录存在"""
    print_info("检查data目录...")
    
    data_dir = Path('data')
    if not data_dir.exists():
        print_warning("data目录不存在，正在创建...")
        data_dir.mkdir(parents=True)
        print_success("data目录创建成功")
    
    # 确保JSON文件存在
    projects_file = data_dir / 'projects.json'
    productlines_file = data_dir / 'productlines.json'
    
    if not projects_file.exists():
        print_info("创建projects.json...")
        with open(projects_file, 'w', encoding='utf-8') as f:
            json.dump({"projects": []}, f, ensure_ascii=False, indent=2)
        print_success("projects.json创建成功")
    
    if not productlines_file.exists():
        print_info("创建productlines.json...")
        with open(productlines_file, 'w', encoding='utf-8') as f:
            json.dump({"productlines": []}, f, ensure_ascii=False, indent=2)
        print_success("productlines.json创建成功")
    
    print_success("data目录检查完成")
    return True

def install_python_dependencies():
    """安装Python依赖"""
    print_info("检查Python依赖...")
    
    requirements_file = Path('backend/requirements.txt')
    if not requirements_file.exists():
        print_error("未找到backend/requirements.txt文件")
        return False
    
    print_info("安装Python依赖包...")
    try:
        subprocess.run(
            [sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)],
            check=True
        )
        print_success("Python依赖安装成功")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Python依赖安装失败: {e}")
        return False

def install_npm_dependencies():
    """安装npm依赖"""
    print_info("检查npm依赖...")
    
    frontend_dir = Path('frontend')
    if not frontend_dir.exists():
        print_error("未找到frontend目录")
        return False
    
    package_json = frontend_dir / 'package.json'
    if not package_json.exists():
        print_error("未找到frontend/package.json文件")
        return False
    
    node_modules = frontend_dir / 'node_modules'
    if node_modules.exists():
        print_info("npm依赖已安装，跳过安装步骤")
        return True
    
    print_info("安装npm依赖包（这可能需要几分钟）...")
    try:
        subprocess.run(
            ['npm', 'install'],
            cwd=str(frontend_dir),
            check=True
        )
        print_success("npm依赖安装成功")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"npm依赖安装失败: {e}")
        return False

def check_port_available(port):
    """检查端口是否可用"""
    try:
        result = subprocess.run(
            ['lsof', '-ti', f':{port}'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return result.returncode != 0  # 如果没有进程占用，返回True
    except Exception:
        return True

def kill_port_process(port):
    """杀死占用指定端口的进程"""
    try:
        subprocess.run(
            ['lsof', '-ti', f':{port}'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        subprocess.run(
            f'lsof -ti:{port} | xargs kill -9',
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        time.sleep(1)
        return True
    except Exception:
        return False

def start_backend():
    """启动后端服务"""
    print_info("启动Flask后端服务...")
    
    # 检查端口5000是否被占用
    if not check_port_available(5000):
        print_warning("端口5000已被占用，正在清理...")
        if kill_port_process(5000):
            print_success("端口5000已清理")
        else:
            print_error("无法清理端口5000，请手动关闭占用该端口的程序")
            return None
    
    backend_dir = Path('backend')
    app_file = backend_dir / 'app.py'
    
    if not app_file.exists():
        print_error("未找到backend/app.py文件")
        return None
    
    try:
        # 启动Flask服务器（不捕获输出，让其直接显示在终端）
        # 注意：不设置cwd，直接使用相对路径运行
        process = subprocess.Popen(
            [sys.executable, str(app_file)]
        )
        
        # Flask在debug模式下会重启，需要等待更长时间
        # 第一次启动 -> 重启 -> 真正准备好
        print_info("等待Flask服务启动（debug模式需要重启）...")
        time.sleep(5)
        
        # 尝试多次健康检查，因为Flask debug模式重启需要时间
        import urllib.request
        max_retries = 6
        retry_interval = 2
        
        for attempt in range(max_retries):
            try:
                response = urllib.request.urlopen('http://localhost:5000/api/health', timeout=3)
                if response.status == 200:
                    print_success("Flask后端服务启动成功 (http://localhost:5000)")
                    return process
            except Exception as e:
                if attempt < max_retries - 1:
                    print_info(f"等待服务就绪... (尝试 {attempt + 1}/{max_retries})")
                    time.sleep(retry_interval)
                else:
                    print_warning("健康检查超时，但服务可能已启动")
                    print_info("请检查终端输出确认Flask是否正常运行")
                    # 即使健康检查失败，如果进程还在运行，也返回进程对象
                    # 因为Flask在debug模式下可能需要更长时间才能响应
                    if process.poll() is None:
                        print_warning("Flask进程仍在运行，继续启动流程")
                        return process
                    else:
                        print_error("Flask进程已退出")
                        return None
        
        return None
    except Exception as e:
        print_error(f"启动Flask服务时出错: {e}")
        return None

def start_frontend():
    """启动前端服务"""
    print_info("启动Vite前端开发服务器...")
    
    frontend_dir = Path('frontend')
    
    try:
        # 启动Vite开发服务器
        process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd=str(frontend_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # 等待服务启动
        time.sleep(3)
        
        if process.poll() is None:
            print_success("Vite前端服务启动成功 (http://localhost:5173)")
            return process
        else:
            print_error("Vite前端服务启动失败")
            return None
    except Exception as e:
        print_error(f"启动Vite服务时出错: {e}")
        return None

def open_browser():
    """打开浏览器"""
    print_info("正在打开浏览器...")
    
    url = "http://localhost:5173"
    system = platform.system()
    
    try:
        if system == "Darwin":  # macOS
            subprocess.run(['open', url], check=True)
        elif system == "Windows":
            subprocess.run(['start', url], shell=True, check=True)
        else:  # Linux
            subprocess.run(['xdg-open', url], check=True)
        
        print_success("浏览器已打开")
        return True
    except Exception as e:
        print_warning(f"无法自动打开浏览器: {e}")
        print_info(f"请手动访问: {url}")
        return False

def cleanup(backend_process, frontend_process):
    """清理进程"""
    print_info("\n正在关闭服务...")
    
    if backend_process and backend_process.poll() is None:
        backend_process.terminate()
        backend_process.wait(timeout=5)
        print_success("后端服务已关闭")
    
    if frontend_process and frontend_process.poll() is None:
        frontend_process.terminate()
        frontend_process.wait(timeout=5)
        print_success("前端服务已关闭")
    
    print_success("所有服务已关闭")

def main():
    """主函数"""
    print_header("项目路线图工具 - 启动脚本")
    
    # 1. 检查Python版本
    if not check_python_version():
        sys.exit(1)
    
    # 2. 检查Node.js和npm
    if not check_node_version() or not check_npm():
        sys.exit(1)
    
    # 3. 确保data目录存在
    if not ensure_data_directory():
        sys.exit(1)
    
    # 4. 安装Python依赖
    if not install_python_dependencies():
        sys.exit(1)
    
    # 5. 安装npm依赖
    if not install_npm_dependencies():
        sys.exit(1)
    
    print_header("启动服务")
    
    # 6. 启动后端服务
    backend_process = start_backend()
    if not backend_process:
        sys.exit(1)
    
    # 7. 启动前端服务
    frontend_process = start_frontend()
    if not frontend_process:
        cleanup(backend_process, None)
        sys.exit(1)
    
    # 8. 打开浏览器
    time.sleep(2)
    open_browser()
    
    print_header("服务运行中")
    print_success("所有服务已启动！")
    print_info("前端地址: http://localhost:5173")
    print_info("后端地址: http://localhost:5000")
    print_warning("按 Ctrl+C 停止所有服务")
    
    # 9. 等待用户中断
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n")
        print_info("收到停止信号...")
        cleanup(backend_process, frontend_process)
        print_success("程序已退出")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print_error(f"发生错误: {e}")
        sys.exit(1)
