# Open Monknow · 自在新标签

[English](README.en.md) · [MIT License](LICENSE) · [更新记录](CHANGELOG.md)

一个无广告、数据保存在本地的 Chrome 新标签页。搜索、分组网址、壁纸、时钟和待办，打开就能用。

独立实现，与 MONKNOW 官方无关联。曾使用 [REA](https://github.com/morluto/rea) 辅助调查现有扩展的入口和功能范围，应用代码和背景独立编写，不依赖原插件服务或 REA 运行。

![Open Monknow 新标签页](docs/images/overview.png)

## 安装

目前以源码和本地构建包安装，尚未上架 Chrome 应用商店。

1. [下载源码 ZIP](https://github.com/burun/open-monknow/archive/refs/heads/main.zip) 并解压，或运行 `git clone https://github.com/burun/open-monknow.git`。
2. 打开 `chrome://extensions`，开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择解压目录中的 **`extension` 文件夹**。
4. 新开标签页。如果 Chrome 提示新标签页已被更改，选择保留；若另一个扩展仍在接管新标签页，将它停用。

需要 Chrome 120+。安装无需 Node.js，也不需要编译。不要直接加载 ZIP 或项目最外层目录；已加载的文件夹需要保留在原位置。

**更新已有安装：** 在同一路径更新文件，在扩展管理页点击本插件的「重新加载」，再新开标签页。不要卸载后重装，以免丢失数据。0.1.1 新增 `favicon` 权限，如 Chrome 提示权限变化，允许后继续使用。

## 功能

- **搜索**：Google、Bing、百度、DuckDuckGo，支持直接输入网址。
- **网址与分组**：新增、编辑、删除、撤销；拖动排序和跨分组移动。
- **网站图标**：常用网站附带本地图标，其他网站使用 Chrome favicon；可选择文字图标和颜色。
- **时钟**：本机时区、中文日期、个性称呼，可隐藏或显示秒数。
- **壁纸**：四种本地背景，或选择自己的 JPG、PNG、WebP 图片。
- **待办**：新增、勾选、删除、清除已完成和撤销。
- **外观**：浅色、深色、跟随系统；自动适应窗口，支持额外放大 15% / 30% / 50% 和紧凑布局。
- **备份**：JSON 导出和导入，导入前验证、显示数量并确认替换。

| 快捷键 | 操作 |
| --- | --- |
| `/` 或 `⌘/Ctrl + K` | 聚焦搜索 |
| `⌘/Ctrl + ,` | 打开设置 |
| `Esc` | 关闭面板或移出搜索框 |

网址也可以通过编辑窗口选择目标分组，方便不使用拖动的场景。

## 数据与权限

没有账号、云同步、广告、分析统计、远程脚本或第三方图标服务。扩展用 `chrome.storage.local` 保存分组、网址、待办、设置和缩放后的壁纸；这些数据不会由扩展上传。

| 权限 | 用途 |
| --- | --- |
| `storage` | 本地保存数据，在同一浏览器的标签页之间同步变化 |
| `favicon` | 读取 Chrome 提供的网站图标资源 |

没有请求任意网站访问、浏览记录、书签或标签管理权限。搜索和打开网址会导航到所选网站；浏览器自身的服务行为由 Chrome 设置决定。详见 [隐私说明](PRIVACY.md)。

**换设备或卸载前，在「设置 → 导出备份」保存 JSON。** 备份含网址、待办和本地壁纸，请自行妥善保管。多个标签页同时编辑时采用后保存的版本，不做协作合并。

## 当前边界

- 界面主要为中文；英文 README 不表示应用已完成英文界面。
- 不提供天气、账号、跨设备云同步、远程壁纸市场或原 MONKNOW 专有格式迁移。
- 最多 50 个分组、每组 500 个网址、500 条待办。
- 图片输入最大 15 MB，自动缩放到 1920×1200 内；浏览器本地存储配额仍适用。
- 网站图标未被 Chrome 缓存时，可能显示默认图标；读取失败时使用文字回退。
- 不自动更新代码。卸载或清理浏览器扩展数据会删除本地数据。

## 开发

需要 Node.js 22+。核心运行、检查、单元测试和构建没有 npm 依赖，不需要 `npm install`。

```sh
git clone https://github.com/burun/open-monknow.git
cd open-monknow
npm run dev       # http://127.0.0.1:4173
npm run check     # manifest、资源、语法和网络边界
npm test          # 数据、网址和图标模型测试
npm run build     # dist/open-monknow 和按版本命名的 ZIP
```

浏览器预览使用 localStorage，与安装后的扩展数据独立；不支持 Chrome 特有的 favicon 资源。真实扩展验证方法见 [开发与测试指南](docs/development.md)。构建 ZIP 只供解压安装，不是签名的 CRX。

## 参与项目

Bug 和建议请到 [Issues](https://github.com/burun/open-monknow/issues)，贡献流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题请按 [SECURITY.md](SECURITY.md) 私下报告。项目没有承诺固定的响应时间或维护周期。

- [架构与开发](docs/development.md)
- [验证记录](docs/validation.md)
- [REA 调查与局限](docs/rea-investigation.md)
- [许可证选择](docs/licensing.md)

## 许可证

原创代码、背景和项目文档采用 [MIT](LICENSE)。允许使用、修改和再分发，包括商业用途，需保留版权和许可证声明。第三方网站图标采用其自身条款，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)；MIT 不授予第三方商标权。
