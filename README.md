# 梦乡 · 口袋生活 Demo v0.7.1

一个魔女在另一个世界生活，你在人间的日常可以成为她世界里的梦种。你有空时随时加入，忙的时候，她继续自己的计划。

**项目主目录：D:/WitchLife。** 游戏名和角色名仍可由制作人调整。

## 开始玩

手机/网页入口：[梦乡](https://moriarimota.github.io/dreamw/)。在iPhone上用Safari打开，可通过分享菜单添加到主屏幕。电脑关机仍可访问；跨设备进度通过导出、导入存档转移。

源代码与文档：[moriarimota/dreamw](https://github.com/moriarimota/dreamw)。

双击根目录 `启动梦乡.exe`。无需安装Python、Node或游戏引擎。启动器使用Windows现有的Edge/Chrome打开独立游戏窗口；托盘菜单可重新打开或退出。若没有可用的独立窗口浏览器，会提示回退行为。

1. 点击地面行走，点击物件走近后互动；电脑也支持WASD/方向键。“地图”可以去田边、钓台、商店或找苔米与阿栗，跟随/全景/远近控制镜头。
2. “一起待会儿→玩会儿游戏”有八种选择；“她的兴趣手册”能查看六项三步小计划，加入她的生活。
2. “留颗梦种”记录一小段日常或梦，查看她的想法，再决定是否一起做。
3. 梦种研究/制作在Demo中各约45秒；植物还会长大、引来便笺。
4. “小小收藏”查看原文、实体物品、共同经历和学到的知识。
5. 顶部“为什么在做这件事”查看行为原因；☼里导出/导入存档。

这版保留暖色手绘像素风，使用四方向步行和真实路线；小屋、街道、桥与田地连成同一段生活。日常持续几十分钟至数小时，不再几秒换一个动作。双击启动程序只负责打开游戏，世界仍按保存的时间规则推进。

## 存档与设备

桌面存档：`user-data/state.json`，上一份：`user-data/state.previous.json`。专用浏览器资料也在user-data里。复制游戏文件夹时保留这个目录；发布代码时必须排除。

网页使用同一份game文件，支持本地存档和缓存。跨设备目前用导出JSON→另一设备导入，不是自动云同步。EXE是Windows入口；iPhone使用网页，不运行EXE。网页发布情况见 docs/STATUS.md。

## 技术栈与目录

```text
WitchLife/
  启动梦乡.exe   Windows便携启动入口
  game/                HTML/CSS/JavaScript + Phaser 3.90.0（WebGL/Canvas）
    village.js         世界坐标、障碍寻路、行程与居民日程
    village-view.js    Phaser地图、相机、遮挡、角色动作和输入
    village.css        全窗口地图与手机面板
    vendor/            随包提供的Phaser与MIT许可
    life.js            时间、行为决策、因果、记忆、梦种规则
    hobbies.js         六项持续兴趣、材料与成果
    arcade.js/arcade-plus.js 经典棋盘与多难度、移动/魔法规则
    board-games.js/board-games-ui.js 围棋、象棋、入门教学
    country.js         田地、渔具、钓鱼、商店与物资规则
    companions.js      实例角色、外形/图片/AI设定校验
    expedition-ui.js   河畔与角色创建界面
    arcade-ui.js        消除游戏界面与关卡衔接
    tokens.js          内置棋盘小图标
    games.js/games-ui.js 数独、拼图、记忆牌规则与界面
    scenes.js          旧场景兼容绘制与数据
    app.js             场景与交互、梦种/收藏/解释面板
    storage.js         浏览器/桌面持久化、导出导入
    gomoku.js          五子棋规则、局部AI、可续棋局
    navigation.js      地板寻路、家具阻挡
    assets/            背景、精灵动作、梦种物品图
    sw.js              静态资源离线缓存
  desktop/             C#/.NET Framework启动器源码和测试
  docs/                长期设计与开发知识库
  design/              已保存的角色、美术与早期方案
  tests/               世界/棋局/存档回归检查
  tools/               发布包制作
  releases/            可分发包，不提交私人资料
  user-data/           玩家自己的日子，不提交GitHub
  archive/             早期版本档案（不再开发）
  AGENTS.md            后续Agent的阅读入口与开发规则
```

从 [知识库索引](docs/00-INDEX.md) 进入文档；从 [当前状态](docs/STATUS.md) 区分已做功能与未来愿景。

## AI的当前方式

默认是本地、有限的素材组合规则，没有自动联网AI。可在梦种方案中选择“用我的ChatGPT”：先查看材料，自己复制到ChatGPT，再粘回JSON提案。游戏只接受受限字段，不能让提案直接改事实、跳过知识或执行代码。

ChatGPT会员与API独立计费：[官方说明](https://help.openai.com/en/articles/9039756-managing-billing-settings-on-chatgpt-web-and-platform)。本版不要求额外API账户或密钥。

## 开发

世界规则独立于渲染；引入新行为时先写前提、影响和记忆，再做画面。详见 [开发流程](docs/development/01-workflow.md) 与 [AGENTS.md](AGENTS.md)。没有npm构建步骤，Node仅用于开发检查。Windows启动器用系统.NET Framework C#编译器构建。

从GitHub下载的源码不含编译后的EXE。源码使用者可按 desktop/README.md 构建；本机D盘与便携包已经带有启动程序。

## 历史版本：小院与游戏桌

“一起待会儿→玩会儿游戏”：五子棋、数独、照片交换拼图、星月记忆牌。“小院”或场景小金点：采集、做茶点、野餐、看鸟、观星。页首时钟跟随设备，天气为游戏天气。详细规则在 docs/design/04-courtyard-and-games.md。

新增模块：game/games.js（纯小游戏规则）、games-ui.js（界面）、scenes.js（场景与天气绘制），对应 games.css/scenes.css。小游戏、摆放与材料随存档保存，旧v2存档自动迁移。


## v0.4：兴趣手册与消除游戏

连连看36关（石头、留白、外围绕路、提示和续玩），消消乐20关（交换、连消、加步、收集目标）。六项兴趣分别是香草香包、鸟声手帐、压花小册、纸星灯、留给你的明信片、浆果酱。每项三步，材料和半成品会留在存档，成品能在手册和工作桌旁看到。

v0.4的共同角色模板在v0.5改为新玩家自行创建；旧档继续保留小罗。没有联机或账号，仍可导出导入。


## v0.5：河畔、棋盘学校与自己的伙伴

连连看增加普通/困难/挑战及中心收拢、四角散开、落下、轮转等五规则；消消乐增加融霜、潮汐、直线魔法与彩星。游戏盒新增围棋教学、提子练习、九路棋盘和象棋入门陪练。各游戏均能收起续玩。

点“河畔”：六块田种四种作物，去商店买鱼竿与鱼饵，再到木栈桥钓鱼。收获可出售，香草和浆果也能接着做原有茶点/手作。她会根据资源与时间自主照料、钓鱼和逛店。

新玩家先创建自己的魔法生灵，可上传角色图、导入AI写的角色JSON；名字、配色、性格都保存在自己的世界。已有小罗和旧梦种保留，存档升级v5。详细现行规则与明确限制在[河畔与伙伴设计](docs/design/06-river-and-companions.md)。

## v0.6：沿着小路去看看

小屋出门后可以沿街走到商店、跨桥到田地、找到邻居，镜头跟着她。居民记得见过你、借过哪本书、看过哪些梦种成果。苔米借出的书需要实际读完才可归还并获得一颗种子；农事开始前会先走到田边。打开游戏、途中刷新或暂时离开，都沿用同一份时间与行程事实。

完整范围与边界见[地图设计](docs/design/08-village-v6.md)。新图像提示与切帧说明见[美术记录](design/v6-asset-prompts.md)。

## v0.6.1 体验预览

当前本地代码包含界面、步态和钓鱼调整。当前室外地图与棋盘布局已完成浏览器检查，公网状态以 STATUS 为准。请先读[当前状态](docs/STATUS.md)与[本轮说明](docs/design/09-polish-v61.md)。

## v0.7：口袋生活

新增 `game/pocket-games.js`、`pocket-ui.js`（数织/合成），`postcards.js`（信匣），`offline.js`、`offline-worker.js`、`offline-manifest.js`（离线安装及更新），`details.css`（手机布局）。

当前状态和发布限制以 [STATUS](docs/STATUS.md) 为准；iPhone 操作见 [离线指南](docs/development/05-iphone-offline.md)。规则测试：`tests/v7-tests.js`、`tests/offline-tests.js`；UI 脚本：`tests/v7-ui.html`（2026-10-04：9/9通过，iPhone真机待测）。
