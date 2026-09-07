# Scenario Depth Audit — 2026-09-08

> Round 2 of grill-down. The user pushed back: "场景的深度，不是数量.
> 一个有意义的有效的场景故事，比多个肤浅的没有教育意义的更有价值"
>
> They were right. Round 1 verified mechanics (state changes, response size,
> feedback works). Round 1 did NOT verify educational design.
> Round 1 actually added 27 SHALLOW scenarios by restoring JSON files,
> making the surface area bigger while depth stayed at zero.

## Dörner's "The Logic of Failure" — what real scenarios should embody

The book (Dietrich Dörner, 1989) studies how humans fail at managing complex
systems. His famous "Lohhausen" experiments showed subjects consistently
failing because of:

1. **Linear thinking in non-linear systems** — expecting proportional
   cause-effect when systems amplify or dampen inputs
2. **Time delays** — action effects appear later, so the system "looks
   unresponsive" while effects accumulate
3. **Self-referential systems** — the system changes itself in response
   to your intervention (e.g., raising prices reduces demand, but
   competitors respond)
4. **Side effects** — interventions affect variables you didn't target
5. **Single-target optimization** — optimizing one metric (profit) at
   expense of others (morale, sustainability)
6. **Confirmation bias** — seeking data that supports your model,
   ignoring contradictions
7. **Lack of self-criticism** — refusing to update mental model when
   evidence contradicts it
8. **Regulation lag** — over-correcting then over-correcting back

## Current state: ALL 30 scenarios are shallow placeholders

I read the full content of all 30 scenarios. Categories:

### BASE_SCENARIOS (3) — Empty shells

```python
{
    "id": "coffee-shop-nonlinear-effects",
    "name": "咖啡店非线性效应",
    "description": "管理咖啡店，体验非线性效应...",
    "fullDescription": "在这个场景中，您将管理一家咖啡店...",
    "targetPatterns": ["nonlinear_effects"]
}
```

- Has name + 1-2 sentence description + target_pattern code name
- **No specific situation** (customer base? competitors? budget?)
- **No decision options** (what does the player actually choose?)
- **No multi-turn structure** (the execute_real_logic does exist for
  coffee-shop but only handles hire_staff and marketing with hardcoded
  amount thresholds — see `logic/turn_executor.py:36-160`)

**Verdict**: Placeholder. Player opens scenario, has no clear decision to
make. The "logic" that runs is a 4-action mechanical state mutator with
no narrative context.

### game_scenarios.json (3) — Single-step Q&A

```json
{
    "scenarioId": "game-001",
    "title": "商业战略推理游戏",
    "steps": [
        {
            "step": 1,
            "situation": "你的科技公司...",
            "options": ["立即投放市场", "进行更多测试", "收购竞争对手", "合作开发"],
            "explanation": "不同的选择反映不同的商业思维模式..."
        }
    ]
}
```

- Single decision point
- No multi-turn state evolution
- No cascading effects
- "explanation" is generic lecturing, not consequence-of-choice

**Verdict**: Multiple-choice test disguised as game. No simulation.

### advanced_game_scenarios.json (3) — Same shape as game_scenarios

Same structure as game_scenarios.json. Single-step Q&A.

### historical_cases.json (21) — Wikipedia articles, not simulations

```json
{
    "scenarioId": "hist-001",
    "title": "挑战者号航天飞机灾难",
    "description": "1986年挑战者号航天飞机发射决策过程分析",
    "decisionPoints": [
        {"step": 1, "situation": "...", "options": [...]},
        {"step": 2, "situation": "...", "options": [...]}
    ],
    "actualOutcomes": ["管理层决定按计划发射", "O型环失效", ...],
    "alternativeOptions": ["推迟发射以进行低温环境试验", ...]
}
```

- **2 decision points** for Challenger (real case had dozens of decisions
  over years of risk assessment)
- "outcomes" are static narration
- No state to track
- No interaction beyond "pick option"

**Verdict**: Encyclopedia entry. Not a game.

## What "depth" should mean for THIS project

A scenario that delivers cognitive impact on Dörner's lessons needs:

1. **Multi-turn structure** (8-15 turns minimum) where player makes
   1-3 decisions per turn
2. **State with cascading variables** (not just resources/satisfaction
   but 6-10 interconnected metrics)
3. **Time delays** — decision effects appear in turn 5, not turn 1
4. **Multi-stakeholder conflicts** — actions have different effects on
   different groups; optimizing one hurts another
5. **Visible feedback at multiple stages**:
   - Turn 1-2: "the world responded" (vague)
   - Turn 3-4: "but here's what else changed" (cascading)
   - Turn 5+: "look at this pattern in your behavior" (bias reveal)
6. **Real decisions** (not "hire 3 staff") but "approve new supplier
   contract at 15% higher cost for 20% faster delivery OR maintain
   current supplier with risk of stockout in peak season"

## Recommendation

**Do NOT** keep adding shallow scenarios. The project currently has 30
shallow scenarios which is worse than 3 deep ones.

Instead, **invest in depth on ONE scenario first** as the canonical
template. Once the pattern is proven, replicate.

Pick: **"The Challenger Launch Decision"** (uses hist-001) — perfect
Dörner case because:
- Real historical case (engagement)
- Multiple stakeholders (engineers, managers, NASA, public)
- Time delays (years of risk data ignored for one launch date)
- Self-reference (political pressure to maintain schedule)
- Confirmation bias (engineers' concerns dismissed)
- Concrete decisions with cascading effects

Design proposal (next commit):
- 10-turn simulation
- State: o-ring temperature data, engineer confidence, schedule
  pressure, public attention, budget remaining
- Each turn = one decision point from actual Challenger timeline
- Player sees state evolving and must justify tradeoffs
- Feedback at turn 3: "engineer confidence dropped — pattern: dismissed
  concerns despite data"
- Feedback at turn 7: "schedule pressure correlated with risk acceptance"
- Final feedback: reveal the bias chain

## What to do RIGHT NOW

1. ✅ Commit this audit doc (done: 2e3d945)
2. ✅ Design deep scenario content (done: 4fb84c7 — challenger_launch.json)
3. ✅ Register Challenger in BASE_SCENARIOS (done: 77a990c — appears in /scenarios/)
4. ⏸ Backend execute_real_logic for Challenger — DEFERRED (not yet wired)
5. ⏸ Frontend narrative renderer — DEFERRED (5x bigger than backend)
6. ⏸ End-to-end cognitive impact verification — DEFERRED

## Open questions for user

Before continuing implementation, I need to confirm direction:

1. **Is Challenger the right priority?**
   - Challenger is a real historical case, all 5 Dörner lessons fit naturally
   - But it's dated (1986), modern learners may not relate
   - Alternative: design a contemporary scenario (e.g., supply-chain crisis,
     startup scaling decision, climate policy)

2. **Should the 30 shallow scenarios be removed?**
   - Currently they're noise around the one deep scenario
   - User said "shallow ones have no value"
   - But removing content is destructive; may break user expectations

3. **Front-end investment is the real blocker**
   - Backend work is ~80 lines (manageable)
   - Frontend narrative renderer + option picker + state visualizer is
     ~300-500 lines (substantial UX work)
   - Should I scope it as "minimum viable Challenger UI" (basic text +
     4 buttons) or invest in proper state visualization?

The audit and Challenger design are committed. The next commit depends
on user direction.
