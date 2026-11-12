# dsh-panel-titlebar

[![CI](https://github.com/githublmk/dsh-panel-titlebar/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/githublmk/dsh-panel-titlebar/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-panel-titlebar?logo=npm&label=npm)](https://www.npmjs.com/package/dsh-panel-titlebar)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-%E2%89%A50.2.1--0-1f6feb.svg)](https://github.com/deepseek-ai/deepseek-harness)

[English](README.md) | 简体中文

把侧边栏的一排全局面板挪到 Windows 应用通常放导航的地方：**标题栏里，“应用 / 编辑”菜单之后**。

![标题栏里的全局面板](docs/titlebar.png)

## 解决的问题

装了若干面板（插件、插件市场、自动化任务、上下文洞察、记忆系统、更多）的 DeepSeek Harness profile，会把每一条都渲染成侧边栏顶部的整行。在笔记本上这就是常驻的**约 240px 纵向空间**，直接从会话列表里扣掉：

<img src="docs/before.png" alt="改造前：侧边栏顶部六行竖排" width="420">

## 改造后

图标、文字、选中态、点击行为全部保留，只是变成与标题栏菜单同规格的紧凑条目横排在标题栏里；侧边栏直接从品牌行、新会话按钮和工作区列表开始：

<img src="docs/sidebar.png" alt="改造后：侧边栏直接从品牌行和会话列表开始" width="420">

输入框下方那排会话统计（轮/步数、解码速度、token 总量、缓存命中、上下文占用）也一并上移，落到视图标签行里「…」按钮的右侧。

## 实现方式

- 导航仍然是侧边栏插件自己的 `sidebar.panellist` 注册，不复制、不包裹、不替换、不删除任何条目——所以「更多」入口、它的固定/取消固定菜单、当前面板高亮、官方条目埋点全部原样保留。
- 只有一份样式表把那个已有的 `nav` 从侧边栏的流里取出（`position: fixed`），改成横排在标题栏带内。行规格对齐标题栏菜单：高 28px、字号 14px、圆角 6px、次要文字色，hover 与选中态取自主题变量。
- 样式表全部限定在 `html[data-windows-titlebar]` 下——这个标记只有 Desktop 的 preload 会写，**纯 Web 版界面保持原来的竖排不动**。
- Harness `0.2.2` 把每个面板条目包进一个 `panelEntry`（「更多」入口保持自己的 `moreAnchor` 包裹层；新增的行内「取消固定」按钮挂在条目包裹层上），并把 `nav` 移进侧边栏的滚动容器：所以行标记改成任意深度匹配，包裹层作为标题栏里的 flex 项，紧凑规格落在真正的按钮行上。行内的「取消固定」按钮在标题栏里隐藏——菜单栏没有 hover 槽位，而且从那里取消固定会让指针下的条目当场消失；固定/取消固定仍然由「更多」菜单负责。
- `0.2.2` 还把侧边栏的滚动容器与其区域变成查询容器（`container-type: size` / `scroll-state`），而查询容器同时也是固定后代的包含块。样式表在标记生效期间撤回这层 contain，理由与下面为统计上移撤回输入框座位的 `will-change` 相同。撤回后唯一失去的消费方是工作区列表「能整体滚动时隐藏自身滚动条」的那条查询。
- 左边距是**测量出来的**，不是写死的：插件读取 preload 注入的 `[data-windows-menu]` 右边缘写入 `--dsh-panel-titlebar-left` 并保持更新，因此侧栏收起（菜单起点 48px → 84px）、切换语言、缩放窗口都不会错位。
- 条目是**开关式**的：再次点击当前已选中的条目会回到会话（`layout.selectPanel(null)`，与面板自带的“返回会话”同一去处），而不是把已经打开的面板再选一遍。这次点击会在原生处理器之前被拦下；「更多」入口不是面板条目，仍然照常打开它的菜单。选中行按原生的 `aria-current="page"` 标记识别，因此有没有 `0.2.2` 的包裹层都能生效。
- 统计条目仍然由 `conversation.composer.dock` 自己的注册渲染，弹层与数值更新都不变，只是**换了个座位**：停靠条按视图标签行「…」按钮的位置（`--dsh-statbar-top` / `--dsh-statbar-left`）定位并垂直居中。一旦找不到锚点（没有会话、在面板页、布局收起等），插件会移除 `data-dsh-statbar`，停靠条自动回到输入框下方原位。
- 上移用的是 `position: fixed`，前提是这块固定盒相对**视口**解析。Harness `0.2.2` 给粘性输入框座位加了 `will-change: transform`（把它提成合成层），而这同时让该座位成为固定后代的包含块；插件在标记生效期间撤回这条提示，并在每次测量时核对停靠条是否真的落在锚点上。若将来某个版本用真实的 `transform` / `contain` 再次捕获固定盒，连续三次核对失败后插件会放弃上移，统计回到输入框下方，而不是压在输入框上。

## 环境要求

- **DeepSeek Harness Desktop**（Windows）——标题栏带只存在于桌面端；纯 Web 版没有这条带子，插件按设计不生效。
- Harness `>= 0.2.1-0`（带 `sidebar.panellist` 行与「更多」入口的侧边栏）。
- 面板条目本身来自 profile 里安装的其他插件，本插件不创建任何面板。

## 安装

通过 Plugin Manager 指向本仓库目录：

```text
plugin_manager install_bundle
  target: <本仓库的绝对路径>
```

管理器会写入 profile 依赖、选中该 bundle 并挂载对应行。无需重启应用即可生效；若面板行没有立刻出现，刷新一次页面即可。

发布到 npm 之后，同一个调用可以直接用包名代替路径：

```text
plugin_manager install_bundle
  target: dsh-panel-titlebar@0.2.0
```

手工等价做法——在 profile 里加入对本目录的依赖，并在 profile 补丁中插入一行：

```yaml
# cordis.patch.yml
- insert:
    - id: panel-titlebar
      name: dsh-panel-titlebar
```

## 卸载

在 Plugin Manager 中卸载 `dsh-panel-titlebar` bundle（或禁用 `panel-titlebar` 行）即可，侧边栏立刻恢复原本的竖排列表，不影响其他插件。

## 自定义

| 想要的效果 | 改法 |
| --- | --- |
| 离菜单更远一点 | 在 `:root` 上覆盖 `--dsh-panel-titlebar-left`（默认是测量出的菜单右边缘 + 10px） |
| 统计离标签更远一点 | 在 `:root` 上覆盖 `--dsh-statbar-left`（默认是测量出的「…」右边缘 + 18px） |
| 更紧凑的行 | 去掉行规则里的 `padding` / `font-size`，即回落到原生行规格（32px，另加侧边栏的 38px 取消固定槽位） |
| 面板与菜单之间加一点间隔 | 给第一行加 `margin-left`，例如 `nav:has([class*="panelRow"]) > *:first-child` |

这些全在 [`client.js`](client.js) 的 `CSS` 常量里，没有构建步骤。

## 兼容性与已知限制

- 规则依赖侧边栏的 CSS Modules 类名后缀（`panelRow`、`panelEntry`、`panelUnpin`、`panelTitle`、`panelGlyph`）以及承载面板行的 `nav`。行标记按任意深度匹配，因此 `0.2.1` 的直排列表与 `0.2.2` 的 `panelEntry` 包裹层都能识别；若未来某个 Harness 版本重写侧边栏，本插件可能需要同步更新。客户端模块因此声明在 `@deepseek-ai/dsh-client-ui-sidebar` 之后加载。
- 标题栏条目的开关行为依赖原生选中标记 `aria-current="page"`（挂在行按钮上），而不是已移除的 `panelActive` 类名。
- 撤回滚动容器的 contain 会一并失去工作区列表用来「能整体滚动时隐藏自身滚动条」的 `scroll-state` 查询。在上移后的布局里这只影响一条内层滚动条，不影响标题栏条目。
- 标题栏带高 40px 且不换行：窗口很窄时，末尾条目会省略并最终被裁掉，而不会挤走窗口控制按钮。
- 侧边栏收起时 `0.2.2` 不再渲染条目的标签元素，因此标题栏条目在该状态下只有图标加 tooltip；原生 rail 会把列表整体隐藏，插件用 `display: flex !important` 让它继续显示。
- 「更多」弹层沿用原生锚定（打开时按触发按钮的位置测量）。
- 统计上移依赖视图标签行暴露的「…」按钮（`button.viewsMore*`）或 `viewTabs` 容器，并假定 `[data-composer-dock]` 里只有环境类统计条目。若某个 profile 往这个停靠条里塞了别的常驻面板，它会被一并带上去；找不到锚点时停靠条留在原位。
- 搬动停靠条依赖它的 `position: fixed` 相对视口解析。Harness `0.2.2` 用 `will-change: transform` 提升了输入框座位（对固定后代是包含块），样式表在停靠条上移期间撤回这条提示——代价是统计在标签行上时，该座位不单独合成。若将来某个版本用真实的 `transform` / `contain` 捕获固定盒，落位核对会在三次之后撤掉标记，统计回到输入框下方而不是压在输入框上。
- 已对照 `0.2.2` 的实际侧边栏 bundle 核对（包裹层、取消固定槽位、滚动容器 contain），并在 Windows 11 + DSH Desktop（harness `0.2.1-rc.5`，150% 缩放）验证过放置位置、在线安装与侧边栏空间回收。hover、「更多」弹层与标题栏拖拽区复用原生组件，为手动验证；CI 只覆盖静态契约。

## 开发

```text
client.js            浏览器侧：作用域样式表 + 标题栏对齐
index.js             宿主侧：空实现（全部逻辑在浏览器）
cordis.patch.yml     profile 加载时插入的 bundle 行
locale/en.json       Plugin Manager 中的英文标题与描述
locale/zh.json       Plugin Manager 中的中文标题与描述
icon.svg             插件清单使用的图标
test/bundle.test.mjs 静态契约测试（清单、补丁、语言资源、样式作用域）
```

```bash
npm run check      # 对两个模块做 node --check
npm test           # node --test test/
npm run pack:check # 本仓库会发布的 npm 内容
```

无依赖、无构建工具：浏览器模块是纯 ESM，由 Harness 的客户端模块加载器直接消费。

## 许可证

[MIT](LICENSE) © 2026 githublmk
