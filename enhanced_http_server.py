"""
增强HTTP服务器 - 支持大文件传输
"""

import http.server
import socketserver
from http.server import SimpleHTTPRequestHandler
import os

class EnhancedHTTPRequestHandler(SimpleHTTPRequestHandler):
    """增强的HTTP请求处理器，支持大文件传输"""

    def end_headers(self):
        # 添加CORS头
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')

        # 添加大文件支持头
        self.send_header('Cache-Control', 'public, max-age=3600')

        super().end_headers()

    def guess_type(self, path):
        # 为JavaScript文件添加正确的MIME类型
        if path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.html'):
            return 'text/html'
        elif path.endswith('.json'):
            return 'application/json'
        else:
            return super().guess_type(path)

def main():
    """主函数"""
    port = 8081
    handler = EnhancedHTTPRequestHandler

    # 设置工作目录为当前目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"🚀 启动增强HTTP服务器 (端口: {port})")
        print(f"📁 服务目录: {os.getcwd()}")
        print(f"🌐 访问地址: http://localhost:{port}")
        print("💡 支持大文件传输和CORS")
        print("💡 按 Ctrl+C 停止服务器")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 服务器已停止")
            httpd.shutdown()

if __name__ == "__main__":
    main()