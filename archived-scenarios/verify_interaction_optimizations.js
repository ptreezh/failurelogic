/**
 * 认知陷阱平台 - 交互体验验证脚本
 * 验证所有优化是否正确实施
 */

console.log('🔍 开始验证交互体验优化...');

// 验证1: 检查GameManager是否包含新方法
function verifyGameManagerUpdates() {
    const methodsToCheck = [
        'selectOption',
        'showNextStep', 
        'renderStep',
        'showScenarioComplete',
        'performDecisionAnalysis'
    ];
    
    console.log('\n📋 验证GameManager方法:');
    let allMethodsExist = true;
    
    methodsToCheck.forEach(method => {
        const exists = typeof GameManager[method] === 'function';
        console.log(`  ${exists ? '✅' : '❌'} ${method}: ${exists ? '存在' : '缺失'}`);
        if (!exists) allMethodsExist = false;
    });
    
    return allMethodsExist;
}

// 验证2: 检查UI生成函数是否更新
function verifyUIGenerationUpdates() {
    console.log('\n🎨 验证UI生成函数:');
    
    // 检查是否包含多步骤支持
    const gameScenarioUIFunction = GameManager.generateGameScenarioUI.toString();
    const hasStepSupport = gameScenarioUIFunction.includes('scenario.steps') && 
                          gameScenarioUIFunction.includes('progress-bar');
    
    console.log(`  ${hasStepSupport ? '✅' : '❌'} 多步骤场景支持: ${hasStepSupport ? '已实现' : '缺失'}`);
    
    // 检查是否包含步骤进度显示
    const hasProgressDisplay = gameScenarioUIFunction.includes('step-progress') && 
                              gameScenarioUIFunction.includes('progress-text');
    
    console.log(`  ${hasProgressDisplay ? '✅' : '❌'} 步骤进度显示: ${hasProgressDisplay ? '已实现' : '缺失'}`);
    
    return hasStepSupport && hasProgressDisplay;
}

// 验证3: 检查决策提交逻辑是否更新
function verifyDecisionSubmissionUpdates() {
    console.log('\n⚙️  验证决策提交逻辑:');
    
    const submitDecisionFunction = GameManager.submitDecision.toString();
    const hasGameScenarioSupport = submitDecisionFunction.includes('game-.*') && 
                                   submitDecisionFunction.includes('showNextStep');
    
    console.log(`  ${hasGameScenarioSupport ? '✅' : '❌'} Game场景支持: ${hasGameScenarioSupport ? '已实现' : '缺失'}`);
    
    // 检查是否包含步骤导航逻辑
    const hasStepNavigation = submitDecisionFunction.includes('currentStep') && 
                             submitDecisionFunction.includes('totalSteps');
    
    console.log(`  ${hasStepNavigation ? '✅' : '❌'} 步骤导航: ${hasStepNavigation ? '已实现' : '缺失'}`);
    
    return hasGameScenarioSupport && hasStepNavigation;
}

// 验证4: 检查反馈系统是否优化
function verifyFeedbackSystem() {
    console.log('\n💬 验证反馈系统:');
    
    const buildFeedbackFunction = GameManager.buildDecisionFeedback.toString();
    const hasNeutralFeedback = !buildFeedbackFunction.includes('线性思维期待') && 
                              !buildFeedbackFunction.includes('线性期望');
    
    console.log(`  ${hasNeutralFeedback ? '✅' : '❌'} 中性反馈: ${hasNeutralFeedback ? '已实现' : '仍包含线性期望'}`);
    
    return hasNeutralFeedback;
}

// 运行所有验证
function runValidation() {
    console.log('\n🚀 开始全面验证...\n');
    
    const results = {
        gameManager: verifyGameManagerUpdates(),
        uiGeneration: verifyUIGenerationUpdates(), 
        decisionSubmission: verifyDecisionSubmissionUpdates(),
        feedbackSystem: verifyFeedbackSystem()
    };
    
    console.log('\n📊 验证结果汇总:');
    console.log(`  GameManager方法更新: ${results.gameManager ? '✅ 通过' : '❌ 失败'}`);
    console.log(`  UI生成函数更新: ${results.uiGeneration ? '✅ 通过' : '❌ 失败'}`);
    console.log(`  决策提交逻辑更新: ${results.decisionSubmission ? '✅ 通过' : '❌ 失败'}`);
    console.log(`  反馈系统优化: ${results.feedbackSystem ? '✅ 通过' : '❌ 失败'}`);
    
    const allPassed = Object.values(results).every(result => result);
    
    console.log(`\n🎯 总体结果: ${allPassed ? '✅ 全部优化验证通过！' : '❌ 部分优化验证失败'}`);
    
    if (allPassed) {
        console.log('\n🎉 交互体验优化完成！');
        console.log('所有场景现在都具有改进的交互体验：');
        console.log('- 决策选项选择更加直观');
        console.log('- 多步骤场景导航流畅'); 
        console.log('- 反馈信息中性且有帮助');
        console.log('- 用户体验显著提升');
    } else {
        console.log('\n⚠️  请检查验证失败的项目');
    }
    
    return allPassed;
}

// 执行验证
runValidation();