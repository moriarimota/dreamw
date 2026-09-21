# GitHub与手机网页

仓库：[moriarimota/dreamw](https://github.com/moriarimota/dreamw)。2026-09-21由制作人创建，游戏源代码、美术运行素材和设计知识库已提交。Pages Source已设为GitHub Actions。

## 发布方式

`.github/workflows/pages.yml`从main构建，仅将game运行白名单复制到发布目录。首次部署成功（run 35585269815）。正式入口：[那边的小日子](https://moriarimota.github.io/dreamw/)。桌面存档、浏览器资料、原始手绘参考及日志不进入发布包。

GitHub保存代码并提供静态游戏文件；日常由浏览器中的世界规则计算，玩家存档保存在设备中。它不会成为私密云数据库或AI后端。无需为了此版单独购买服务器。

## 手机继续玩

使用Safari打开发布成功后的Pages网址。通过页面菜单的“分享”→“添加到主屏幕”保留入口；若提供“作为网页App打开”，可以启用。首次先联网加载完整资源。原生iOS包未制作。

在电脑游戏☼设置中导出JSON，将文件传到手机后，在手机游戏☼设置中选择存档，核对预览再确认导入。导入替换当前设备进度；没有自动同步或双向合并。两端各自玩会分成两份进度，切换前应导出最新那份。

Safari网页、主屏幕Web App与其他浏览器可能具有不同的存储环境；确定常用入口后再导入存档。改域名、清理网站数据或卸载入口前保留备份。缓存已实现，iPhone真机离线和文件选择仍需试玩验证。

## 可维护交付

`tools/package.ps1`打包Windows便携版；`tools/prepare-release.py`打包纯网页与源码。均使用明确文件清单，排除user-data。

参考：[GitHub发布源说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[Apple主屏幕入口说明](https://support.apple.com/en-nz/guide/iphone/iph42ab2f3a7/ios)。
