#!/usr/bin/env node
/**
 * 主启动脚本 - 自动部署验证 + 全场景测试
 * 全solo模式，无需人工干预
 */

const { spawn } = require('child_process');
const path = require('path');

const CONFIG = {
  projectRoot: path.resolve(__dirname, '..'),
  autoVerifyScript: path.join(__dirname, 'auto-verifier.js'),
  autoTestScript: path.join(__dirname, 'auto-test-runner.js')
};

async function runCommand(command, args, description) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log('═'.repeat(60));

  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: CONFIG.projectRoot,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} 完成`);
        resolve();
      } else {
        console.error(`❌ ${description} 失败，退出码: ${code}`);
        reject(new Error(`${description} failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Failure Logic 自动部署验证 + 全场景测试系统             ║');
  console.log('║   全solo模式 | 第一性原理 | 30小时定时                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    // 1. 执行部署验证
    await runCommand('node', [CONFIG.autoVerifyScript], '部署健康检查');

    // 2. 执行全场景测试
    await runCommand('node', [CONFIG.autoTestScript], '全场景覆盖测试');

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ✅ 所有检查完成                                         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

  } catch (e) {
    console.error('\n❌ 执行过程中断:', e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
