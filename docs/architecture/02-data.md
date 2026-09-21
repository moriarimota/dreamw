# 状态与存档

存档版本 `version:2`。以 `game/life.js` 的 validate 为最终可执行约束；本文给语义索引。

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
