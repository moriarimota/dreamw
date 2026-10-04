# 状态与存档

当前存档版本 `version:6`（接收v2/v3/v4/v5/v6）。以 `game/life.js` 的 validate 为最终可执行约束；本文给语义索引。

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
| position | 旧版兼容画面位置；v6镜头与行程不写入此字段 |
| village | 区域坐标、旅途时间、居民关系与显示设置 |
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


## v5 迁移（2026-09-29）

外层version=5，接受2/3/4/5，键仍为witchlife-world-v2；首次升级另存witchlife-world-v2-before-v5。旧版本忽略新avatar字段并使用original，防止版本伪装改变初始绑定。其他原有规则、引用校验继续保留。

- avatar：kind=unbound/original/creature/portrait，form、body/accent十六进制、bio≤400、portrait≤650000字符的PNG/JPEG/WebP data URL；拒绝外链/SVG。界面上传最多8MB并缩至320像素。
- country：coins、rod、bait、四作物种子、背包、五鱼种库存和累计图鉴、6个plots、harvests/casts/visits、session。一竿有距离、张力、动作数、随机状态、咬钩时间、阶段及结算标记。
- plot：crop/sownAt/lastAt/workMs/waterUntil。成熟度上限按具体作物，保存到最后结算时刻。无离线枯萎。
- activity.gardenJob/ fishSpecies：保存开工计划与鱼种，导入严格枚举。原暂停栈保留这些字段。
- learning.go：0–6页教学进度。playbox.go/xiangqi保存合法着手历史；回放重建棋盘、轮次、胜负，导入不信任可伪造的棋子数组。
- go附加连续停手、续弈标记、死子列表、计分确认；xiangqi采用三次同局面和棋。每盘最多400着，回放限制避免无限数据。
- playbox.link的mode/flow与对应尺寸/地形守恒；playbox.match3的mode/specials/frost/gravity。arcadeProgress.linkVariants与matchVariants按模式分别记成绩，旧link/match3数组原样保留。

图片跟随导出JSON跨设备带走，仍没有自动同步或服务器保存。地图美术为公开运行资产，玩家立绘不进发布包。

## v6迁移（2026-09-30）

键保持witchlife-world-v2；升级前保存before-v6备份。旧档按当前活动所在位置补village，保留活动ID、阅读与其他内容，不凭空增加已经走过的经历。

- village.version=1；location为area/x/y，area仅inside/village；journey可为空，或包含points、startedAt、endsAt、purpose。坐标必须在可走地面；每段检查障碍，跨区域只能经门口；purpose关联当前活动ID。
- contacts.moss/chestnut：met、talks、borrowed、returned、readBefore、seen。借还书奖励限一次；seen引用已有creations，保存因果来源。
- sound默认false，zoom为视图设置。相机的像素位置不入档。
- activity.kind=walk时可含destination；连续指路沿用同一活动，不堆积paused。startedAt是抵达后的开工时间；在途中可晚于lastAdvancedAt，进度和体力计算必须钳制到零。

NPC当前位置从时间和日程推导；发现事实只有createdAt不晚于当前日程段才影响该段，防止后来事件改写过去路线。基础保存仍无远程服务。

## v0.7 可选字段（世界 schema 保持 6）

`playbox.nonogram` / `playbox.merge` 缺省为 null。数织从 seed/size 重建题面并核验 fixed cells 和撤销记录；合成从 seed/moves 重播，棋盘或分数不符时拒绝。

明信片手作可有 `letter: {from,heading,body,theme,sourceQuote}` 和 `read`。旧明信片不补编信文。letter 文字长度受限，DOM 使用 textContent；postcard sourceIds 与三个步骤 ID 保持原结构。其他手作不添加 read 字段，确保正常存档往返稳定。

## v7 世界迁移（内容版本v0.8）

外层version=7，旧存储键不变，storage首次升级保留before-v7备份。country.version=2：plots总12、unlocked初6，40种seeds/bag/harvested、24种fish/caught/best、farmingXp/fishingXp、hemisphere、fishingPlace、jobs/lastJobAt。缺少旧图鉴字段补0，不推测不存在的收获。旧6块田按原次序迁移。

kitchen保存40种meals/cooked、eaten、12位居民jobDone/jobAt。activity.recipeId/portions与jobId经枚举和整数校验，暂停栈一起保留；食材已在start扣除，resume不能重扣。books补齐至30，原ID和读书次数保持。village.version=2补12居民contacts与forest区域，不改已有角色。

playbox新增festival-games的12个独立槽，保存kind/seed/level/moves及规范状态；导入重放并比较所有字段，限制4000个动作、横版18000帧。拼图接受13个图ID和3–6边长。

postcard draft/letter记录sourceType、sourceAt、sourceFact或sourceQuote、theme、variant；生活来源为真实事件id，当前事件仍在时校验一致，历史滚出容量后保留来源快照。项目完工清除草稿与临时来源，成品保留完整引用。
