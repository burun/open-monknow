# REA 调查记录

日期：2026-10-19。目标：了解本机已安装 MONKNOW 的入口、权限和核心功能范围，为一个独立的本地替代版提供依据。

## 输入与方法

- 工具：[morluto/rea](https://github.com/morluto/rea)，npm `rea-agents@6.7.0`，通过临时 Node `24.15.0` 执行；没有更改用户的全局 Node 或 Codex 配置。
- 输入：本机 Chrome Default 中的 MONKNOW `8.10.18_0` 扩展程序文件，仅静态读取扩展包；未读取用户书签、登录信息或扩展私有存储。
- 命令：`rea analyze-javascript-application <extension-directory> --max-semantic-nodes 2000 --max-semantic-nodes-per-file 700 --analysis-timeout-ms 60000 --format json`。
- 原始报告：`output/rea/monknow-8.10.18.json`，未纳入 Git，也不包含在扩展发行包里。
- Evidence ID：`ev_a5115e1373584a40cfe37fc0599f0d56db728d3eb73d45b86abef097a33507ba`。
- 输入根摘要 SHA-256：`55dcaf3b01af193df6b9a65541d0d037ad494cedb6a5c86b87c9d0161c51993f`。

## 直接观察

Manifest 声明 MV3，新标签入口为 `asset/html/newtab.html`，service worker 为 `asset/js/563.js`。原插件申请 `storage`、`tabs`、`alarms`、`search`，含 MONKNOW 域名访问权限，以及可选的书签和网站权限。

语言包中出现分组、搜索引擎、时钟、待办、壁纸等界面条目，同时存在会员权益和商业推广相关文案。这说明扩展包包含这些功能与付费提示的界面资源，不能单凭字符串证明任一具体用户正在看到某条广告。

官方网站和应用商店的功能介绍也列出搜索、网址、壁纸、天气和待办。本次用户选择先做搜索、分组网址、壁纸、时钟和待办，因此天气和账号服务不在首版范围。

## 分析局限

REA 读取了 20 个相关文件、2,007,850 字节文本；完成 1 个 JavaScript 文件解析，另外 2 个文件跳过，报告 coverage 为 `partial`。`asset/js/457.js` 与 `asset/js/494.js` 触及默认 1024 MiB worker 堆限制。因此没有完整恢复主界面模块图，也没有声称复刻原插件全部内部逻辑。

静态分析未运行原插件，不证明端点的实时调用、广告触发条件、云端接口行为或原数据格式。没有破解会员机制，也没有依赖原服务接口。替代版的数据模型、样式、资源和代码均独立编写；本次参考以入口、功能清单和权限边界为主。

## 实现决策

- 视觉：暖白底、松针绿点缀，固定分组栏，留白中的大时钟；背景可换，主要操作集中在搜索与网址网格。
- 内容：工作区承担核心操作；左侧仅分组；右侧按需显示待办、设置或壁纸；页脚提供两个次要入口。
- 交互：首次短暂淡入、网址悬浮上移、抽屉滑入；尊重系统减少动态效果设置。
- 权限：0.1.0 仅 `storage`，0.1.1 增加 `favicon`；无需后台 worker，不访问原插件服务，不请求任意网站权限。
- 资源：本地 SVG 背景、CC0 网站图标与浏览器 favicon，避免外部图标服务依赖。
- 数据：版本化 JSON，导入严格校验，执行性 URL 被拒绝，用户文本转义；以导出备份替代首版云同步。
