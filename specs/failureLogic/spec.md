# Feature Specification: Failure Logic 认知陷阱教育互动游戏

**Feature Branch**: `failureLogic`  
**Created**: 2025-11-09  
**Status**: Draft  
**Input**: User description: "认知陷阱平台，帮助用户理解和克服认知偏差的互动游戏"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 体验认知陷阱 (Priority: P1)

用户通过互动游戏体验常见的认知陷阱，如线性思维、时间延迟、确认偏误、指数增长误区等，以便更好地理解自己在复杂决策中的思维局限。

**Why this priority**: 这是核心功能，让用户直接体验认知陷阱是学习的基础。

**Independent Test**: 系统可以运行一个完整的认知陷阱场景（如咖啡店线性思维场景或指数增长误区场景），用户可以进行决策并获得反馈，完整体验一个认知陷阱。

**Acceptance Scenarios**:

1. **Given** 用户访问认知场景页面, **When** 选择一个认知陷阱场景, **Then** 系统显示可交互的游戏界面
2. **Given** 用户参与认知陷阱游戏, **When** 作出决策, **Then** 系统根据真实逻辑计算结果并提供反馈
3. **Given** 用户参与指数增长误区场景, **When** 尝试计算2的200次方或兔子增长问题, **Then** 系统提供关于指数增长误区的反馈
4. **Given** 用户参与复利思维陷阱场景, **When** 进行长期投资决策, **Then** 系统显示复利与线性增长的差异

### User Story 2 - 学习认知科学理论 (Priority: P2)

用户可以通过平台学习认知科学理论，特别是《失败的逻辑》这本书的核心理念，了解各种认知偏差及其影响。

**Why this priority**: 为用户提供理论基础，帮助理解认知陷阱背后的心理学和认知科学原理。

**Independent Test**: 系统可以展示关于认知偏差的详细理论内容，包括各种认知偏差的定义、例子和影响。

**Acceptance Scenarios**:

1. **Given** 用户访问学习页面, **When** 选择学习认知科学理论, **Then** 系统显示相关的理论内容
2. **Given** 用户阅读认知偏差理论, **When** 选择查看具体偏差详情, **Then** 系统显示该偏差的详细解释和现实例子
3. **Given** 用户完成理论学习, **When** 返回场景选择页面, **Then** 系统保存用户的学习进度

### User Story 3 - 追踪学习进度 (Priority: P3)

用户可以追踪自己的学习进度和成就，以便了解自己的认知能力提升。

**Why this priority**: 增强用户参与度，提供学习动力。

**Independent Test**: 系统可以记录用户完成的场景、获得的成就，并以可视化方式展示进度。

**Acceptance Scenarios**:

1. **Given** 用户完成认知陷阱场景, **When** 查看进度, **Then** 系统显示用户的完成情况和成就

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 提供认知陷阱场景供用户体验，包括咖啡店线性思维、恋爱关系时间延迟、投资确认偏误、指数增长误区、复利思维陷阱等场景
- **FR-002**: 系统 MUST 根据真实逻辑处理用户决策并返回结果和反馈
- **FR-003**: 系统 MUST 提供关于认知偏差和《失败的逻辑》的理论知识内容
- **FR-004**: 系统 MUST 记录用户的游戏进度和成就
- **FR-005**: 系统 MUST 提供用户界面，允许用户浏览场景、参与游戏、学习理论
- **FR-006**: 系统 MUST 包含关于指数增长误区的专门场景，帮助用户理解2^200等指数增长概念
- **FR-007**: 系统 MUST 包含关于复利思维误区的场景，帮助用户理解长期复利的力量

### Key Entities *(include if feature involves data)*

- **认知场景**: 包含场景ID、名称、描述、难度、目标认知偏差等属性
- **游戏会话**: 包含会话ID、场景ID、游戏状态、回合数、历史记录等属性
- **用户进度**: 包含用户ID、完成的场景、获得的成就、学习进度等属性

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户可以完成至少一个认知陷阱场景，体验认知偏差的影响
- **SC-002**: 系统成功部署到GitHub Pages前端和GitHub Codespaces后端
- **SC-003**: 用户能够通过MCP Playwright和Edge浏览器访问系统并完成互动体验
- **SC-004**: 用户完成认知陷阱体验后，对相关认知偏差有了更深入的理解