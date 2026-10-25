/**
 * Home Stats — the four numbers on the landing page.
 *
 * P0 #10: the markup used to carry data-target="1000 / 12 / 85 / 95"
 * (活跃用户 / 认知场景 / 学习效果% / 推荐率%) — none of them measured anything.
 * Every value below is read from this device's storage at render time, and
 * anything that has not been measured reports 0 rather than a plausible lie.
 */
(function (global) {
  'use strict';

  const TRAINING_KEY = 'failureLogic.trainingProgress';
  const PROFILE_KEY = 'cognitive_trap_user_profile';

  const STAGE_LABELS = {
    unconscious_incompetence: '无意识无知',
    conscious_incompetence: '有意识无知',
    conscious_competence: '有意识能力',
    unconscious_competence: '无意识能力'
  };

  function readJson(key) {
    try {
      const raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function toInt(v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  function countScenarios() {
    try {
      const engine = global.OfflineEngine;
      // getScenarios() is async — asking it for a count at paint time used to
      // yield 0 on the landing page. scenarioIds is the synchronous registry.
      if (engine) {
        if (Array.isArray(engine.scenarioIds)) return engine.scenarioIds.length;
      }
    } catch (e) {
      // fall through to the router registry below
    }
    try {
      const reg = global.challengerRouter && global.challengerRouter.SCENARIOS;
      if (reg && typeof reg === 'object') return Object.keys(reg).length;
    } catch (e) {
      // no engine loaded yet
    }
    return 0;
  }

  function collect() {
    const training = readJson(TRAINING_KEY) || {};
    const profile = readJson(PROFILE_KEY) || {};
    const stats = profile.statistics || {};

    const gamesFromTracker = toInt(training.games_completed);
    const gamesFromProfile = toInt(stats.scenariosCompleted);
    const games = Math.max(gamesFromTracker, gamesFromProfile);

    const awakening = Math.max(toInt(training.awakening_count), toInt(stats.awakeningMoments));

    const stageId = training.last_stage || '';
    const stageLabel = STAGE_LABELS[stageId] || (games > 0 ? STAGE_LABELS.conscious_incompetence : '未开始');

    return [
      { key: 'games', label: '本机完成局数', value: games, unit: '局' },
      { key: 'scenarios', label: '可玩场景', value: countScenarios(), unit: '个' },
      { key: 'awakening', label: '觉醒时刻', value: awakening, unit: '次' },
      { key: 'stage', label: '当前训练阶段', value: stageLabel, unit: '' }
    ];
  }

  function render() {
    const container = document.querySelector('.stats-section .stats-container');
    if (!container) return false;

    const rows = collect();
    container.innerHTML = rows.map(function (row) {
      const shown = row.unit && typeof row.value === 'number'
        ? row.value + '<span class="stat-unit">' + row.unit + '</span>'
        : String(row.value);
      return '<div class="stat-item">' +
        '<div class="stat-number" data-stat="' + row.key + '">' + shown + '</div>' +
        '<div class="stat-label">' + row.label + '</div>' +
        '</div>';
    }).join('');

    container.setAttribute('data-source', 'local');
    return true;
  }

  global.HomeStats = { render: render, collect: collect };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})(typeof window !== 'undefined' ? window : this);
