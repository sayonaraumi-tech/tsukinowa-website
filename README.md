> 2026-10-05 持续更新规则优先于下方历史说明：案例数据改为 works-data.js，当前4组完整案例已接入，宠物案例待 Before；首页氛围/服务图无 AI 可见提示，WORKS 只允许真实照片。

# tsukinowa-website — 月輪合同会社 / GETURIN LLC

独立静态官网第一版。HTML / CSS / JavaScript，无第三方运行依赖、数据库、Firebase、登录、广告或追踪脚本。未访问或修改 geruninn。Hero 与允许的服务图为明确标注的中性示意图，真实施工案例目前为专用占位框；第三轮已将 Hero 与クロス/CF/原状回復更换为注明「イメージ / AI生成・施工事例ではありません」的室内氛围图。公司 Logo 已由用户提供，固定文件 company-logo.svg 内嵌金色月轮与房屋原图，没有重新设计 Logo。favicon 是临时「月」文字图标。

## 目录

```text
tsukinowa-website/
├── index.html              首页
├── company.html            公司概要
├── works.html              数据驱动施工案例
├── contact.html            电话、LINE、邮件及邮件下草稿表单
├── privacy.html            隐私政策确认用草案
├── legal.html              特商法表记准备页
├── assets/
│   ├── css/style.css
│   ├── js/data.js           Logo、LINE、店铺URL、价格、案例
│   ├── js/main.js           移动菜单、案例展示、邮件内容确认
│   └── images/
│       ├── favicon.svg     临时文字 favicon
│       ├── logo/           放入公司现有 Logo
│       ├── ai/{hero,services,properties}/  允许区域的 AI 图预留
│       ├── illustrations/  中性示意图（hero / services / properties）
│       ├── works/
│       │   ├── real/       真实施工照片专用，当前为空
│       │   └── placeholders/real-photo.svg  真实照片专用占位
│       └── company/        公司图片预留目录
├── tools/configure_seo.py  设置真实网址及生成 sitemap
├── robots.txt
├── sitemap.xml
└── .nojekyll
```

## 本地预览

在本项目目录执行 `python3 -m http.server 4173 --bind 127.0.0.1`，访问 `http://127.0.0.1:4173/`。无需安装依赖、构建或连接后端。电脑、平板、手机均可使用。标题字体优先 Noto Serif JP，正文优先 Noto Sans JP，未安装时使用本机日文明朝/ゴシック字体；当前未加载外部字体，避免额外网络请求。

## 替换现有 Logo 与 favicon

只需以正式 SVG 替换 `assets/images/logo/company-logo.svg`，六页自动生效。当前该文件内嵌用户提供的正式 Logo，公司名保留为主识别；若提供 PNG/WebP，则放入同目录并仅修改 data.js 的 logoUrl。图片加载失败时保留空的无框位置和公司名，不显示 LOGO 字样。将当前文字 favicon 替换为现有 Logo 的合适版本，并同步各页 `<link rel="icon">`。

## 图片使用策略与替换

图片按用途分开管理：

- `assets/images/ai/{hero,services,properties}/`：AI 生成图片，当前为空。
- `assets/images/illustrations/{hero,services,properties}/`：中性示意图；当前 Hero 与三个允许的服务图使用 SVG 示意图，対応物件保持原有文字列表。
- `assets/images/works/real/`：公司实际施工照片，当前为空。
- `assets/images/works/placeholders/real-photo.svg`：真实照片未提供时的占位框，不能当成已公开施工记录。

**AI / 示意图仅用于** Hero 完成后室内氛围、クロス張替え / CF・床施工 / 原状回復的服务说明，以及マンション / アパート / 戸建て / ホテル / 民泊 / 管理物件的対応物件说明。不要附加「施工実績」「実際の施工例」等标签。首页氛围/服务图不显示 AI 来源提示，alt 描述为室内イメージ，不暗示为公司完工照片。AI 图片不得进入施工实绩。

**施工事例 / WORKS、Before / After、穴補修（壁穴補修）、ドア補修、其他明显破损修复原则上且本项目固定使用真实施工照片**。首页自动展示最新4条已发布真实案例，不固定类别或案例。内装補修服务图同样使用真实照片专用占位，不用 AI 模拟修复。用户未提供照片时不编造项目、客户、地址、成果或评价。

Hero：在 `index.html` 修改 `.hero-image img` 的 src、alt、width、height 和 figcaption，文件放入 `ai/hero/` 或 `illustrations/hero/`。三个允许的服务图分别放入 `ai/services/` 或 `illustrations/services/`，修改首页 src、alt 和 `.service-image-caption`。内装補修服务图只替换为 `works/real/` 中的授权真实照片。Hero 不懒加载，其他服务与案例图片保持 lazy loading；保持现有图片比例和响应式布局。

推荐 WebP/AVIF；Hero 横竖裁切均预览检查。AI / 示意素材不放入 `works/real/`，真实图的文件夹不能改变图片的实际来源。

## 新增真实施工案例

参见 [WORKS_UPDATE_GUIDE.md](WORKS_UPDATE_GUIDE.md)。唯一案例数据入口为 `assets/js/works-data.js`；`data.js` 仅保留联系方式和价格配置。首页按日期倒序自动取最新4条，Works 页显示全部已发布真实案例；未发布记录不显示为施工实绩。

## 后续真实照片清单

1. 穴補修 / 壁穴補修：同一位置、相近角度的 Before / After，含破损近景与修复后近景；可补充整体完成图。
2. ドア補修：同一扇门同一破损位置的 Before / After，近景及门整体完成图。
3. クロス張替え：同一房间的施工前后配对图；可补充墙面接缝、收边等细节。
4. CF・床施工：同一区域的施工前后配对图；可补充地面与边缘完成细节。
5. 其他破损补修：破损位置、施工前后配对照片及真实施工内容。

每组另附已核实的地区（无需具体地址）、物业类型、施工内容和简短说明，并确认允许公开。没有资料的项继续保持准备中。

## 修改价格、LINE 与店铺链接

修改 data.js 的 `price`（当前 `1,400`，单位 `円/m～`）。如单位或收费内容变化，请同步首页报价说明。修改 `lineUrl` 为真实的 HTTPS LINE 官方账户/加好友链接。未填写时，按钮跳转联系页并明确显示准备中，不使用虚假的二维码或账号。くらしのマーケット仅显示「くらしのマーケット掲載店」文字，不设置店铺链接或按钮。

电话和邮箱统一配置在 data.js 的 phone / email，链接、显示文字及表单收件地址自动同步。HTML 保留无 JavaScript 时可用的电话／邮箱后备值，修改号码时也需同步这些后备值。地址和营业时间仍直接写入 HTML。代表者姓名未公开。

## 联系表单与隐私

表单在浏览器内生成邮件内容，先展示确认内容，点击后用 `mailto:` 打开用户邮件程序。不会自动发送、写入 GitHub、浏览器存储或数据库。照片区域只显示准备中，没有文件输入或上传功能。照片由用户在邮件应用中自行附件。没有邮件程序时可复制确认内容后自行发送。首次测试后请在实际手机邮件应用中再验证。

`privacy.html` 是确认用草案；`legal.html` 是准备页。正式公开前需要公司确认实际的信息管理、交易条件以及必要的公开记载。没有编造代表者、许可证、税务口径、付款方式或取消条件。

## GitHub Pages 部署

这是可直接部署的静态站点，兼容 `https://OWNER.github.io/tsukinowa-website/` 项目子路径，资源均为相对路径。本轮已准备独立 main 分支；远程推送和上线实际结果见 FINAL_CHECK.md。没有购买/绑定域名。

1. 在 GitHub 新建独立仓库 `tsukinowa-website`，不要使用 geruninn 仓库。
2. 将本项目目录里的内容提交到新仓库 main 分支根目录。不要上传上一级工作目录、截图、内部资料或密钥。
3. 仓库 Settings → Pages → Deploy from a branch → main → `/ (root)` → Save。`.nojekyll` 已提供，无构建步骤。
4. Pages 给出真实网址后，先执行：
   `python3 tools/configure_seo.py https://你的账号.github.io/tsukinowa-website/`
   然后提交更新。这会为六个页面生成 canonical、og:url 和绝对网址 sitemap，并更新 robots.txt。
5. 访问首页及全部页面、测试手机菜单、电话、邮件，检查 Logo、LINE、案例及两份政策内容。

canonical、og:url、og:image、robots.txt 和六页 sitemap 已设为目标测试网址 `https://sayonaraumi-tech.github.io/tsukinowa-website/`。分享图片是首页真实界面截图，非施工案例图；favicon 仍为临时文字图标。六页保留 `noindex, follow`，正式上线确认后才移除该标记；robots 允许访问，以便搜索引擎读取 noindex。测试网址预配置不代表已部署成功。

手机端六页底部固定 LINE（未配置时显示準備中）、电话和お問い合わせ，触控区域至少 46px。表单只生成并确认邮件草稿。

## 仍需提供

- 公司现有 Logo 原文件及 favicon 用版本。
- Hero 与クロス張替え / CF・床施工 / 原状回復服务图：可采用 AI 或中性示意图；当前中性示意图可继续使用。
- 内装補修服务图：授权真实照片；未提供时保持占位。
- 案例 Before / After 配对图、地区、物业类型、施工内容与简短说明。
- LINE 官方账户链接。
- くらしのマーケット实际店铺链接。
- 已确定目标独立仓库 sayonaraumi-tech/tsukinowa-website；如部署受账号权限限制，需用户完成登录或提供仓库访问权限。
- 隐私政策和交易条件确认；报价是否含税等未指定口径的正式确认。

文件预留 `assets/images/company/`，可以日后加入授权的公司图片。

部署操作依据：[GitHub 官方 Pages 发布源说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。免费方案可使用公开仓库；私有仓库支持取决于 GitHub 方案。

## 第二轮布局与信息层级优化

首页按 Hero → 选择理由 → 服务案内 → 法人/个人分流 → 施工事例 → 料金 → 对应物业/地区 → LINE 写真咨询 → 五步流程 → FAQ → 联系区 → Footer 排列。手机优势单列、服务上下排列、流程纵向；桌面服务图文交替。法人/个人按钮分别锚点到报价说明。服务「詳しく見る」沿用联系页，并预选对应服务。

首页最多显示最新4个已发布案例：Before / After、标题、类别；点击进入 Works 对应锚点。Works 显示全部及已确认的资料。未发布案例不进入公开列表。

LINE 仍由 data.js 的 lineUrl 统一控制；未配置时按钮跳到 contact.html#line，准备中提示保留。配置真实链接后，准备中提示自动隐藏，照片咨询按钮保持「LINEで写真を送る」。第二轮时 Hero 与三项允许服务使用中性示意图；第三轮已更新为有标注的 AI 室内氛围图。内装補修和四个案例仍待真实照片；Logo、favicon、LINE、店铺链接和政策草案的待确认状态不变。

本轮仅提交 layout-raizin-inspired 的 PR，保留六页 noindex，不更改 Pages 发布来源、不绑定域名、不自动合并。截图和检查记录见该 PR 及交付文件；仓库不包含临时浏览器或截图测试依赖。

## 第三轮视觉精修（2026-10-03）

结构与信息顺序不变。Logo 为透明无框占位，统一配置不变；手机 Hero、服务、FAQ 继续纵向阅读，LINE 准备提示降为按钮辅助说明。压缩区块间距、统一三项服务图比例、简化真实施工照片占位、减轻底部咨询栏并保留 safe-area。价格口径与全部 noindex 不变。验收与待补清单见 VISUAL_REVIEW.md。

### 正式 Logo 已接入

用户提供的金色月轮/房屋 Logo 已内嵌到统一 company-logo.svg，不重绘；调整显示范围排除截图外围空白。其余真实照片位置和 LINE/店铺链接配置继续保留，后续收到资料再替换。
