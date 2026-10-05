# 施工实绩后台：一次性设置

后台已经做好。启用前，首页和 Works 继续显示现有静态案例。请使用**独立的官网 Firebase 项目**，不要复制 geruninn 的配置。

## 一次性准备（约 20–30 分钟）

1. 打开 [Firebase 控制台](https://console.firebase.google.com/)，创建新项目，例如 `tsukinowa-website`。无需开启 Analytics。
2. 进入 **Authentication → 登录方式**，启用 **Email/Password（邮箱/密码）**。在“用户”中新建自己的管理员账号；密码只输入控制台，不要写进 GitHub 或配置文件。授权网域加入 `sayonaraumi-tech.github.io`。
3. 打开 **Firestore Database → 创建数据库**，使用 Standard / 原生模式、默认数据库 `(default)`、生产模式，选择合适区域（建议东京）。
4. 打开 **Storage → 开始使用**，创建默认存储桶。Storage 目前需要 Blaze 计费方案和结算账户，请先在控制台确认费用、设置预算提醒（预算不是硬性费用上限）。
5. 项目设置 → 添加 **Web App（网页应用）**。不需要 Firebase Hosting，官网仍使用 GitHub Pages。复制控制台显示的 `firebaseConfig`。
6. 在 `assets/js/firebase-config.js` 中，把 `null` 改成该配置对象，格式参考旁边的 `firebase-config.example.js`。这是一次性的官网配置更新，此后上传案例不再改 GitHub 文件。
7. Authentication → 用户 → 复制管理员 **UID**。Firestore → 数据 → 新建集合 **`worksAdmins`** → 文档 ID 填这个 UID → 加入布尔字段 **`enabled: true`**。不用把 UID 放到网页代码或公开仓库。仅用控制台创建；网页用户不能给自己加权限。
8. Firestore → 规则：粘贴 `firebase/firestore.rules` 全文，点击发布。Storage → 规则：粘贴 `firebase/storage.rules` 全文，点击发布。Storage 规则会访问 Firestore，首次发布时按控制台提示允许跨服务权限。必须两份都发布，不能使用“测试模式”开放权限。Storage 原始文件与元数据仅管理员可读，公开照片通过下一步的安全接口展示。
9. **允许后台预览图片（CORS）**：在 [Google Cloud 控制台](https://console.cloud.google.com/) 选择这个独立项目，打开 Cloud Shell。上传仓库中的 `firebase/storage-cors.example.json`，执行下面命令，将桶名换成 Web config 中的 `storageBucket`：
   ```sh
   gcloud storage buckets update gs://你的存储桶名 --cors-file=storage-cors.example.json
   ```
   只授权官网来源 `https://sayonaraumi-tech.github.io`；地址更换后才更新。缺少这一步时后台已保存图片的预览会读取失败；公开图片接口的 CORS 已在代码中设置。
10. **部署公开图片接口（协助者一次性完成）**：在官网仓库目录执行：
    ```sh
    cd firebase/functions
    npm ci
    cd ../..
    firebase deploy --only functions:works --project 你的独立项目ID
    ```
    首次部署按控制台提示启用所需服务与权限。复制部署输出的 `workPhoto` URL，在 `firebase-config.js` 对象中额外加入 `photoEndpoint: '复制的URL'`（示例文件也有这一项）。Cloud Functions 同样使用该独立项目，Blaze 费用需自行确认。没有这个接口，公开图片不会显示。协助者可使用 Cloud Shell，无需传出私钥。
11. 发布配置文件到 GitHub Pages 后，打开 **`https://sayonaraumi-tech.github.io/tsukinowa-website/admin/works.html`**。本 PR 未合并前正式地址还不会更新，可先在分支预览中验证。

无需把 Firebase 控制台密码交给 Codex。创建项目、接受费用方案、创建账号、获得控制台权限需要由你完成；拿到公开 Web config 后可让 Codex 帮你接入。配置修改也应走 PR，不直接改 main。

## 之后每次添加案例

登录后台 → “新しい施工実績” → 填标题、类别和说明 → 分别选择 Before / After → 确认真实施工照片和公开许可 → “保存して公開”。地区、物件类型、施工年月可留空。

- 只有一张图时，点“草稿を保存”即可；两张都齐全才可发布。
- 图片会按 EXIF 方向解码、缩至长边最多1600px，以约82%质量保存 WebP；不支持 WebP 时用 JPEG。只支持 JPEG、PNG、WebP；HEIC 请先转换为 JPEG。上传前看预览确认方向。
- 首页显示最近发布的4条；Works 显示全部并可分类筛选。两页实时订阅公开案例，不用再改 HTML。
- 点击列表中的案例可编辑。保存草稿会让已发布案例下架；“保存して公開”则更新公开内容。“下架する”只撤回公开状态，“削除”需再次确认并删除照片。
- 登录只保留在当前浏览器会话中；共用手机使用完请点“ログアウト”。没有管理员 UID 授权的账号看不到管理表单，规则也会拒绝写入。
- 发布的照片已经可能被访问者保存，撤回无法收回他人此前保存的副本。

## 现有案例平滑迁移

后台有“既存の施工写真を取り込む”：把 `works-data.js` 里的真实照片上传为**草稿**，同 ID 的已有记录会跳过。待补 Before 的宠物墙面案例也作为草稿保留。逐个检查照片和资料，再发布。

首次成功连接 Firebase 后，以 Firebase 为准，即使库中是0条，也不混入静态数据。因此建议先在分支预览里配置后台，一次性导入并发布现有4组完整案例，再正式上线配置。本地数据与照片不会被删除。

Firebase 未配置、首次读取失败或超时，会临时使用旧静态数据，避免空白。此时旧静态案例可能仍被展示；它们是仓库已有的公开记录，不包含 Firebase 草稿。如不能接受云端故障时显示旧案例，应在迁移确认后停用该备用机制。成功建立实时连接后，后续错误会清空当前列表，不重新显示被下架的本地同 ID 案例。

## 哪些可以公开，哪些绝对不能提交

- **可以公开**：Web config 的 `apiKey`、`authDomain`、`projectId`、`storageBucket`、`messagingSenderId`、`appId`；它们标识网页应用，不赋予管理员权限。
- **绝不能提交**：账号密码、Admin SDK 私钥、service account JSON、OAuth client secret、访问 token、下载 token、`.env`。管理员 UID 放在私有 `worksAdmins` 文档里。
- 安全依靠 Authentication + 两份服务端 rules。不要把规则改成 `allow read, write: if true`，也不要只靠隐藏后台入口。

## 图片安全与维护

元数据存 `works/<case-id>`；图片存 `works/<case-id>/before-<随机版本>.webp` 和 `after-<随机版本>.webp`（不支持 WebP 时 `.jpg`）。版本化可避免编辑中的新图提前覆盖公开照片。

Storage 上传接口自动生成下载 token；仅靠 rules 判断 `published` 无法阻止已持有 token 的下载请求。为此，本方案**拒绝所有访客直接读取 Storage**，通过轻量 `workPhoto` Cloud Function 返回图片。它用服务器身份读取 Firestore，验证已发布、`real`、当前引用路径，再读取图片，并在返回前复核发布状态。接口不返回 Storage 元数据或 token。管理员预览使用 `getBlob`；公开页面调用图片接口后生成临时预览 URL。整个网站不调用 `getDownloadURL`。

下架或删文档后，接口不再返回照片。不要在 Storage 控制台生成/分享持久 token 链接；如果曾泄露，需在控制台撤销。管理员是可信角色，有原文件读取权限。Storage 的跨 Firestore 授权只用于核对管理员 `worksAdmins` UID。公开图片接口不接受任意 Storage path，只接受案例 ID 与 before/after。

删除先删案例，再删图片；若网络中断导致剩余图片，后台会提示你在 Storage 中清理对应目录。中断上传也可能留下未被案例引用的图片，管理员可定期清理。公开访客不能访问未引用的图片。

规则校验字段类型、类别、真实照片标记、完整图片路径及时间戳；规则无法确认照片实际内容或从 Firestore 检查 Storage 文件存在，后台发布前会检查两个文件是否存在。管理员需自己确认照片真实来源。请只授权可信管理员。

## 给协助设置的人

也可在独立项目中用 Firebase CLI 部署：
```sh
firebase deploy --only firestore:rules,storage,functions:works --project 你的独立项目ID
```
先完成跨服务授权及 CORS。不要用 geruninn 的 `.firebaserc` 或凭据。

测试需要 Node.js、Java 21+。先 `npm ci`、`npx playwright install chromium`，再运行 `npm test`、`npm run test:rules`、`npm run test:browser`。这些都使用本地模拟器，不改生产项目。模拟器测试覆盖访客/普通用户/管理员、草稿、缺图、错误字段、Storage 原始读取被拒绝，以及图片接口下架/删除撤权。

官方依据：[公开案例查询与规则](https://firebase.google.com/docs/firestore/security/rules-query)、[Storage 关联 Firestore 权限](https://firebase.google.com/docs/storage/security/rules-conditions)、[直接读取图片与 CORS](https://firebase.google.com/docs/storage/web/download-files)、[Storage 计费要求](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)。
