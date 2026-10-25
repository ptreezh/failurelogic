/**
 * fl-profile.js — 跨局聚合视图（SPEC-v2 · M2）
 *
 * 存在的理由：现在每局的复盘只在当局结束那一屏出现，玩家没法回答
 * "我这个人是不是总在同一个坑里栽"。「教育效果不可知」的一半原因是
 * 数据只按局存、没有跨局视图。
 *
 * 三条硬约束（都有对应断言看着）：
 *   1. 不新建第二套日志：只吃既有的 offline_sessions，纯读，不写 storage。
 *   2. 缺就是 missing：没打完、没结局、没命中的点标 missing 并置 null，
 *      绝不填 0、绝不拿别局均值顶替——那会让一页全是推断值的画像看起来很像真的。
 *   3. 不阻断：任何脏数据跳过，不抛错、不要求补录。
 */
(function (root) {
  'use strict';

  // 每局固定产出的字段（系数）。改这个数组等于改 A2.1，必须同步改 spec 与断言。
  var PER_SESSION_FIELDS = [
    'scenario_id',
    'end_turn',
    'decision_count',
    'final_outcome_code',
    'concept_hit_count',
    'backfire_count'
  ];

  function isObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }

  function readField(session, field) {
    var st = isObj(session.game_state) ? session.game_state : {};
    switch (field) {
      case 'scenario_id':
        return session.scenario_id || null;
      case 'end_turn':
        // turn_number 是"下一回合号"，结束回合要减 1；拿不到就直接 missing
        return typeof st.turn_number === 'number' ? Math.max(0, st.turn_number - 1) : null;
      case 'decision_count': {
        if (typeof session.decision_count === 'number') return session.decision_count;
        var hist = Array.isArray(st.decision_history) ? st.decision_history : null;
        return hist ? hist.length : null;
      }
      case 'final_outcome_code':
        return isObj(session.final_outcome)
          ? (session.final_outcome.id || session.final_outcome.code || null)
          : null;
      case 'concept_hit_count': {
        // 只认已经算好并存下来的命中数；没算过就是 missing，
        // 不在这里临时重算——重算会让"上次看到的画像"和"这次的画像"悄悄变脸。
        var c = session.debrief && session.debrief.concept_hit_count;
        return typeof c === 'number' ? c : null;
      }
      case 'backfire_count': {
        var b = session.debrief && session.debrief.backfire_count;
        return typeof b === 'number' ? b : null;
      }
      default:
        return session[field] != null ? session[field] : null;
    }
  }

  function aggregate(sessions) {
    var list = [];
    if (isObj(sessions)) {
      Object.keys(sessions).forEach(function (k) {
        var s = sessions[k];
        if (!isObj(s)) return; // 脏记录跳过，不阻断整页
        list.push(s);
      });
    }

    var points = [];
    var missing = [];
    var okCount = 0;

    list.forEach(function (s, i) {
      var sid = s.session_id || ('#' + i);
      PER_SESSION_FIELDS.forEach(function (f) {
        var v = readField(s, f);
        var missingFlag = v === null || v === undefined;
        points.push({
          session_id: sid,
          scenario_id: s.scenario_id || null,
          field: f,
          value: missingFlag ? null : v,
          status: missingFlag ? 'missing' : 'ok'
        });
        if (missingFlag) missing.push({ session_id: sid, field: f });
        else okCount += 1;
      });
    });

    return {
      sessionCount: list.length,
      coeff: PER_SESSION_FIELDS.length,
      points: points,
      missing: missing,
      // 覆盖率 = 有真值的点 / 全部点。界面据此说明"这页有多少是真数据"，
      // 而不是让玩家以为满屏数字都是测出来的。
      coverage: points.length ? okCount / points.length : 0,
      // 跨局对照：同一场景重复玩的次数，用于"同一个坑栽几次"的叙事
      byScenario: (function () {
        var m = {};
        list.forEach(function (s) {
          var k = s.scenario_id || 'unknown';
          m[k] = (m[k] || 0) + 1;
        });
        return m;
      })()
    };
  }

  root.FLProfile = {
    PER_SESSION_FIELDS: PER_SESSION_FIELDS,
    aggregate: aggregate
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FLProfile;
})(typeof window !== 'undefined' ? window : globalThis);
