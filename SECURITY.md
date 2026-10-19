# Security policy

This early-stage project maintains the latest source on `main`. There is no guaranteed security-support period or response-time commitment. Installed unpacked extensions do not update automatically; users must update their local files and reload the extension.

## Report a vulnerability

Use GitHub's [private vulnerability reporting](https://github.com/burun/open-monknow/security/advisories/new) if that feature is enabled for this repository. This repository file does not enable it. If it is unavailable, open a minimal Issue asking for a private contact channel **without posting exploit details or personal data**.

Include the affected version, Chrome version, a minimal reproduction using synthetic data, expected impact, and any proposed fix. Do not upload real backups, browsing data, cookies, credentials, or private wallpaper images.

## Boundaries to preserve

- Validate imported data and reject executable URL schemes.
- Render user-controlled names and to-dos as text; do not execute imported HTML or scripts.
- Keep permissions scoped and document any additions.
- Keep application code and packaged assets local, and preserve third-party license notices.
- Never test against another person's browser profile or submit private test data to a public issue.

安全问题请优先使用上述私密报告入口。如果仓库未开启该功能，请只在 Issue 中请求私下联系渠道，不要公开漏洞细节或个人数据。
