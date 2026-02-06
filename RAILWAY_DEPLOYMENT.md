# 部署到Railway的说明

## 部署步骤

1. 确保Railway CLI已安装：
```bash
npm install -g @railway/cli
```

2. 登录Railway：
```bash
railway login
```

3. 将项目链接到Railway：
```bash
railway init
```

4. 设置环境变量（如果需要）：
```bash
railway vars set ENVIRONMENT=production
```

5. 部署项目：
```bash
railway up
```

## API配置说明

项目中的API配置已更新以支持多种部署环境：

- 本地开发：`http://localhost:8082`
- Railway部署：动态检测主机名并相应调整API端点
- GitHub Pages：使用代理API端点

## 验证部署

部署完成后，可以通过以下方式验证：

1. 访问前端URL，确认页面正常加载
2. 导航到场景页面，确认场景列表正确显示
3. 尝试启动一个场景，确认游戏功能正常
4. 检查浏览器控制台，确认没有错误

## 故障排除

如果部署后遇到问题：

1. 检查API端点是否正确配置
2. 确认CORS设置允许前端域名访问
3. 验证后端服务是否正常运行
4. 检查日志以获取更多信息

## 后续步骤

1. 部署后端API服务到Railway
2. 配置前端以使用部署的后端API
3. 测试所有场景功能
4. 验证移动端兼容性