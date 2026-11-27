# 神奇动物在哪里 · Campus Wildlife

2026 AI Vibe Coding 大赛<br>
主办单位｜香港中文大学（深圳）人文社科学院跨文化交流学科部

2026 AI Vibe Coding Competition<br>
Presented by the Division of Intercultural Communication<br>
School of Humanities and Social Science<br>
The Chinese University of Hong Kong, Shenzhen

## 中文

面向香港中文大学（深圳）师生的校园动物观察地图。可以记录日常目击及鸟撞、车辆碰撞等事件，浏览观察区域、个体档案和个人图鉴。

打开地图，选择「记录观察」，选填照片，选择校园区域和观察类型，再确认关联档案。遇到新个体时可建立档案。图鉴自动收录已确认的日常相遇，也支持收藏已有档案。地图以 OpenFreeMap（OpenStreetMap 数据）矢量地图为底图，无需密钥，地点按上园、下园、中园、神仙湖与其它五大类划分，各小类之外可自行填写地点；地图支持缩放、拖动，也可缩成可拖动的小窗。上传时重新编码照片，位置只保留区域。示例数据为虚构，示例动物图片由 ImageGen 生成。

需要 Node.js 24。运行 `npm run dev`，在浏览器打开终端显示的地址。本地与自托管服务器使用用户名密码注册登录的本地账号和 SQLite。托管线上环境使用平台身份、D1 和 R2。若要启用视觉识别，在服务端配置 `OPENAI_API_KEY`，例如本地加载自备密钥后再运行。密钥留在服务端。配置前可走手动确认流程。

特殊事件仅向提交者和审核通过的账号展示，照片也受相同访问控制。设置服务端 `EVENT_REVIEWER_EMAILS` 为负责核实身份的审核员登录邮箱（逗号分隔，自托管环境可改用 `EVENT_REVIEWER_USERNAMES` 按登录用户名指定）。审核员可以通过、驳回或撤销申请。审核身份本身不授予全量事件查看权，审核员无法审核自己的申请。校内邮箱仅用于审核，审核员应通过校内渠道核实申请者身份。提交事件不会触发救助通知。

当前轮次通过与 Codex 的自然语言对话确定需求和实现，使用 ImageGen 生成示例图片。真实用户反馈及相应改进待试用后补录。

## English

A wildlife observation map for students and staff at The Chinese University of Hong Kong, Shenzhen. Record everyday sightings and incidents such as bird-window and vehicle collisions, browse animal profiles, and build a personal collection.

Select **记录观察** to log a sighting. Optionally add a photo, choose a campus area and observation type, and confirm whether the sighting belongs to an existing or new animal. Confirmed everyday encounters appear in the personal collection alongside bookmarked profiles. The map uses OpenFreeMap vector tiles (OpenStreetMap data, no API key) with five location groups — Upper, Middle and Lower Campus, Fairy Lake and Others — plus free-text sublocations, and can be zoomed, panned, or collapsed into a draggable floating window. Photos are re-encoded before upload and location is stored by area. Sample sightings are fictional and sample images were generated with ImageGen.

Use Node.js 24 and run `npm run dev`. Open the address printed in the terminal. Local and self-hosted servers use username/password accounts and SQLite. The hosted application uses managed sign-in, D1 and R2. Set the server-side `OPENAI_API_KEY` to enable image identification. Manual entry is available without it.

Incident records and photos are restricted to their submitters and approved accounts. Configure the server-only `EVENT_REVIEWER_EMAILS` as a comma-separated list of designated reviewers' sign-in emails (self-hosted deployments can use `EVENT_REVIEWER_USERNAMES` to name reviewers by login username). The review role lets a reviewer approve, reject, or revoke applications. It grants no automatic access to all incidents, and reviewers cannot decide their own applications. The campus email is used for review. Reviewers verify affiliations through campus channels. Filing a report does not dispatch help.

This iteration used natural-language collaboration with Codex and generated sample imagery with ImageGen. Feedback from real users and corresponding changes will be added after testing.

### 设备权限、多媒体和义卖 / Device permissions, media and fundraising

设置页可请求相机、麦克风和定位权限，并保存个人主页的公开 ID、头像和成就选择。日常观察可使用文字、照片、视频或录音。视频和录音单文件上限 25 MB。

Settings requests device permissions and lets users choose a public ID, avatar, and unlocked badges to display. Everyday sightings support text, photos, video, or audio. Video and audio uploads are limited to 25 MB per file.

猫咪档案的义卖商品通过服务端 `CAT_FUNDRAISERS_JSON` 配置。每项需要对应的 `animalId`、商品名称 `title`、整数分价 `priceCents`、HTTPS 购买地址 `link`，以及经核实后设置的 `verified: true`。开放前请核实购买链接、授权与款项用途，并按赛事要求处理商业广告及付费内容。默认目录为空。

For cat fundraiser listings, configure the server variable `CAT_FUNDRAISERS_JSON` with an array of entries containing `animalId`, `title`, `priceCents`, an HTTPS `link`, and `verified: true` after verification. Verify the destination, authorization, and use of proceeds before enabling listings. The catalog is empty by default.
