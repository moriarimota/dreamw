# v0.6公开美术生成记录

工具：内置image_gen.imagegen；2026-09-30。延续已公开courtyard-v1、witch-walk-v1的暖色手绘像素风，以原画黑色星月帽、红斗篷、棕色双辫与眼镜为角色锚点。原始用户图片不放进发布包。以下保留本轮生成约束与最终可复用提示集；生成结果需要人工查看和运行时切帧，不能直接视为严格像素动画表。

## village-props-v1.png

Create a transparent RGBA sprite atlas for a cozy top-down 2D witch village. Keep the existing warm hand-painted pixel-cartoon palette: forest olive greens, ochre paths, muted brick red, warm cream windows. Eight independent objects on a 4-column by 2-row grid: cottage with red roof and a clear front door; little seed shop; plant spirit neighbor cottage; round oak tree; drooping willow; wooden bench; low shrub; small lantern post. Complete silhouettes and empty padding around every object, consistent three-quarter top-down view, no text, no ground rectangles, no cast background, no UI. Buildings and tree canopies must be separable and suitable for depth sorting.

输出1536×1024，已检查透明通道与内容边界。生成布局的第二行从y=550裁切，按对象内容边界确定帧；碰撞使用世界中的脚底矩形，与完整树冠分离。

## witch-directions-v1.png

Create a transparent sprite sheet of the same little witch with broad black pointed hat, hanging gold crescent and stars, red bow, brown twin braids, round glasses, plain warm red cape, brown boots. Retain the cozy hand-drawn pixel-cartoon appearance and simplify tiny details. Three walking frames in each of four directional rows: facing front, left, right, back. Full body, identical scale, equal grid cells, feet aligned, clear alternating steps, no Christmas motifs, no labels, no floor, no extra characters.

输出1254×1254，3列×4行。实际生成左右行与描述相反；渲染按正面、右、左、背面解释，逐格扫描alpha边界与脚底对齐。每方向三帧，不是16方向或骨骼动画。

## cottage-map-v1.png

Paint a cozy 4:3 top-down witch cottage interior suitable for a walkable RPG map. Match the muted hand-painted pixel illustration style. Show a broad unobstructed wooden floor, walls and furnishings toward the edges, books and reading chair on the upper left, warm cooking corner on the upper right, desk on the right, bed on the left, little game table near the lower right, display shelf and plants near the back, a clear exit centered at the bottom. No characters, no text, no UI, no perspective horizon. Warm cream light and ochre wood, moss green and red accents, readable simple silhouettes.

按1024×768世界坐标显示；家具外围阻挡与门口位置由village.js定义，画面不会自行决定导航。

## village-actions-v1.png

Generate a transparent 4-column by 2-row atlas in the same warm hand-painted pixel-cartoon style. Cells in reading order: the red-caped witch sitting reading a small open book; witch enjoying a cup of tea; witch seated fishing with a simple rod; witch watering with a can; witch writing notes; witch resting peacefully; a friendly little moss-green plant spirit with leafy hair and a satchel; a small chestnut fox shopkeeper with a simple apron. Keep full silhouettes, large clear gaps, equal scale, transparent background, no scene panels or labels. The witch retains her crescent-and-star black hat, glasses, braids and red cape; no Christmas decoration.

输出1536×1024，4×2。原生成钓鱼格边缘出现装饰鱼；实际帧边界剔除该区域，浇水格左边相应留白，避免尚未钓到鱼却展示虚假渔获。NPC为独立立绘配轻微行走摆动，尚非完整方向动画。

## 发布与使用

四张PNG只作为公开游戏资产，和Phaser模块一起由明确发布清单拷贝。运行时按照alpha边界生成纹理帧，移动/动作由世界activity与journey选取；不在画面中杜撰完成品或NPC记忆。手机窄屏与桌面宽屏均需检查比例、脚底、遮挡及按钮可用性。
