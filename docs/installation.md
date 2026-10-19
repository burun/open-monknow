# Open Monknow v0.1.1 安装说明 / Installation

需要 Chrome 120 或更新版本。不需要 Node.js、npm 或编译。

发布页：https://github.com/burun/open-monknow/releases/tag/v0.1.1

## 首次安装

1. 下载发布附件 `open-monknow-0.1.1.zip`。GitHub 自动附带的 `Source code` 是项目源码，文件结构与这个插件安装包不同。
2. 解压 ZIP，将其中的 `open-monknow` 文件夹放到准备长期保留的位置。
3. 在 Chrome 地址栏输入 `chrome://extensions`，开启右上角「开发者模式」。
4. 点击「加载已解压的扩展程序」，选择刚才的 **`open-monknow` 文件夹**。该目录应直接包含 `manifest.json`、`newtab.html` 和 `assets/`。
5. 新开标签页。如果 Chrome 提示新标签页已被更改，选择保留。若其他新标签页扩展仍然接管页面，将它停用。

不要直接选择 ZIP，也不要选择 `assets/` 子目录。文件夹需要留在原位置；删除或移动它会影响加载。

## 更新已有安装并保留数据

1. 在插件「设置 → 导出备份」保存一份 JSON。
2. 下载并解压新版安装包，将 `open-monknow` **里面的文件**更新到之前加载的同一目录。原来加载的是项目 `extension` 目录，也应继续保留该目录路径。
3. 打开 `chrome://extensions`，点击本插件的「重新加载」，再新开标签页。
4. 如果 Chrome 提示新增的 `favicon` 权限，允许后继续使用。

**不要为了更新而卸载插件。** 卸载会删除它在浏览器内保存的数据。原有分组、网址、待办和设置兼容 v0.1.1。

## 权限和备份

- `storage`：将数据保存在当前浏览器。
- `favicon`：显示 Chrome 提供的网站图标；常用网站还附带本地图标。
- 不需要任意网站访问、浏览记录、书签或标签管理权限。

没有账号或云同步。换浏览器、换电脑或卸载前请先导出备份；备份含网址、待办和壁纸，需要自行保管。未缓存的网站图标可能显示默认图标。

## 校验附件（可选）

发布附件 `SHA256SUMS.txt` 列出安装 ZIP 和这份独立 `INSTALL.md` 的 SHA-256。将三个附件放在同一目录，可在支持的终端运行 `shasum -a256 -c SHA256SUMS.txt`，或在 Linux 上用 `sha256sum -c SHA256SUMS.txt`。

## English quick start

Download **`open-monknow-0.1.1.zip`** from the release page, extract it, and keep the resulting `open-monknow` directory in a permanent location. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the directory that directly contains `manifest.json`. Open a new tab and accept Chrome's prompt if shown. Disable another new-tab extension if it takes precedence.

Chrome 120+ is required; Node.js and a build step are not needed. To update, export a backup, replace files at the **same installed path**, reload the extension, and open a new tab. Do not uninstall to update. Approve the `favicon` permission if prompted.

源码、MIT 许可证、隐私和第三方素材说明：https://github.com/burun/open-monknow
