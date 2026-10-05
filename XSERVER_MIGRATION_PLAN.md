# XServer 迁移计划（仅官网）

当前官网为 HTML/CSS/JS 静态站，没有后台或云服务运行依赖。服务器尚未购买，本 PR 不实现后端，也不部署。内部 geruninn / 考勤 / 工资 / 记账不在此计划范围内。

1. **部署**：从 GitHub 选定已审核提交，导出根目录 HTML、assets、robots.txt 等公开文件，用 SFTP 上传 XServer 域名对应的 `public_html/`。不上传 `.git`、测试、工具、开发依赖或私密配置。先在测试地址验证资源路径与 HTTPS；更新 canonical/OG/sitemap 后再绑定正式域名。当前 noindex 保留，正式上线时另行确认解除。
2. **后台**：未来入口建议 `/admin/`，PHP 登录、服务器端权限检查、会话与 CSRF 保护；当前没有可用后台。凭据放公开目录外，不进入 GitHub。
3. **真实施工照片**：保留 `assets/images/works/real/<case-id>/before.webp`、`after.webp` 相对路径，后台处理方向、大小及 EXIF。缺 Before/After 的案例仅草稿；只发布核实来源的真实照片，AI 图不进入 WORKS。替换图片时原子保存，避免出现半组照片。
4. **数据**：可选 SQLite（数据库文件放公开目录外，先确认主机支持）或 MySQL。字段沿用 works-data.js 的 id/title/category/date/publishedAt/area/propertyType/description/beforeImage/afterImage/imageType/published。先导入4组公开案例及宠物墙面草稿，不虚构日期或补图。让 PHP 输出同结构数组给 `WORKS.publishedWorks`，保留本地排序、首页最新4条和类别筛选；路径/来源/发布状态也须在服务器端校验。服务项目继续共用 services-data.js。
5. **询价表单**：在 PHP 端完成输入校验、附件类型/大小检查、限流及 CSRF 防护，再配置真实 POST endpoint。用服务器邮件发送功能向公司邮箱通知，同时保存询价记录及附件（公开目录外）。服务器确认保存与发送结果后才显示真实成功/失败状态；补齐隐私说明与保存期限。当前送信按钮禁用，只有端末内输入和照片预览。
6. **验收与切换**：检查4组案例、草稿不可见、全部类别、联系方式、真实 LINE URL/QR、表单真实送信/错误处理、资源路径、320/390/768/1440px布局及 HTTPS。保留备份和回退版本。无需任何内部系统变更。
