# 持续更新施工实绩

1. 新建 `assets/images/works/real/<case-id>/`（小写英文字母、数字、连字符）。
2. 准备同一施工位置的真实 Before / After 原图，不修改施工内容、不生成 After。
3. 安装 Pillow 后运行 `python3 tools/prepare_work_images.py <case-id> <before原图> <after原图>`。自动方向校正、等比例缩至最长边1600px、压缩为 `before.webp` / `after.webp`，移除 EXIF，不裁切、不覆盖原图；目标约300KB，复杂照片可能略超出。
4. 在 `assets/js/works-data.js` 追加记录，复制现有字段。填写已确认的 `date`（YYYY-MM）；不明时留空。`publishedAt` 填实际首次发布日（YYYY-MM-DD），地区/物业可留空。照片配齐并检查后设置 `imageType: "real"`、`published: true`。
5. 首页自动显示最新4条，Works 自动显示全部并生成类别筛选。排序先用施工年月，缺失时用首次发布日；同年月按发布日排序，再按 id 稳定排序。不需要修改 HTML 或页面结构。提交新分支/PR，合并后现有 Pages 流程发布。

WORKS 只接收 `real` 且位于对应 case 文件夹的完整 WebP 对。未发布、AI/示意目录、缺失分类的记录不进入列表。路径检查不能鉴别照片真伪，维护者仍须核实来源。运行时加载失败会显示“写真を確認中です”，不会使用示意图替代。

当前接入：白木目门、开关周边墙面、クロス/原状回復、木目门4组已配对。宠物墙面案例只取得 After，保留未发布记录；缺少 Before，不能伪造或借用其他案例照片。5组施工年月均未提供，暂留空；4组首次发布日记录为本轮2026-10-05。
