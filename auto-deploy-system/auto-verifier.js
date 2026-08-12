#!/usr/bin/env node
/**
 * 全自动部署验证系统
 * 每30小时执行一次，全solo模式
 * 第一性原理：5层全故障模式枚举 + 自动修复
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');

// ==================== 配置 ====================
const CONFIG = {
  projectRoot: path.resolve(__dirname, '..'),
  checkInterval: 30 * 60 * 60 * 1000, // 30小时
  urls: {
    githubPages: 'https://ptreezh.github.io/failurelogic/',
    apiBackend: 'https://insightful-enthusiasm-production.up.railway.app',
    appJs: 'https://ptreezh.github.io/failurelogic/assets/js/app.js'
  },
  retry: {
    maxAttempts: 10,
    delay: 30000 // 30秒
  },
  paths: {
    report: path.join(__dirname, 'verification-report.json'),
    log: path.join(__dirname, 'verification.log'),
    findings: path.join(__dirname, 'findings.md'),
    progress: path.join(__dirname, 'progress.md')
  }
};

// ==================== 日志系统 ====================
class Logger {
  constructor(logPath) {
    this.logPath = logPath;
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message, data };
    fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
    console.log(`[${timestamp}] [${level}] ${message}`, data || '');
  }

  info(msg, data) { this.log('INFO', msg, data); }
  warn(msg, data) { this.log('WARN', msg, data); }
  error(msg, data) { this.log('ERROR', msg, data); }
  success(msg, data) { this.log('SUCCESS', msg, data); }
}

const logger = new Logger(CONFIG.paths.log);

// ==================== 第一性原理检查器 ====================
class FirstPrinciplesChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      layers: {},
      overall: 'UNKNOWN',
      autoFixed: [],
      needsManual: []
    };
  }

  // L0: 代码仓库完整性
  async checkRepoIntegrity() {
    logger.info('🔍 L0: 检查代码仓库完整性');
    const layer = { status: 'PASS', checks: [], fixes: [] };

    try {
      // 检查git状态
      const status = execSync('git status --short', { cwd: CONFIG.projectRoot, encoding: 'utf8' }).trim();
      if (status) {
        layer.checks.push({ name: 'git_status', status: 'DIRTY', details: status });
        layer.status = 'FAIL';

        // 自动修复：提交未提交的更改
        try {
          execSync('git add -A', { cwd: CONFIG.projectRoot });
          execSync('git commit -m "auto: verification auto-commit"', { cwd: CONFIG.projectRoot });
          layer.fixes.push({ action: 'auto_commit', status: 'SUCCESS' });
          layer.status = 'PASS';
        } catch (e) {
          layer.fixes.push({ action: 'auto_commit', status: 'FAILED', error: e.message });
        }
      } else {
        layer.checks.push({ name: 'git_status', status: 'CLEAN' });
      }

      // 检查分支
      const branch = execSync('git branch --show-current', { cwd: CONFIG.projectRoot, encoding: 'utf8' }).trim();
      layer.checks.push({ name: 'branch', status: branch === 'main' ? 'OK' : 'WRONG', value: branch });

      // 检查关键文件是否存在
      const criticalFiles = [
        'index.html',
        'assets/js/app.js',
        'assets/js/page-router-base.js',
        'assets/js/coffee-shop-deep-router.js',
        'api-server/start.py'
      ];

      for (const file of criticalFiles) {
        const exists = fs.existsSync(path.join(CONFIG.projectRoot, file));
        layer.checks.push({
          name: `file_${file}`,
          status: exists ? 'EXISTS' : 'MISSING'
        });

        if (!exists) {
          layer.status = 'FAIL';
          // 尝试从git恢复
          try {
            execSync(`git show HEAD:${file} > ${file}`, { cwd: CONFIG.projectRoot });
            layer.fixes.push({ action: `restore_${file}`, status: 'SUCCESS' });
            layer.status = 'PASS';
          } catch (e) {
            layer.fixes.push({ action: `restore_${file}`, status: 'FAILED' });
          }
        }
      }
    } catch (e) {
      layer.status = 'ERROR';
      layer.error = e.message;
    }

    this.results.layers.repo = layer;
    return layer.status === 'PASS';
  }

  // L1: GitHub Pages部署状态
  async checkGitHubPages() {
    logger.info('🔍 L1: 检查GitHub Pages部署');
    const layer = { status: 'PENDING', checks: [], attempts: 0 };

    for (let attempt = 1; attempt <= CONFIG.retry.maxAttempts; attempt++) {
      layer.attempts = attempt;
      logger.info(`  Attempt ${attempt}/${CONFIG.retry.maxAttempts}`);

      try {
        // 检查主页面
        const mainPage = await this.fetchWithTimeout(CONFIG.urls.githubPages, 5000);
        if (mainPage.statusCode === 200) {
          layer.checks.push({ name: 'main_page', status: 'OK', statusCode: mainPage.statusCode });

          // 检查关键JS文件
          const appJs = await this.fetchWithTimeout(CONFIG.urls.appJs, 5000);
          if (appJs.statusCode === 200) {
            layer.checks.push({ name: 'app_js', status: 'OK', size: appJs.headers['content-length'] });
            layer.status = 'PASS';
            logger.success('✅ GitHub Pages fully operational');
            return true;
          } else {
            layer.checks.push({ name: 'app_js', status: 'NOT_FOUND', statusCode: appJs.statusCode });
          }
        } else {
          layer.checks.push({ name: 'main_page', status: 'ERROR', statusCode: mainPage.statusCode });
        }
      } catch (e) {
        layer.checks.push({ name: `attempt_${attempt}`, status: 'TIMEOUT', error: e.message });
      }

      if (attempt < CONFIG.retry.maxAttempts) {
        logger.info(`  Waiting ${CONFIG.retry.delay/1000}s before retry...`);
        await this.sleep(CONFIG.retry.delay);
      }
    }

    layer.status = 'FAIL';
    this.results.layers.githubPages = layer;
    this.results.needsManual.push({
      layer: 'L1-GitHubPages',
      issue: '部署未就绪或持续失败',
      action: '检查GitHub Pages设置，确认workflow执行状态'
    });
    return false;
  }

  // L2: 前端运行时
  async checkFrontendRuntime() {
    logger.info('🔍 L2: 检查前端运行时');
    const layer = { status: 'PASS', checks: [] };

    try {
      // 检查JS语法
      const jsFiles = [
        'assets/js/app.js',
        'assets/js/page-router-base.js',
        'assets/js/coffee-shop-deep-router.js'
      ];

      for (const file of jsFiles) {
        const filePath = path.join(CONFIG.projectRoot, file);
        if (fs.existsSync(filePath)) {
          try {
            const code = fs.readFileSync(filePath, 'utf8');
            new Function(code); // 语法检查
            layer.checks.push({ name: `syntax_${path.basename(file)}`, status: 'OK' });
          } catch (e) {
            layer.checks.push({ name: `syntax_${path.basename(file)}`, status: 'SYNTAX_ERROR', error: e.message });
            layer.status = 'FAIL';
          }
        }
      }

      // 检查index.html引用完整性
      const indexPath = path.join(CONFIG.projectRoot, 'index.html');
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        const scriptRefs = indexContent.match(/src="([^"]+\.js)"/g) || [];
        const missingRefs = [];

        for (const ref of scriptRefs) {
          const filePath = ref.match(/src="([^"]+)"/)[1];
          const fullPath = path.join(CONFIG.projectRoot, filePath);
          if (!fs.existsSync(fullPath)) {
            missingRefs.push(filePath);
          }
        }

        if (missingRefs.length > 0) {
          layer.checks.push({ name: 'html_refs', status: 'MISSING', files: missingRefs });
          layer.status = 'FAIL';

          // 自动修复：从git恢复
          for (const missing of missingRefs) {
            try {
              execSync(`git show HEAD:${missing} > ${missing}`, { cwd: CONFIG.projectRoot });
              layer.checks.push({ name: `restore_${missing}`, status: 'RESTORED' });
            } catch (e) {
              layer.checks.push({ name: `restore_${missing}`, status: 'FAILED' });
            }
          }
        } else {
          layer.checks.push({ name: 'html_refs', status: 'OK', count: scriptRefs.length });
        }
      }
    } catch (e) {
      layer.status = 'ERROR';
      layer.error = e.message;
    }

    this.results.layers.frontend = layer;
    return layer.status === 'PASS';
  }

  // L3: 后端服务
  async checkBackend() {
    logger.info('🔍 L3: 检查后端服务');
    const layer = { status: 'PASS', checks: [] };

    try {
      const response = await this.fetchWithTimeout(CONFIG.urls.apiBackend, 5000);
      layer.checks.push({
        name: 'api_health',
        status: response.statusCode === 200 ? 'OK' : 'ERROR',
        statusCode: response.statusCode,
        body: response.body?.substring(0, 200)
      });

      if (response.statusCode !== 200) {
        layer.status = 'FAIL';
        this.results.needsManual.push({
          layer: 'L3-Backend',
          issue: `Backend返回 ${response.statusCode}`,
          action: '检查Railway部署状态，可能需要手动重启'
        });
      }
    } catch (e) {
      layer.checks.push({ name: 'api_health', status: 'TIMEOUT', error: e.message });
      layer.status = 'FAIL';
      this.results.needsManual.push({
        layer: 'L3-Backend',
        issue: 'Backend连接超时',
        action: '检查Railway服务是否休眠，发送唤醒请求'
      });
    }

    this.results.layers.backend = layer;
    return layer.status === 'PASS';
  }

  // L4: 网络连通性
  async checkNetwork() {
    logger.info('🔍 L4: 检查网络连通性');
    const layer = { status: 'PASS', checks: [] };

    const endpoints = [
      'https://github.com',
      'https://api.github.com',
      'https://ptreezh.github.io'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.fetchWithTimeout(endpoint, 3000);
        layer.checks.push({ name: endpoint, status: 'OK', statusCode: response.statusCode });
      } catch (e) {
        layer.checks.push({ name: endpoint, status: 'FAIL', error: e.message });
        layer.status = 'FAIL';
      }
    }

    this.results.layers.network = layer;
    return layer.status === 'PASS';
  }

  // L5: 应用逻辑
  async checkApplicationLogic() {
    logger.info('🔍 L5: 检查应用逻辑');
    const layer = { status: 'PASS', checks: [] };

    try {
      // 运行单元测试
      const testResult = execSync('node tests/unit/master-test-runner.js', {
        cwd: CONFIG.projectRoot,
        encoding: 'utf8',
        timeout: 60000
      });

      const testMatch = testResult.match(/Passed:\s+(\d+)/);
      const failMatch = testResult.match(/Failed:\s+(\d+)/);

      layer.checks.push({
        name: 'unit_tests',
        status: failMatch && parseInt(failMatch[1]) === 0 ? 'PASS' : 'FAIL',
        passed: testMatch ? parseInt(testMatch[1]) : 0,
        failed: failMatch ? parseInt(failMatch[1]) : 0
      });

      if (failMatch && parseInt(failMatch[1]) > 0) {
        layer.status = 'FAIL';
      }
    } catch (e) {
      layer.checks.push({ name: 'unit_tests', status: 'ERROR', error: e.message });
      layer.status = 'FAIL';
    }

    this.results.layers.application = layer;
    return layer.status === 'PASS';
  }

  // ==================== 工具方法 ====================
  fetchWithTimeout(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const transport = urlObj.protocol === 'https:' ? https : http;

      const req = transport.get(url, { timeout }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout: ${url}`));
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== 主执行流程 ====================
  async runAllChecks() {
    logger.info('🚀 开始全自动部署验证...');
    logger.info(`时间: ${new Date().toISOString()}`);
    logger.info(`项目根目录: ${CONFIG.projectRoot}`);

    const results = await Promise.all([
      this.checkRepoIntegrity(),
      this.checkGitHubPages(),
      this.checkFrontendRuntime(),
      this.checkBackend(),
      this.checkNetwork(),
      this.checkApplicationLogic()
    ]);

    this.results.overall = results.every(r => r) ? 'PASS' : 'FAIL';

    // 生成报告
    this.generateReport();

    // 保存结果
    fs.writeFileSync(CONFIG.paths.report, JSON.stringify(this.results, null, 2));

    if (this.results.overall === 'PASS') {
      logger.success('✅ 所有检查通过！系统健康。');
    } else {
      logger.error('❌ 检查失败，需要关注。');
      if (this.results.needsManual.length > 0) {
        logger.warn('需要人工介入的问题：');
        this.results.needsManual.forEach(item => {
          logger.warn(`  [${item.layer}] ${item.issue}`);
          logger.warn(`    建议操作: ${item.action}`);
        });
      }
    }

    return this.results;
  }

  generateReport() {
    const report = `
# 自动验证报告

**生成时间**: ${this.results.timestamp}

## 总体状态: ${this.results.overall}

## 各层检查结果

${Object.entries(this.results.layers).map(([layer, data]) => `
### ${layer.toUpperCase()}
- **状态**: ${data.status}
- **尝试次数**: ${data.attempts || 'N/A'}
- **自动修复**: ${data.fixes?.length || 0} 项

${data.checks?.map(check => `
- ${check.name}: ${check.status} ${check.error ? `(${check.error})` : ''}
`).join('') || ''}
`).join('\n')}

## 需要人工介入的问题

${this.results.needsManual.map(item => `
- [${item.layer}] ${item.issue}
  - 建议操作: ${item.action}
`).join('\n') || '无'}

## 建议下一步

${this.results.overall === 'PASS'
  ? '- 系统健康，等待下次自动检查'
  : '- 优先处理标记为需要人工介入的问题'
  + '\n- 检查详细日志: verification.log'
}
`;

    fs.writeFileSync(CONFIG.paths.findings, report);
    logger.info(`报告已生成: ${CONFIG.paths.findings}`);
  }
}

// ==================== 定时调度器 ====================
class VerificationScheduler {
  constructor(checker) {
    this.checker = checker;
    this.timer = null;
    this.isRunning = false;
  }

  start() {
    logger.info(`⏰ 启动30小时定时验证调度器`);
    logger.info(`下次执行: ${new Date(Date.now() + CONFIG.checkInterval).toLocaleString()}`);

    // 立即执行一次
    this.runCheck();

    // 设置定时器
    this.timer = setInterval(() => {
      this.runCheck();
    }, CONFIG.checkInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('⏸️ 定时器已停止');
    }
  }

  async runCheck() {
    if (this.isRunning) {
      logger.warn('上一次检查仍在运行中，跳过本次');
      return;
    }

    this.isRunning = true;
    try {
      await this.checker.runAllChecks();
    } catch (e) {
      logger.error('检查过程发生异常', e);
    } finally {
      this.isRunning = false;
    }
  }
}

// ==================== 启动 ====================
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   全自动部署验证系统 v1.0                                  ║');
  console.log('║   检查间隔: 30小时 | 模式: 全solo                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log();

  const checker = new FirstPrinciplesChecker();
  const scheduler = new VerificationScheduler(checker);

  // 处理退出信号
  process.on('SIGINT', () => {
    console.log('\n\n收到退出信号，正在停止...');
    scheduler.stop();
    process.exit(0);
  });

  // 启动调度器
  scheduler.start();

  console.log('✅ 自动验证系统已启动');
  console.log('   按 Ctrl+C 停止');
  console.log();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(e => {
    console.error('启动失败:', e);
    process.exit(1);
  });
}

module.exports = { FirstPrinciplesChecker, VerificationScheduler };
