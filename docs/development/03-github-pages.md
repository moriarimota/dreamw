# GitHub与手机网页

账号：moriarimota（连接已确认）。建议独立仓库：witchlife。现有其他仓库不是本游戏的发布目标。

GitHub仓库存源码，GitHub Pages发布静态页面。它不会自动保存每个玩家的私密存档，也不能直接替代AI后端。参考：[GitHub Pages官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。

## 当前交付方式

`tools/package.ps1` 制作可分发包，用户资料不会进入包。网页运行文件是game目录中明确列出的HTML/CSS/JS/PNG/manifest/svg/.nojekyll。EXE用于Windows，本地存档文件不能随网页公开。

当前GitHub连接能访问和写入已有仓库，但未提供创建仓库/启用Pages的操作。尚未创建本游戏仓库，也没有声称已经上线。新建独立仓库后，可提交代码与 `.github/workflows/pages.yml`，到仓库 Settings → Pages 将 Source 设为GitHub Actions，工作流只部署game静态产物。

## 手机继续玩

发布成功后，在iPhone Safari打开实际Pages地址；可添加到主屏幕。先在电脑设置里导出存档，手机导入同一JSON。此版没有双向自动合并；在两台设备分开玩会分成两份进度，切换前导出最新那份。

改域名/仓库路径前保留备份。第一次加载需要联网，之后的资源缓存须在iPhone真机验证。桌面EXE与网页都不依赖C盘开发路径。
