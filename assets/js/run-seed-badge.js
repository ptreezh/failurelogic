/* run-seed-badge.js — 把「本局编号（选项 seed）」暴露给玩家。
 *
 * 为什么需要它：引擎从 Loop 2 起支持 window.__FL_OPTION_SEED__ / ?seed= 复现
 * 同一套题序，但入口只在控制台里，玩家和答疑都拿不到。复盘一句"你那局第 4 回合
 * 是哪些选项"没有编号就对不上，教学复现只能靠猜。
 *
 * Loop 4 改动：seed 是引擎级能力（每个场景各自一份题序），徽标不该只贴 climate
 * 一个场景——否则另外三个场景的玩家依旧拿不到编号。现在任何场景开局都会挂标，
 * 并把场景 id 一起记下（换场景时自动切到该场景的编号）。
 *
 * 不改渲染、不改引擎逻辑，只包一层 createGameSession。
 */
(function () {
  'use strict';
  var el = null;
  var lastScenario = '';

  function ensureBadge() {
    if (el && el.isConnected) return el;
    el = document.createElement('div');
    el.id = 'fl-run-seed-badge';
    el.setAttribute('role', 'note');
    el.style.cssText = [
      'position:fixed', 'right:12px', 'bottom:12px', 'z-index:9998',
      'font:11px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif',
      'background:rgba(20,22,26,.78)', 'color:#d5d9e0',
      'padding:5px 9px', 'border-radius:6px', 'cursor:pointer',
      'user-select:none', 'opacity:.72', 'max-width:60vw',
      'white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis'
    ].join(';');
    el.title = '点击复制可复现的链接';
    document.body.appendChild(el);
    el.addEventListener('click', function () {
      var seed = el.getAttribute('data-seed') || '';
      if (!seed) return;
      var url = location.origin + location.pathname + '?seed=' + seed;
      var done = function () {
        el.textContent = '已复制：?seed=' + seed;
        setTimeout(render, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, done);
      } else {
        done();
      }
    });
    return el;
  }

  function render() {
    var seed = window.__FL_CURRENT_SEED__;
    if (!seed) return;
    var node = ensureBadge();
    node.setAttribute('data-seed', String(seed));
    node.setAttribute('data-scenario', lastScenario);
    node.textContent = '本局编号 ' + seed + ' · 可复现';
    // 窄屏横屏/小高度时，右下角会压在底部操作条上：让位到左下。
    var narrow = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
    node.style.left = narrow ? '12px' : 'auto';
    node.style.right = narrow ? 'auto' : '12px';
    node.style.bottom = 'calc(12px + env(safe-area-inset-bottom, 0px))';
    node.style.maxWidth = narrow ? '46vw' : '60vw';
  }

  function attach() {
    var eng = window.OfflineEngine;
    if (!eng || eng.__flSeedPatched) return;
    eng.__flSeedPatched = true;
    var orig = eng.createGameSession;
    if (typeof orig !== 'function') return;
    eng.createGameSession = function (scenarioId) {
      var out = orig.apply(this, arguments);
      var scn = String(scenarioId || '');
      var publish = function () {
        var seed = 0;
        try { seed = parseInt(localStorage.getItem('fl_option_seed_' + scn), 10) || 0; } catch (e) {}
        if (seed) {
          lastScenario = scn;
          window.__FL_CURRENT_SEED__ = seed;
          window.__FL_CURRENT_SEED_SCENARIO__ = scn;
          render();
        }
      };
      if (out && typeof out.then === 'function') out.then(publish, function () {});
      else publish();
      return out;
    };
  }

  window.addEventListener('resize', function () { if (el && el.isConnected) render(); });

  // 引擎脚本在本文件之前加载，但离线兜底是懒初始化的，两处都试一次即可。
  attach();
  document.addEventListener('DOMContentLoaded', attach);
  setTimeout(attach, 1500);
})();
