/**
 * Training Stage Tracker
 * 训练四阶段跟踪器 — Dörner 训练目标之"能力阶段演化"
 *
 * 四阶段：
 * 1. unconscious_incompetence — 无意识无知：用户不知道自己有偏差
 * 2. conscious_incompetence — 有意识无知：用户开始意识到偏差
 * 3. conscious_competence — 有意识能力：用户能够识别并纠正偏差
 * 4. unconscious_competence — 无意识能力：用户自动应用正确思维
 *
 * 阶段推断依据：
 * - 完成的游戏局数
 * - 觉醒时刻触发的次数（说明用户进入了"意识到"的阶段）
 * - 各局的偏差检测减少率
 * - 终局尸检中识别的偏差类型数
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'failureLogic.trainingProgress';

  const STAGES = {
    unconscious_incompetence: {
      id: 'unconscious_incompetence',
      level: 1,
      name: '无意识无知',
      description: '你不知道自己的认知偏差。游戏会暴露你的思维盲区。',
      nextHint: '完成 1 局游戏，了解自己的决策模式'
    },
    conscious_incompetence: {
      id: 'conscious_incompetence',
      level: 2,
      name: '有意识无知',
      description: '你开始意识到自己的认知偏差。觉醒时刻会标记你的思维陷阱。',
      nextHint: '尝试不同决策组合，减少觉醒时刻触发次数'
    },
    conscious_competence: {
      id: 'conscious_competence',
      level: 3,
      name: '有意识能力',
      description: '你能识别并主动纠正偏差。系统会追踪你的进步。',
      nextHint: '在 3 局游戏中保持觉醒时刻触发 < 1 次'
    },
    unconscious_competence: {
      id: 'unconscious_competence',
      level: 4,
      name: '无意识能力',
      description: '你已经形成系统性思维，能自动避免常见认知陷阱。',
      nextHint: '持续实践，将能力迁移到其他场景'
    }
  };

  class TrainingStageTracker {
    constructor() {
      this.progress = this.load() || this.defaultProgress();
    }

    defaultProgress() {
      return {
        games_completed: 0,
        awakening_count: 0,
        avg_gap: 0,
        last_stage: 'unconscious_incompetence',
        last_updated: Date.now(),
        bias_history: []
      };
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
      } catch {
        // ignore storage failures
      }
    }

    recordGameOutcome({ awakening_count, gap_total, biases_detected }) {
      const prev = this.progress;
      const newCount = prev.games_completed + 1;
      const newAwakening = prev.awakening_count + (awakening_count || 0);
      const newAvgGap = ((prev.avg_gap * prev.games_completed) + (gap_total || 0)) / newCount;

      const newProgress = {
        games_completed: newCount,
        awakening_count: newAwakening,
        avg_gap: newAvgGap,
        last_updated: Date.now(),
        bias_history: [...(prev.bias_history || []).slice(-9), biases_detected || []]
      };
      // 计算阶段必须基于更新后的 progress（避免读到 prev 的旧值）
      newProgress.last_stage = this.computeStageFor(newProgress);
      this.progress = newProgress;
      this.save();
      return this.progress;
    }

    computeStage() {
      return this.computeStageFor(this.progress);
    }

    computeStageFor(progress) {
      const { games_completed, awakening_count, bias_history } = progress;
      const recentBiases = (bias_history || []).flat();
      const recentGames = bias_history.length;

      // 阶段 1 → 2：完成 1 局且经历了至少 1 次觉醒
      if (games_completed >= 1 && awakening_count >= 1) {
        // 阶段 2 → 3：最近 3 局觉醒次数 < 3（即用户在学习避免）
        const recentAwakening = bias_history.slice(-3).reduce((sum, biases) => {
          return sum + (biases || []).filter((b) => b && b.type).length;
        }, 0);
        if (recentGames >= 3 && recentAwakening < 3) {
          // 阶段 3 → 4：偏差检测持续减少
          const recentAvgBias = recentAwakening / recentGames;
          if (recentAvgBias < 0.5 && games_completed >= 5) {
            return 'unconscious_competence';
          }
          return 'conscious_competence';
        }
        return 'conscious_incompetence';
      }
      return 'unconscious_incompetence';
    }

    getCurrentStage() {
      const stageId = this.progress.last_stage || 'unconscious_incompetence';
      return STAGES[stageId] || STAGES.unconscious_incompetence;
    }

    getNextStage() {
      const current = this.getCurrentStage();
      const nextLevel = current.level + 1;
      const next = Object.values(STAGES).find((s) => s.level === nextLevel);
      return next || null;
    }

    getProgressToNextStage() {
      const { games_completed, awakening_count, bias_history } = this.progress;
      const stage = this.getCurrentStage();

      if (stage.level >= 4) return { percent: 100, remaining: 0, label: '已达成最高阶段' };

      // 简化进度估算：基于已完成的局数和觉醒次数
      let percent = 0;
      let label = '';

      if (stage.level === 1) {
        // 1→2：完成首局 + 经历觉醒
        const completed = games_completed >= 1 ? 50 : 0;
        const awakened = awakening_count >= 1 ? 50 : 0;
        percent = completed + awakened;
        label = `完成 ${games_completed}/1 局, 觉醒 ${awakening_count}/1 次`;
      } else if (stage.level === 2) {
        // 2→3：最近 3 局觉醒 < 3
        const recent = (bias_history || []).slice(-3);
        const recentGames = recent.length;
        const recentAwakening = recent.reduce((s, b) => s + (b?.length || 0), 0);
        percent = Math.min(100, (recentGames / 3) * 70 + (1 - recentAwakening / 3) * 30);
        label = `最近 3 局觉醒 ${recentAwakening}/3 次`;
      } else if (stage.level === 3) {
        // 3→4：5 局 + 偏差 < 0.5
        percent = Math.min(100, (games_completed / 5) * 60);
        const recentAvgBias = ((bias_history || []).slice(-3).reduce((s, b) => s + (b?.length || 0), 0)) / 3;
        percent += (1 - Math.min(1, recentAvgBias)) * 40;
        label = `完成 ${games_completed}/5 局`;
      }

      return { percent: Math.round(percent), label, remaining: Math.max(0, 100 - Math.round(percent)) };
    }

    renderProfilePanel() {
      const stage = this.getCurrentStage();
      const next = this.getNextStage();
      const progress = this.getProgressToNextStage();

      return `
        <div class="training-stage-panel" data-testid="training-stage-panel" data-stage="${stage.id}">
          <h3>🎯 训练阶段</h3>
          <div class="current-stage" data-testid="current-stage">
            <span class="stage-level">L${stage.level}</span>
            <span class="stage-name">${stage.name}</span>
          </div>
          <p class="stage-description">${stage.description}</p>
          ${next ? `
            <div class="progress-to-next">
              <div class="progress-label">
                <span>→ ${next.name}</span>
                <span class="progress-percent">${progress.percent}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.percent}%"></div>
              </div>
              <p class="progress-hint">${progress.label}</p>
              <p class="next-hint">💡 ${next.nextHint}</p>
            </div>
          ` : '<p class="max-stage">🌟 已达成最高训练阶段！</p>'}
          <div class="training-stats">
            <div class="stat"><strong>${this.progress.games_completed}</strong> 局游戏</div>
            <div class="stat"><strong>${this.progress.awakening_count}</strong> 次觉醒</div>
            <div class="stat"><strong>¥${Math.round(this.progress.avg_gap)}</strong> 平均差距</div>
          </div>
        </div>
      `;
    }
  }

  global.TrainingStageTracker = TrainingStageTracker;
  global.STAGES = STAGES;
})(typeof window !== 'undefined' ? window : globalThis);

// Auto-inject into .profile-content when DOM is ready
function injectTrainingPanelIntoProfile() {
  const container = document.querySelector('.profile-content');
  if (!container) return;
  if (typeof window.__trainingTracker === 'undefined') {
    window.__trainingTracker = new TrainingStageTracker();
  }
  container.innerHTML = window.__trainingTracker.renderProfilePanel();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTrainingPanelIntoProfile);
  } else {
    injectTrainingPanelIntoProfile();
  }
  // 监听 SPA 路由切换（自定义事件或 MutationObserver 兜底）
  document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item[data-page="profile"]');
    if (navItem) {
      setTimeout(injectTrainingPanelIntoProfile, 50);
    }
  });
}
