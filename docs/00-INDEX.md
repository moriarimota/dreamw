# 游戏设计与开发知识库

制作人：用户。项目名：《梦乡》（2026-09-30确认，历史暂名《那边的小日子》）。知识库作用：下一次新想法沿现有架构生长，不从聊天记录重新开始。

| 要了解什么 | 读哪里 |
| --- | --- |
| 现在能玩什么，哪些还没做 | [STATUS.md](STATUS.md) |
| 游戏愿景、用户确认的设计边界 | [design/01-vision.md](design/01-vision.md) |
| 新脑洞放哪、如何逐步采纳 | [design/02-ideas-inbox.md](design/02-ideas-inbox.md) |
| 时间、状态、记忆、因果和AI分工 | [architecture/01-system.md](architecture/01-system.md) |
| 存档字段与跨设备边界 | [architecture/02-data.md](architecture/02-data.md) |
| 为什么选现在的技术路线 | [architecture/03-decisions.md](architecture/03-decisions.md) |
| 怎么运行、测试、发新版 | [development/01-workflow.md](development/01-workflow.md) |
| v0.7 实测结果与继续工作入口 | [development/06-v7-verification.md](development/06-v7-verification.md) |
| 本轮具体测过什么 | [development/02-verification.md](development/02-verification.md) |
| 手机与GitHub发布 | [development/03-github-pages.md](development/03-github-pages.md) |
| 小院、小游戏与天气现行规则 | [design/04-courtyard-and-games.md](design/04-courtyard-and-games.md) |
| 兴趣计划、连连看、消消乐和朋友独立世界 | [design/05-hobbies-and-arcade.md](design/05-hobbies-and-arcade.md) |
| 河畔、难度变化、棋盘学校与角色创建 | [design/06-river-and-companions.md](design/06-river-and-companions.md) |
| 连通地图、行走手感与居民生活的分析提案 | [design/07-walkable-world-proposal.md](design/07-walkable-world-proposal.md) |
| 连通街区与居民的现行规则 | [design/08-village-v6.md](design/08-village-v6.md) |
| 画面、步态、棋盘与钓鱼体验调整 | [design/09-polish-v61.md](design/09-polish-v61.md) |
| 口袋离线、明信片与两种新游戏 | [design/10-pocket-life-v7.md](design/10-pocket-life-v7.md) |
| iPhone 安装、备份和更新 | [development/05-iphone-offline.md](development/05-iphone-offline.md) |
| 下一批扩充内容 | [design/03-next-version.md](design/03-next-version.md) |
| 每次改变了什么 | [CHANGELOG.md](CHANGELOG.md) |
| 原画、美术提案、生成记录 | `../design/`；其中早期功能设想以本知识库为准 |
| Agent应当遵循什么 | 根目录 [AGENTS.md](../AGENTS.md) |

## 一次迭代的入口

把想法记为 IDEA 编号 → 找受影响模块 → 明确“已决定/提案/暂缓” → 描述一段可玩的前后变化 → 实现及测试 → 更新状态和日志。一个章节已足够解释的内容，不复制到所有文档里。

- [室外地表与手机交付 v0.7.1](design/11-terrain-v71.md)：道路融合、接地阴影、河岸、切片修正与 PWA 边界。
