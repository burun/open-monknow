# Privacy / 隐私说明

Last updated: 2026-10-19. Applies to the code distributed by this repository, currently version 0.1.1.

## Data stored

The extension stores shortcut titles and URLs, groups, to-dos, display settings, your optional greeting name, and a resized copy of an uploaded wallpaper in `chrome.storage.local` for the current browser profile. A Web preview uses that preview origin's localStorage instead. The two stores are independent.

The extension does not implement accounts, cloud synchronization, analytics, advertising, crash uploads, or a backend. It does not upload your saved data or wallpaper. No data is sent to a project operator by the extension.

## Permissions and network behavior

- `storage` saves local state and reflects changes across open new-tab pages.
- `favicon` displays Chrome-provided website icon resources. Common website icons are bundled locally; other icons use the browser's `_favicon` resource. The extension does not submit website domains to a third-party icon service. Chrome's own services and network behavior remain subject to its settings and policies.
- No broad website host, browser history, bookmark, or tab-management permissions are requested.

Submitting a search or opening a shortcut navigates to the selected search engine or website. That site receives the resulting request and applies its own policies. The extension does not proxy the request. Bundled wallpapers, fonts supplied by your operating system, and application scripts do not require a remote service.

## Backups, deletion, and sharing

Exported JSON backups contain your shortcuts, to-dos, settings, and local wallpaper. They are downloaded to a location controlled by you and are not encrypted by this project. Treat them as personal files.

Importing a backup replaces local state after validation and confirmation. Uninstalling the extension or clearing its browser data removes its local store. This does not delete exported files, source files, or data held by websites you visited. You control deletion of those separately.

If you submit an Issue, PR, screenshot, or attachment to GitHub, it is handled by GitHub under its policies and the repository's visibility. Do not post real backups or private URLs.

## Changes

Changes to data storage, permissions, or network behavior should update this document and the changelog. Review the code and permissions before installing a fork or modified distribution.

中文摘要：网址、待办、设置和缩放后的壁纸保存在当前浏览器；本项目没有账号、统计或数据上传。搜索和点击链接会访问对应网站。导出的备份含个人数据，卸载不会删除已导出的文件。浏览器图标由 Chrome 提供，浏览器自身的服务行为由其设置决定。
