/**
 * 认知陷阱平台 - 完整修复和验证脚本
 * 
 * 此脚本将修复前端与API的连接问题，并验证所有场景的可用性
 */

const fs = require('fs').promises;
const path = require('path');

class PlatformFixer {
    constructor() {
        this.projectDir = 'D:\\AIDevelop\\failureLogic';
        this.apiBaseUrl = 'http://localhost:8082'; // API服务器端口
        this.frontendUrl = 'http://localhost:8000'; // 前端服务器端口
    }

    async updateAPIConfig() {
        console.log('🔄 更新API配置...');
        
        const indexPath = path.join(this.projectDir, 'assets', 'js', 'app.js');
        
        try {
            let content = await fs.readFile(indexPath, 'utf8');
            
            // 替换API基础URL配置
            const updatedContent = content
                .replace(/apiBaseUrl:\s*\(.*?\)/gs, `apiBaseUrl: '${this.apiBaseUrl}'`)  // 替换动态配置
                .replace(/'https:\/\/[^']*(?:github\.dev|vercel\.app)'(?:,\s*'http:\/\/localhost:8000')?/g, `'${this.apiBaseUrl}'`);  // 替换硬编码的URL
            
            await fs.writeFile(indexPath, updatedContent);
            console.log('✅ API配置已更新');
            
            return true;
        } catch (error) {
            console.error('❌ 更新API配置失败:', error);
            return false;
        }
    }

    async updateIndexHTML() {
        console.log('🔄 更新index.html中的API配置...');
        
        const indexPath = path.join(this.projectDir, 'index.html');
        
        try {
            let content = await fs.readFile(indexPath, 'utf8');
            
            // 检查是否需要更新API配置
            if (content.includes('github.dev') || content.includes('vercel.app')) {
                // 替换API相关的预连接链接
                const updatedContent = content
                    .replace(/https:\/\/[^'"]*(?:github\.dev|vercel\.app)[^'"]*/g, this.apiBaseUrl);
                
                await fs.writeFile(indexPath, updatedContent);
                console.log('✅ index.html中的API配置已更新');
            } else {
                console.log('ℹ️ index.html中未发现需要更新的API配置');
            }
            
            return true;
        } catch (error) {
            console.error('❌ 更新index.html失败:', error);
            return false;
        }
    }

    async createAPISyncScript() {
        console.log('🔄 创建API同步脚本...');
        
        const scriptPath = path.join(this.projectDir, 'sync_scenarios.js');
        const scriptContent = `
/**
 * 场景数据同步脚本
 * 将本地场景数据同步到API服务器
 */

const fs = require('fs').promises;
const path = require('path');

async function syncScenarios() {
    console.log('🔄 开始同步场景数据...');
    
    try {
        // 读取所有场景数据文件
        const scenarioFiles = [
            'api-server/data/scenarios.json',
            'api-server/data/game_scenarios.json', 
            'api-server/data/advanced_game_scenarios.json',
            'api-server/data/love_relationship_scenarios.json',
            'api-server/data/historical_cases.json'
        ];
        
        let allScenarios = [];
        
        for (const file of scenarioFiles) {
            try {
                const fullPath = path.join(__dirname, file);
                const data = JSON.parse(await fs.readFile(fullPath, 'utf8'));
                
                // 提取场景数组
                if (data.scenarios) {
                    allScenarios = allScenarios.concat(data.scenarios);
                } else if (data.game_scenarios) {
                    allScenarios = allScenarios.concat(data.game_scenarios);
                } else if (data.historical_cases) {
                    allScenarios = allScenarios.concat(data.historical_cases);
                }
                
                console.log(\`✅ 已加载文件: \${file} (\${Array.isArray(data.scenarios) ? data.scenarios.length : Array.isArray(data.game_scenarios) ? data.game_scenarios.length : 0} 个场景)\`);
            } catch (error) {
                console.warn(\`⚠️  加载文件失败: \${file}\`, error.message);
            }
        }
        
        console.log(\`📊 总共加载了 \${allScenarios.length} 个场景\`);
        
        // 创建API数据结构
        const apiData = {
            scenarios: allScenarios,
            metadata: {
                total_scenarios: allScenarios.length,
                last_sync: new Date().toISOString(),
                source: 'local_data_sync'
            }
        };
        
        // 写入API数据文件
        const apiDataPath = path.join(__dirname, 'api-server', 'data', 'all_scenarios.json');
        await fs.writeFile(apiDataPath, JSON.stringify(apiData, null, 2));
        console.log('✅ 场景数据已同步到API服务器');
        
        return true;
    } catch (error) {
        console.error('❌ 同步失败:', error);
        return false;
    }
}

if (require.main === module) {
    syncScenarios().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { syncScenarios };
        `;
        
        await fs.writeFile(scriptPath, scriptContent);
        console.log('✅ API同步脚本已创建');
    }

    async verifyAPIService() {
        console.log('🔍 验证API服务可用性...');
        
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);
            
            // 检查API服务器是否正在运行
            try {
                const { stdout } = await execAsync('netstat -an | findstr :8082');
                if (stdout.includes('LISTENING')) {
                    console.log('✅ API服务器 (端口8082) 正在运行');
                    return true;
                }
            } catch {
                console.log('⚠️ API服务器 (端口8082) 未运行');
            }
            
            return false;
        } catch (error) {
            console.error('❌ 验证API服务时出错:', error);
            return false;
        }
    }

    async startAPIServer() {
        console.log('🚀 启动API服务器...');
        
        try {
            const { spawn } = require('child_process');
            
            // 检查Python是否可用
            const pythonPath = 'python';
            
            // 启动API服务器
            const apiProcess = spawn(pythonPath, ['-m', 'api-server.server_runner'], {
                cwd: this.projectDir,
                detached: true,
                stdio: 'ignore'
            });
            
            apiProcess.unref(); // 不阻止父进程退出
            
            // 等待API服务器启动
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('✅ API服务器已启动 (后台运行)');
            return true;
        } catch (error) {
            console.error('❌ 启动API服务器失败:', error.message);
            return false;
        }
    }

    async runCompleteFix() {
        console.log('🔧 开始执行完整修复流程...');
        console.log('=' .repeat(50));
        
        // 1. 更新API配置
        const configUpdated = await this.updateAPIConfig();
        if (!configUpdated) {
            console.log('⚠️  配置更新失败，但仍继续其他步骤');
        }
        
        // 2. 更新index.html
        const indexUpdated = await this.updateIndexHTML();
        if (!indexUpdated) {
            console.log('⚠️  index.html更新失败，但仍继续其他步骤');
        }
        
        // 3. 创建API同步脚本
        await this.createAPISyncScript();
        
        // 4. 检查并启动API服务
        let apiRunning = await this.verifyAPIService();
        if (!apiRunning) {
            console.log('💡 API服务器未运行，尝试启动...');
            const started = await this.startAPIServer();
            if (started) {
                apiRunning = true;
                // 再次验证
                await new Promise(resolve => setTimeout(resolve, 2000));
                apiRunning = await this.verifyAPIService();
            }
        }
        
        if (apiRunning) {
            console.log('✅ API服务器正在运行');
            
            // 5. 同步场景数据
            console.log('🔄 同步场景数据到API...');
            try {
                const { exec } = require('child_process');
                const util = require('util');
                const execAsync = util.promisify(exec);
                
                await execAsync('node sync_scenarios.js', { cwd: this.projectDir });
                console.log('✅ 场景数据同步完成');
            } catch (error) {
                console.error('❌ 场景数据同步失败:', error.message);
            }
        } else {
            console.log('⚠️ API服务器未运行，跳过数据同步');
        }
        
        console.log('=' .repeat(50));
        console.log('✅ 完整修复流程执行完毕！');
        
        if (apiRunning) {
            console.log('🎉 平台已修复，API服务正在运行！');
            console.log(`🔗 API端点: ${this.apiBaseUrl}/scenarios/`);
        } else {
            console.log('⚠️ 请注意：API服务器可能未成功启动');
        }
        
        console.log('📋 接下来您可以:');
        console.log(`   1. 访问前端: http://localhost:8000`);
        console.log(`   2. 测试API: ${this.apiBaseUrl}/scenarios/`);
        console.log(`   3. 运行测试验证场景可用性`);
        
        return apiRunning;
    }
}

// 执行修复
async function main() {
    const fixer = new PlatformFixer();
    const success = await fixer.runCompleteFix();
    
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ 修复过程出错:', error);
        process.exit(1);
    });
}

module.exports = PlatformFixer;