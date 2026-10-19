# 验证记录

日期：2026-10-19；版本：0.1.0。

## 自动检查

- `npm run check`：通过。Manifest V3、仅 `storage` 权限、资源存在、JavaScript 语法和无 fetch/XHR/eval 调用检查。
- `npm test`：6/6 通过。覆盖备份往返、危险 URL 拒绝、中文搜索编码、网址拖动移动、异常备份校验和设置归一化。
- `npm run build`：通过，输出可加载文件夹与 ZIP。
- 构建后的每个扩展文件与源文件 SHA-256 一致；ZIP 内仅包含扩展资源与本项目 LICENSE。

## 浏览器验证

使用 Playwright CLI 驱动独立的 Chrome for Testing/Chromium profile，实际通过 `--load-extension` 加载扩展，然后访问 `chrome://newtab/`。实际页面跳转为 `chrome-extension://agckbpgfbfbgpaobjhanginecdpfgfkl/newtab.html`，验证使用的是真实扩展页与 `chrome.storage.local`，不是只测试 Web 模拟页。该 ID 来自当前绝对路径，换路径后可能变化。

已通过的流程：

- 搜索快捷键、Google 搜索提交、切换 Bing 后的实际搜索目的地；测试用路由返回本地响应，未依赖搜索服务可用性。
- 新建分组、添加与编辑网址、跨组移动、拖动排序、拖到侧栏移动、删除与撤销。
- 编辑窗口拒绝 `javascript:`，含 HTML 字符的名称按文本展示。
- 新增待办、勾选完成、剩余数量、清除已完成及撤销。
- 显示/隐藏时钟、秒数设置、昵称、深色主题和紧凑模式操作。
- 预设壁纸、本地图片读取压缩并应用；重开页面后保持图片与设置。
- 页面刷新后数据仍在；两个真实新标签页读取共享数据，并传播分组切换。
- 导出 JSON、导入预览与确认；删除分组后用备份恢复，刷新仍保留恢复的数据。
- 恶意备份被拒绝，原数据保持；删除分组有再次确认并可撤销。
- 390 px 窄窗口没有横向溢出；桌面 1440×1000 与窄窗口截图已人工查看。
- 抽屉和设置截图已查看，Esc 关闭行为通过。
- 最后检查页面控制台：0 错误、0 警告；资源请求均来自扩展自身。
- 测试浏览器断网后重新加载扩展页，初始网址和时钟正常显示。

浏览器流程脚本为 `scripts/browser-smoke.js` 和 `scripts/browser-edge-smoke.js`，供 Playwright CLI `run-code --filename ...` 调用。必须在单独的测试 profile 运行：首个脚本会清空该扩展的测试存储；第二个脚本接着使用首个脚本的测试数据与 `output/playwright/backup.json`。

本地截图和测试数据保存在 `output/playwright/`，均不在发行包或 Git 中。

## 当前边界

没有修改用户日常 Chrome 中的 MONKNOW 安装、接管设置或私有数据。最终启用需在日常 Chrome 的扩展管理中加载文件夹，并在需要时停用原新标签扩展。真实搜索服务的网络可用性、跨设备同步、原 MONKNOW 数据格式兼容和上架应用商店不在本次验证范围。

## 0.1.1：字号与网站图标

同日更新。默认增大文字，字体、图标和间距改用 rem，并随 CSS 视口宽度连续缩放；设置新增额外 15% / 30% / 50% 缩放。时钟受容器宽度约束，避免窄窗口放大后溢出。

常用网站使用随包分发的本地图标；其他网站通过 [Chrome favicon 资源](https://developer.chrome.com/docs/extensions/how-to/ui/favicons) 显示图标，Manifest 增加 `favicon` 权限。图标来源及许可证见 `THIRD_PARTY_NOTICES.md`。

验证结果：

- `npm test`：11/11 通过，新增域名匹配、防仿冒域名、文字图标覆盖、Chrome 图标 URL 与旧数据兼容测试。
- 实际扩展加载后，14 个预置网址均加载到图标；旧版本网址、昵称、待办与标识保持。
- 390 / 1024 / 1440 / 1920 / 2560 px 五种视口均无横向溢出或图标重叠。
- 网址标题字号：1440 px 视口约 14.15 px，1920 px 约 15.07 px，2560 px 约 16.30 px；图标随之增长。
- 手动增加 30% 后刷新仍保持；390 px 窗口增加 50% 时仍无横向溢出。
- 编辑网址切换「自动识别」和「文字图标」通过；非预置域名使用 Chrome 的 `_favicon` 资源。
- 断网后刷新，内置图标和浏览器图标资源仍正常显示。浏览器未缓存某站图标时可能返回默认图标。
- 本次浏览器检查无未捕获错误。相关截图为 `output/playwright/display-*.png`，脚本为 `scripts/browser-display-smoke.js`。

更新保留 storage key 和数据版本，无需卸载；在扩展管理页重新加载并新开标签页即可。若 Chrome 提示新增 favicon 权限，需要允许后继续使用。

## 首次开源提交前的复核

2026-10-19：移除了未建立再分发许可的 Are.na PNG，改为浏览器 favicon。使用新创建的独立 profile 通过 `npm run test:browser` 顺序跑通核心、边界和显示三组浏览器脚本；13 个默认网站图标来自包内资源，Are.na 使用 Chrome 资源。旧数据、备份、离线加载、五种窗口尺寸与缩放检查均通过。`npm test` 11/11，资源/文档链接检查和构建通过。

公开 README 截图仅含默认网址和界面，不含测试昵称、用户私有数据或上传壁纸。原始 REA 报告、测试 profile、备份和构建输出均留在 Git 忽略的目录中。
