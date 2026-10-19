# Contributing

欢迎提交问题、文档改进和代码。项目目前以小而完整的新标签页核心为主，新增远程服务、权限或收费相关机制前，请先在 Issue 中讨论需求。

## 报告问题

请说明 Chrome 和操作系统版本、扩展版本、复现步骤、预期与实际结果。界面问题可附去除私人信息的截图。不要附真实备份文件、私有网址、账号信息或个人壁纸。安全问题遵循 [SECURITY.md](SECURITY.md)。

## 本地开发

1. Fork 并 clone 仓库，使用 Node.js 22+。
2. 在 Chrome 中加载 `extension/`，或运行 `npm run dev` 查看 Web 预览。
3. 完成相关改动后运行 `npm run check` 和 `npm test`。
4. 涉及安装资源或打包时运行 `npm run build`；涉及 Chrome 行为时在独立测试 profile 中验证。详见 [开发指南](docs/development.md)。

## Pull request

- 一次 PR 解决一个明确问题，描述触发场景、改动后的行为和验证结果。
- 保持原生 HTML/CSS/JavaScript 和少依赖的结构；引入依赖需解释必要性。
- 保留旧数据兼容性；新增设置必须在校验器中有默认值，新增 URL 入口必须经过安全校验。
- 避免未经说明的网络请求、远程素材、任意网站权限和个人数据收集。
- 新增图标或素材要给出可再分发的来源、许可证和必要声明。
- 不提交 `output/`、`dist/`、浏览器 profile、真实备份或凭据。
- 修改功能时同步更新 README、相关说明和 `CHANGELOG.md` 的 Unreleased 部分。

提交信息使用简短的 Conventional Commits，例如 `fix: preserve text icons after editing`。没有要求为纯文档或无行为变化的样式修改增加单元测试；涉及数据、权限或安全边界时，应提供相应验证。

## 贡献许可

提交贡献即表示你有权提交这些内容，并同意原创贡献按本项目 MIT 许可证分发。第三方素材须保留其适用许可。当前不要求额外 CLA。

Please keep contributions focused, preserve existing data, and include verification for changed behavior. English issues and pull requests are welcome.
