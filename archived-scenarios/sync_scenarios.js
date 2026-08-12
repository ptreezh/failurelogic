
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
                
                console.log(`✅ 已加载文件: ${file} (${Array.isArray(data.scenarios) ? data.scenarios.length : Array.isArray(data.game_scenarios) ? data.game_scenarios.length : 0} 个场景)`);
            } catch (error) {
                console.warn(`⚠️  加载文件失败: ${file}`, error.message);
            }
        }
        
        console.log(`📊 总共加载了 ${allScenarios.length} 个场景`);
        
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
        