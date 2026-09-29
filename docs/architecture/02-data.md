# 状态与存档

当前存档版本 `version:4`（接收v2/v3/v4）。以 `game/life.js` 的 validate 为最终可执行约束；本文给语义索引。

| 字段 | 意义 |
| --- | --- |
| serial/rng/createdAt/lastAdvancedAt | 稳定ID、可复现随机、创建时间与结算游标 |
| activity/queue/paused | 当前活动、接下来打算与暂停栈 |
| world | 天气、精力、日期/时间更新状态 |
| books | 已读次数与读完时间；文本定义在引擎中 |
| fragments | 梦种原文、标签、方案、状态和关联ID |
| creations/plants/discoveries | 实体物件、植物生长、发现便笺 |
| events/memories/knowledge | 因果事件、精选经历、长期知识 |
| preferences | 暂用名字与性格倾向 |
| position | 画面位置；不决定活动的事实 |
| board | 完整五子棋状态，含落子历史与轮次 |

本地网页保存在当前来源的 localStorage；桌面版同时经本机接口保存到 `user-data/state.json`，`state.previous.json` 保存上一份。用户可以导出JSON，在其他设备导入；没有自动云同步。页面域名/端口变化会影响浏览器存档，迁移须使用导出导入或磁盘档案。

导入必须检查：版本、长度、枚举、有限数值、引用关系、重复产物、活动前提与棋局合法性。个人梦种内容使用 textContent 渲染，不能作为代码执行。网页发布包不包含 user-data。

Demo上限：240颗梦种、120件物品、近期80条精选记忆、160条因果事件；长期大世界需进一步设计归档与数据库迁移，不能声称无限记忆。当前先确保已有物件与原文不会因普通离线而丢失。

## v3 迁移（2026-09-21）

外层 `version` 从2升至3；存储键仍为 `witchlife-world-v2`，不能换键导致旧档失联。校验器接收v2/v3，旧档保留梦种、书签、事件、种植、五子棋，再补 `home`、`playbox` 与 `preferences.utcOffsetMinutes`。浏览器首次迁移保存 `witchlife-world-v2-before-v3`，后续不覆盖此备份；桌面保存仍保留上一份磁盘文件。

`home`：pantry.herbs/berries/snacks（0–24），comfort（0–100），lamp，displayMode，birdWater（0–3），birdVisits，counts。`playbox`：sudoku/puzzle/pairs，每类最多一局，含稳定局号与celebrated标记。数独导入验证唯一解和给定不可改；拼片检查完整排列；翻牌检查每个图案两张和配对一致。

活动扩充 `material`（herbs/berries），place 可为 gardenPath/gardenBench。开始时取用的材料已经反映在home中，恢复暂停活动不再调用start；来源、决策和计时继续沿用现有字段。对话、输入仍使用textContent。


## v4迁移（2026-09-29）

仍使用 `witchlife-world-v2`。v2/v3加载时保存 `witchlife-world-v2-before-v4` 一次，已有before-v3备份不删除。正常validate补hobbies、arcadeProgress和playbox.link/match3，保留其他数据。

- hobbies.focus：项目ID或null；projects为六个固定项目，每项stage 0–2、editions、paid、startedAt/completedAt、context、sourceIds、steps。每步完成写入一个活动ID；步骤数必须与stage一致，同一兴趣不能同时存在两个活动。paid避免暂停恢复重复扣资源。
- hobbies.works：最近36件，含id/project/edition/name/kind/text/at/sourceIds/steps；引用的梦种必须存在。完成总数在projects.editions持续累计。
- activity.projectStage/projectEdition：保证正在进行的步骤匹配项目进度，不能导入一个错位的旧步骤重复发奖励。
- arcadeProgress.link：36个0–3星最佳成绩；match3：20个最好过关分数。不是锁关系统。
- playbox.link：局号、level、cols/rows、board、moves、helps、rng、celebrated。验证地图形状、每个剩余图案偶数、消除数与剩余数守恒。
- playbox.match3：局号、level、board、movesLeft、turns、score、collected、helps、rng、celebrated。只保存结算完成的无三连棋盘，检验长度、取值、步数上界和最低得分一致性。

导入后的决策kind也保留，以便状态往返等价。手作、关卡与梦种均通过原有导出/导入跨设备转移，没有新增远程上传。
