# 那边的小日子 · 梦种 Demo

一个魔女在另一个世界生活，你在人间的日常可以成为她世界里的梦种。你有空时随时加入，忙的时候，她继续自己的计划。

**项目主目录：D:/WitchLife。** 游戏名和角色名仍可由制作人调整。

## 开始玩

手机/网页入口：[那边的小日子](https://moriarimota.github.io/dreamw/)。在iPhone上用Safari打开，可通过分享菜单添加到主屏幕。电脑关机仍可访问；跨设备进度通过导出、导入存档转移。

源代码与文档：[moriarimota/dreamw](https://github.com/moriarimota/dreamw)。

双击根目录 `启动那边的小日子.exe`。无需安装Python、Node或游戏引擎。启动器使用Windows现有的Edge/Chrome打开独立游戏窗口；托盘菜单可重新打开或退出。若没有可用的独立窗口浏览器，会提示回退行为。

1. “一起待会儿”能读她正在读的书、邀请喝茶、开一盘五子棋。
2. “留颗梦种”记录一小段日常或梦，查看她的想法，再决定是否一起做。
3. 梦种研究/制作在Demo中各约45秒；植物还会长大、引来便笺。
4. “小小收藏”查看原文、实体物品、共同经历和学到的知识。
5. 顶部“为什么在做这件事”查看行为原因；☼里导出/导入存档。

这版保留原画风，走路速度较初版约快37%。日常持续几十分钟至数小时，不再几秒换一个动作。双击启动程序只负责打开游戏，世界仍按保存的时间规则推进。

## 存档与设备

桌面存档：`user-data/state.json`，上一份：`user-data/state.previous.json`。专用浏览器资料也在user-data里。复制游戏文件夹时保留这个目录；发布代码时必须排除。

网页使用同一份game文件，支持本地存档和缓存。跨设备目前用导出JSON→另一设备导入，不是自动云同步。EXE是Windows入口；iPhone使用网页，不运行EXE。网页发布情况见 docs/STATUS.md。

## 技术栈与目录

```text
WitchLife/
  启动那边的小日子.exe   Windows便携启动入口
  game/                HTML/CSS/原生JavaScript/Canvas 2D
    life.js            时间、行为决策、因果、记忆、梦种规则
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
