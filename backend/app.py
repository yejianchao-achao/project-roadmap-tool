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

app.register_blueprint(productlines_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(settings_bp)


if __name__ == '__main__':
    # 开发模式运行
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True
    )
