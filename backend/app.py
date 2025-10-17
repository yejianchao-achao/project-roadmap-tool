"""
Flask应用主文件
提供项目路线图工具的后端API服务
"""
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

# 配置CORS，允许前端跨域访问
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})


@app.route('/')
def health_check():
    """
    健康检查端点
    返回服务状态信息
    """
    return jsonify({
        'success': True,
        'message': '项目路线图工具API服务运行中',
        'version': '1.0.0'
    })


@app.route('/api/health')
def api_health():
    """
    API健康检查端点
    """
    return jsonify({
        'success': True,
        'status': 'healthy'
    })


# 注册蓝图
from routes.productlines import productlines_bp
from routes.projects import projects_bp
from routes.settings import bp as settings_bp
from routes.owners import owners_bp  # 新增：人员路由

app.register_blueprint(productlines_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(owners_bp)  # 新增：注册人员路由


# 应用启动时执行数据迁移
def run_migrations():
    """
    执行数据迁移
    在应用启动时自动运行
    """
    try:
        from utils.migrate_owners import check_migration_needed, migrate_owner_data
        
        # 检查是否需要迁移
        if check_migration_needed():
            print("\n检测到需要数据迁移，正在执行...")
            result = migrate_owner_data()
            
            if not result['success']:
                print("警告：数据迁移失败，但应用将继续启动")
                for error in result.get('errors', []):
                    print(f"  错误: {error}")
        else:
            print("数据迁移检查：无需迁移")
    except Exception as e:
        print(f"数据迁移检查失败: {str(e)}")
        print("应用将继续启动，但可能需要手动执行迁移")


if __name__ == '__main__':
    # 启动前执行数据迁移
    run_migrations()
    
    # 开发模式运行
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True
    )
