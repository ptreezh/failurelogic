#!/bin/bash
# GitHub Pages 部署脚本

# 设置变量
REPO_URL="https://github.com/ptreezh/failurelogic.git"
GITHUB_TOKEN=$GITHUB_TOKEN  # 从环境变量获取

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
    echo "错误: 未在项目根目录"
    exit 1
fi

echo "🚀 开始部署前端到GitHub Pages..."

# 配置git
git config --global user.name "GitHub Actions"
git config --global user.email "action@github.com"

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 当前分支: $CURRENT_BRANCH"

# 创建并切换到gh-pages分支
echo "🔄 创建gh-pages分支..."
git checkout -b gh-pages

# 删除除了构建产物之外的所有git跟踪文件
echo "🧹 清理不需要的文件..."
git rm -r --cached --ignore-unmatch '!(index.html|assets/**|api-server/**|*.md|*.js|*.py|*.json|*.txt|*.css|*.svg|*.ico|*.png|*.jpg|*.jpeg|*.gif|*.webp|*.webm|*.mp4|*.mp3|*.wav|*.flac|*.ogg|*.pdf|*.doc|*.docx|*.xls|*.xlsx|*.ppt|*.pptx|*.zip|*.tar|*.gz|*.rar|*.7z|*.exe|*.msi|*.deb|*.rpm|*.apk|*.ipa|*.jar|*.war|*.ear|*.dll|*.so|*.dylib|*.a|*.lib|*.obj|*.o|*.class|*.jar|*.war|*.ear|*.dll|*.so|*.dylib|*.a|*.lib|*.obj|*.o|*.class|*.lock|node_modules/**|__pycache__/**|*.pyc|*.pyo|*.pyd|.git/**|.gitignore|.gitmodules|.gitattributes|Dockerfile|docker-compose.yml|*.dockerfile|*.dockerignore|*.env|*.env.local|*.env.development|*.env.test|*.env.production|*.env.example|*.log|*.tmp|*.temp|*.swp|*.swo|*~|.#*|.DS_Store|.vscode/**|.idea/**|.vs/**|*.sublime-project|*.sublime-workspace|coverage/**|dist/**|build/**|out/**|target/**|*.min.js|*.min.css|*.bundle.js|*.chunk.js|*.map|*.lock|package-lock.json|yarn.lock|pnpm-lock.yaml|*.lock|*.tmp|*.temp|*.swp|*.swo|*~|.#*|.DS_Store|.vscode/**|.idea/**|.vs/**|*.sublime-project|*.sublime-workspace|coverage/**|dist/**|build/**|out/**|target/**|*.min.js|*.min.css|*.bundle.js|*.chunk.js|*.map)*'

# 提交更改
echo "💾 提交更改到gh-pages分支..."
git add .
git commit -m "chore: deploy to GitHub Pages" -a

# 推送到GitHub Pages
echo "📤 推送部署到GitHub..."
git push -f origin gh-pages

# 切换回主分支
git checkout $CURRENT_BRANCH

echo "✅ 前端已成功部署到GitHub Pages!"
echo "🌐 访问地址: https://ptreezh.github.io/failurelogic/"