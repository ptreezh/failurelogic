/**
 * 更新部署脚本
 * 准备将修复推送到GitHub和Railway
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DeploymentUpdater {
    constructor() {
        this.projectDir = 'D:\\AIDevelop\\failureLogic';
    }

    async updateAPIConfigForRemote() {
        console.log('🔄 更新API配置以支持远程部署...');
        
        const indexPath = path.join(this.projectDir, 'assets', 'js', 'app.js');
        
        try {
            let content = await fs.readFile(indexPath, 'utf8');
            
            // 为远程部署创建动态API基础URL配置
            const updatedContent = content
                // 替换API基础URL配置为动态检测
                .replace(/apiBaseUrl:\s*\([^)]*\)/g, `apiBaseUrl: (() => {
                    // 检测当前环境并选择合适的API端点
                    const hostname = window.location.hostname;
                    
                    // 本地开发环境
                    if (hostname === 'localhost' || hostname === '127.0.0.1') {
                        return 'http://localhost:8082';
                    }
                    
                    // Railway部署环境
                    if (hostname.includes('railway.app')) {
                        return 'https://' + hostname.replace('frontend', 'backend'); // 假设后端在backend子域名
                    }
                    
                    // Vercel部署环境
                    if (hostname.includes('vercel.app')) {
                        return 'https://' + hostname.replace('frontend', 'api'); // 假设API在api子域名
                    }
                    
                    // GitHub Pages环境 - 使用代理或CORS代理
                    if (hostname.includes('github.io')) {
                        // 对于GitHub Pages，使用Railway后端API
                        return 'https://failure-logic-api-production.up.railway.app';
                    }
                    
                    // 默认回退到当前主机的API端口
                    return window.location.protocol + '//' + window.location.host + ':8082';
                })()`)
                // 确保请求头包含正确的CORS设置
                .replace(/headers:\s*{/g, 'headers: {\n          \'Access-Control-Allow-Origin\': \'*\',');
            
            await fs.writeFile(indexPath, updatedContent);
            console.log('✅ API配置已更新以支持远程部署');
            
            return true;
        } catch (error) {
            console.error('❌ 更新API配置失败:', error);
            return false;
        }
    }

    async updateServerConfig() {
        console.log('🔄 更新服务器配置...');
        
        const serverRunnerPath = path.join(this.projectDir, 'api-server', 'server_runner.py');
        
        try {
            let content = await fs.readFile(serverRunnerPath, 'utf8');
            
            // 更新服务器配置以支持远程部署
            const updatedContent = content
                .replace(/host="0.0.0.0"/g, 'host="0.0.0.0"')  // 确保绑定到所有接口
                .replace(/port=8082/g, 'port=int(os.environ.get("PORT", 8082))');  // 支持环境变量端口
            
            await fs.writeFile(serverRunnerPath, updatedContent);
            console.log('✅ 服务器配置已更新');
            
            return true;
        } catch (error) {
            console.error('❌ 更新服务器配置失败:', error);
            return false;
        }
    }

    async createDeploymentFiles() {
        console.log('📁 创建部署配置文件...');
        
        // 创建Railway部署配置
        const railwayConfig = {
            "$schema": "https://railway.app/railway.schema.json",
            "build": {
                "builder": "NIXPACKS",
                "nixpacksPlan": {
                    "phases": {
                        "setup": {
                            "nixPkgs": ["python310", "nodejs-18_x", "gcc", "libffi", "openssl", "postgresql"]
                        },
                        "install": {
                            "cmd": [
                                "pip install --upgrade pip",
                                "pip install -r requirements.txt",
                                "npm install"  
                            ]
                        },
                        "build": {
                            "cmd": [
                                "echo 'Build completed'"
                            ]
                        },
                        "start": {
                            "cmd": [
                                "python -m api-server.server_runner"
                            ]
                        }
                    }
                }
            },
            "deploy": {
                "restartPolicyType": "ON_FAILURE",
                "restartPolicyMaxRetries": 3
            }
        };
        
        const railwayPath = path.join(this.projectDir, 'railway.json');
        await fs.writeFile(railwayPath, JSON.stringify(railwayConfig, null, 2));
        console.log('✅ Railway配置文件已创建');
        
        // 更新requirements.txt以确保包含所有依赖
        const requirementsPath = path.join(this.projectDir, 'requirements.txt');
        let requirements = await fs.readFile(requirementsPath, 'utf8');
        if (!requirements.includes('python-multipart')) {
            requirements += '\npython-multipart>=0.0.6\n';
        }
        if (!requirements.includes('python-dotenv')) {
            requirements += 'python-dotenv>=1.0.0\n';
        }
        await fs.writeFile(requirementsPath, requirements);
        console.log('✅ Requirements文件已更新');
        
        return true;
    }

    async prepareGithubCommit() {
        console.log('📦 准备GitHub提交...');
        
        try {
            // 检查git状态
            const { stdout: status } = await execAsync('git status --porcelain', { cwd: this.projectDir });
            
            if (status.trim()) {
                console.log('📝 检测到文件变更，准备提交...');
                
                // 添加所有变更
                await execAsync('git add .', { cwd: this.projectDir });
                
                // 创建提交
                await execAsync('git commit -m "feat: 更新API配置以支持远程部署并修复场景加载问题"', { cwd: this.projectDir });
                
                console.log('✅ GitHub提交已准备完成');
                return true;
            } else {
                console.log('ℹ️  没有检测到文件变更');
                return true;
            }
        } catch (error) {
            console.error('❌ 准备GitHub提交失败:', error.message);
            return false;
        }
    }

    async runCompleteUpdate() {
        console.log('🚀 开始执行完整更新流程...');
        console.log('=' .repeat(50));
        
        // 1. 更新API配置以支持远程部署
        const apiUpdated = await this.updateAPIConfigForRemote();
        
        // 2. 更新服务器配置
        const serverUpdated = await this.updateServerConfig();
        
        // 3. 创建部署配置文件
        const deploymentFilesCreated = await this.createDeploymentFiles();
        
        // 4. 准备GitHub提交
        const githubReady = await this.prepareGithubCommit();
        
        console.log('=' .repeat(50));
        
        const allSuccessful = apiUpdated && serverUpdated && deploymentFilesCreated && githubReady;
        
        if (allSuccessful) {
            console.log('✅ 完整更新流程执行成功！');
            console.log('\n📋 接下来的操作：');
            console.log('   1. 检查更改: git diff HEAD');
            console.log('   2. 推送至GitHub: git push origin main');
            console.log('   3. 部署到Railway: railway up');
            console.log('   4. 验证部署: 访问部署的URL测试所有场景');
        } else {
            console.log('⚠️  部分更新步骤失败，请检查错误信息');
        }
        
        return allSuccessful;
    }
}

// 执行更新
async function main() {
    const updater = new DeploymentUpdater();
    const success = await updater.runCompleteUpdate();
    
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ 更新过程出错:', error);
        process.exit(1);
    });
}

module.exports = DeploymentUpdater;