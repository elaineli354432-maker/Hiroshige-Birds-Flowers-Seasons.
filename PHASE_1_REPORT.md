# Phase 1 验收报告

本次仅完成 Phase 1。Phase 2/3 未自动执行。

## 已完成

- 暖米白、墨色、衬线排版、大留白与单幅原作首页。
- 四季代表作入口；季节与主题交叉筛选、结果计数、空结果恢复。
- JSON 驱动的 114 幅画廊，同名版本按独立 ID 保留。
- 双语及日文详情、可用年代与出版者、双语赏析、季节与主题。
- 当前筛选集内前后切换、循环导航、Esc、焦点限制和恢复、背景滚动锁定、放大查看。
- 桌面 3–5 列、手机 2 列、原图 contain、不裁切、lazy loading、固有宽高。
- Download Album、Wallpaper、Share 为明确禁用的“即将开放”占位。
- 静态部署，不运行应用服务器。

## 验证结果

- 114 条记录、114 个独立 ID、114 张图片文件：通过。
- 图片逐一解码及 SHA-256 对照：通过，原图 0 修改。
- 114 个图片 HTTP 请求：全部 200，无空文件。
- 七个主题实际点击：114 / 90 / 67 / 5 / 2 / 7 / 9，均与数据一致。
- 春季 29 幅、冬季雪景 7 幅；春季月亮空集恢复全部：通过。
- 1440px 桌面、375/390/430px 手机、768px 平板：无横向溢出；手机详情可滚动，关闭固定可达，过滤按钮最小高度 44px。
- 图片完整呈现、详情放大还原、前后切换、Esc、返回原作品焦点、Tab 焦点限制：通过。
- 静态交付版本独立 HTTP 服务：筛选及弹窗可用，浏览器未捕获控制台错误。
- WebMCP：filter_artworks 已验证正确注册、有效请求及无效输入拒绝。
- prefers-reduced-motion：样式规则已实现；未切换系统设置实测。
- TypeScript：通过。应用 lint：通过。最终静态 build：退出码 0。

## 蓝图一致性自评：92 / 100

| 项目 | 得分 |
|---|---:|
| 原作优先 | 19 / 20 |
| 博物馆与编辑气质 | 19 / 20 |
| 季节叙事（Phase 1 范围） | 12 / 15 |
| 画廊完整性 | 15 / 15 |
| 动效克制 | 10 / 10 |
| 字体与留白 | 9 / 10 |
| 手机体验 | 8 / 10 |

这是一项主观自评，不替代用户视觉验收。

## 已知偏差与后续项

- 优先执行 MASTER_BRIEF 的原画完整性要求，没有复刻蓝图中扩画、叠图、深色投票区等与当前范围或约束冲突的设计。
- 字体使用本地 Georgia / 宋体回退，未引入远程字体；不同系统字形略有差异。
- 手机首页采取纵向留白构图，完整代表作需要向下滚动查看。
- Phase 2 的连续滚动季节叙事与更细腻过渡尚未实现。
- Phase 3 的实际下载、壁纸、分享与逐作品链接尚未实现。
- npm run lint 全项目检查仍有 19 个来自未修改脚手架组件/钩子的既存问题；本展应用代码的 lint 和类型检查通过。未为消除检查输出修改未使用的第三方组件。
- 安装审计报告共 11 项依赖问题（8 high / 2 moderate / 1 low）；生产依赖树审计为 6 项（5 high / 1 low），包含服务器与构建工具的传递依赖。交付改为纯静态文件，服务器中间产物不部署；开发依赖风险没有宣称已消除。后续升级官方脚手架依赖时应重新审计。
- Windows 下 Vinext 在静态预渲染完成后立即 process.exit 会触发 libuv 关闭断言；加入成功退出自然清理的预加载脚本，错误退出仍保留，最终构建正常退出。

数据与赏析沿用用户提供资料，未重新进行艺术史校勘。
## Phase 1 visual re-audit — 2026-09-08

Reviewed again against MASTER_BRIEF.md, DESIGN_BLUEPRINT.png and ACCEPTANCE_CRITERIA.md. Structure, artwork selection, warm paper palette, typography family and gallery interactions retained. No Phase 2 work started.

### Changes
- Hero horizontal gap reduced from 9% to 6%; artwork aligned toward the copy, with a 32px optical adjustment to the text block. Homepage retains the first Spring work, Bird and Double Cherry (ID 2).
- Desktop seasons retain four columns with 0/32/12/44px vertical offsets, small caption-spacing differences and gentle artwork alignment changes. Mobile retains two columns with smaller 0/20px offsets.
- Active hover/focus stays at opacity 1; other seasons fade to .76. A 1px rule extends from 24% to 88% over 400ms. No scale, bounce or rotation. Keyboard focus takes precedence over hover; pointer-only dimming is restricted to hover-capable fine pointers. Reduced-motion rules remain in force.
- Seasonal margin note is 12px, muted, and aligned over the Winter column on desktop.
- Four bilingual descriptions now share short observational phrasing.

### Verification
- Final static build: exit 0. Application lint: pass.
- Desktop 1440px: four columns, intended offsets and tightened hero relationship visually inspected.
- 375/390/430px: no horizontal overflow; every image uses contain; filter buttons remain at least 44px high. Mobile season layout visually inspected at 390px.
- Keyboard focus: active season 1.0, others .76; rule widths verified; no transforms.
- Summer navigation: 23 works; mobile details open, scroll, and close with Escape. Browser console: no errors captured.
- All 114 records and original JPEGs retained. No image-generation, crop, filters or decorative imagery added.
- Existing Phase 1 gallery/detail/data requirements remain satisfied. Phase 2 scroll storytelling and Phase 3 working downloads remain deferred.

### Visual score: 94 / 100 (subjective)
Art-first 19/20; museum/editorial 19/20; seasonal rhythm 13/15; gallery integrity 15/15; motion restraint 10/10; typography/spacing 9/10; mobile 9/10.

### Cat clarification outstanding
No cat asset, component, persistent pet UI, or cat overlay was found in the website source or rendered page. A clarification was requested about whether this refers to a Codex desktop pet. No cat was invented or added to the page, and no desktop setting was changed. Converting the referenced cat to an Easter egg remains unresolved until its source is identified; this is separate from the visual score above.

The earlier recorded scaffold lint and development-dependency audit limitations still apply. No remote publication was attempted in this refinement pass.
