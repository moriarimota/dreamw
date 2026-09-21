# 开发、测试与下一次更新

## 修改流程

读索引、当前状态和相关章节；在想法库登记新需求。改规则找life.js，改输入/面板找app.js，改画面找Canvas和style.css，改持久化找storage.js与desktop/Launcher.cs，改棋局找gomoku.js。不要因为新想法就整体重写。

版本改变后更新STATUS、CHANGELOG和必要的ADR。存档字段修改要补迁移测试，旧档损坏时保留文件，不得静默新建覆盖。

## 检查

- JS语法：Node `--check game/app.js` 等。
- 世界：Node运行 `tests/life-tests.js`，测试包含离线与连续结算等价、恢复读书进度、因果前提、提案校验。
- 棋局：`tests/gomoku-tests.html` 包含纯引擎断言与DOM生命周期检查。
- 路线：`game/tests.html`。
- 桌面：`desktop/README.md` 与smoke测试；不要用真实user-data做破坏性测试。
- 集成：浏览器新测试来源中提交一颗梦种，确认研究/制作/成长及可见物品；下棋后关闭重开恢复；刷新检查存档；手机尺寸查看面板。

开发用Node可以使用本机已有安装；玩家不需要它。源码无构建步骤。桌面用 `desktop/build.ps1` 编译，发布使用 `tools/package.ps1` 明确清单打包。

## 发布边界

只允许 game 运行文件进入网页产物。排除真实存档、浏览器资料、日志、tests、旧试样、原始参考画、临时fixture、凭据。上线后需真机验证iPhone Safari、缓存更新和导入导出。

不要在没有发布回执时声称网页已上线。若尚无仓库/授权，交付可上传的网页包并明确最后缺少的操作。
