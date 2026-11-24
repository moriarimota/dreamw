# 梦乡 AI 连接助手

个人使用的可选服务。主游戏、库存、事件与存档仍由本地规则管理。GitHub Pages 只托管游戏；模型密钥不会进入前端。没有模型密钥也能继续离线生活。

## 电脑使用

安装 Node.js 22 或以上版本。在项目根目录双击 **启动AI助手.cmd**，输入 DeepSeek 官方 API Key（输入隐藏）。默认模型 `deepseek-flash`，可在配置时更换；根据 [DeepSeek 官方接口文档](https://api-docs.deepseek.com/) 核对可用模型。

助手显示 `http://127.0.0.1:18768` 和随机访问口令，在游戏“存档与设置 → AI 连接”填入。模型密钥与口令通过 Windows DPAPI 加密存于 `user-data/ai-connection.json`，绑定当前 Windows 用户。不要复制密钥到游戏、聊天、Git 或截图。更换配置：运行 `启动AI助手.cmd -Configure`。关闭助手窗口会停止服务；打开游戏本身不自动调用模型。

网页只记住服务地址，访问口令在本次页面生命周期内保留。检查连接只验证助手；第一次真正聊天才会验证 DeepSeek 密钥和余额。调用前可预览材料；没有勾选同意时不能发送。

## 手机使用：Cloudflare Workers

部署代码在 `server/cloudflare`，使用 Free 方案支持的 SQLite Durable Object 记录每天的计数与去重哈希。官方：[免费额度](https://developers.cloudflare.com/durable-objects/platform/pricing/)、[加密 Secret](https://developers.cloudflare.com/workers/configuration/secrets/)。免费档超额停止服务；DeepSeek API 费用单独计算。域名可使用分配的 `workers.dev` HTTPS 地址，实际手机网络可达性须现场验证。

1. 准备自己的 Cloudflare 账号，无需开通付费套餐。
2. 双击项目根目录 **部署手机AI.cmd**。浏览器会要求你登录并授权 Wrangler；由你完成账号注册、条款确认与授权。
3. 在助手窗口输入 DeepSeek Key。脚本先部署默认拒绝访问的接口，再把密钥和随机口令写入你自己 Cloudflare Worker 的 Secret。脚本不保存 DeepSeek Key 的本地明文文件。
4. 将完成窗口显示的 HTTPS 地址和访问口令填入手机游戏。它们也会以地址 + DPAPI 加密口令保存在本机 `user-data/ai-online.json`。重新运行此助手会轮换口令；其他设备需更新。
5. 测试“检查连接”和一句真实聊天。账号尚未授权或没有配置密钥时，不能宣称手机 AI 已可用。

云端默认允许来源 `https://moriarimota.github.io`，固定 DeepSeek 官方接口；修改站点或模型需编辑 `wrangler.jsonc` 后重新部署。不要把密钥加入其中的 vars。保持单个私人部署、单个访问口令；这不是多人账户服务。撤销访问可在 Cloudflare 删除/更换 DREAMW_ACCESS_TOKEN 或停用 Worker。云端暂不连接本机铛铛，也不提供存档云同步。

## 数据与次数

- 最近40轮对话随**本机游戏存档**导入导出。每次最多发送最近4轮和2轮关键词相关旧对话，角色设定、当前活动、正在读的章节、最多8条白名单经历与已认识居民的近况。原始梦种、图片和完整存档不自动发送。
- 聊天、书中故事、真实世界经历分别标记。模型返回 JSON；只有 `none/tea/read/garden/rest` 建议被识别，而且仍须玩家点击、引擎检查后执行。回复使用 textContent 显示。
- 默认每天80次，按 UTC 零点恢复；失败调用也预留次数，不自动重试。服务端40秒、前端50秒超时，最多2个同时请求。本地日额度写入 `user-data/ai-usage.json`。
- 服务代码不记录聊天正文日志。云端持久存储只保留每日计数、请求编号和哈希（最多两天）；最近回复仅在运行实例内存缓存。实例重启后重复请求被拒绝，避免再次调用模型。模型供应商与云平台本身的数据处理仍适用各自条款。
- 世界不能读取 AI 来修改金币、奖励、关系或梦种原文。AI 的语言仍可能出错，需要实际对话验收；通过模拟接口不代表真实 DeepSeek 质量验收。

## 铛铛本机便笺

游戏“一起待会儿 → 寄张便笺给铛铛”会先展示便笺，点击才送出。它只描述当前公开活动、书名和天气，不调用 AI、不改变奖励。通过带口令的本机助手写入 `user-data/dangdang-outbox.json`，最多20封，24小时过期。

`integrations/dangdang/dreamw_bridge.py` 是铛铛 v3 的可选适配器。桌宠中放置该文件与 `dreamw-link.json`（enabled=true，outbox为上述文件绝对路径），在 V3Pet 初始化时调用 `attach_dreamw(self)`。本次已在制作人本机安装源码接入；需要正常退出、重新打开铛铛才能生效。原源码保留 `.bak`，未读取/修改桌宠的模型配置和成长存档。

适配器每4秒检查一次，桌宠隐藏、聊天忙、行走、弹窗或已有气泡时等待。收到后显示来源明确的气泡，确认编号存入独立 `dreamw-receipts.json`，重启不重播。设 `dreamw-link.json` 的 enabled=false 并重启即可停用。它不执行便笺内容、不扫描桌面、不跨网远程控制。

## 开发验证

`node --test tests/ai-tests.js tests/cloudflare-tests.mjs`、`python tests/dangdang-bridge-tests.py`；云端在 `server/cloudflare` 执行 `npm ci` 和 `npx wrangler deploy --dry-run`。`tests/ai-preview-server.js` 仅用于隔离 UI 模拟，明确标注模拟回复；禁止将它作为真实助手部署。
