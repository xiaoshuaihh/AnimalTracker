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

需要 Node.js 24。运行 `npm run dev`，在浏览器打开终端显示的地址。本地与自托管服务器使用用户名密码注册登录的本地账号和 SQLite。托管线上环境使用平台身份、D1 和 R2。照片会在本地重新编码以移除元数据，类别和物种请手动填写。

特殊事件仅向提交者和审核通过的账号展示，照片也受相同访问控制。管理员由服务端 `EVENT_ADMIN_USERNAMES` 指定（核心管理员），可在「我的 → 管理员模式」中通过、驳回或撤销事件权限申请、查看全部事件并删除不当记录。核心管理员还可将普通用户设为管理员，或将管理员设为普通用户；除此之外与管理员权限相同。用户身份为「核心管理员」「管理员」「普通用户」三类。校内邮箱仅用于审核，管理员应通过校内渠道核实申请者身份。提交事件不会触发救助通知。

观察记录支持标签（按动物类别区分，可多选或自定义）、动物档案包含性别与健康状况。点击观察记录可「修改这条记录」（本人或管理员直接生效），他人记录可「申请修改这条记录」，由管理员在「我的 → 管理员模式 → 修改申请审核」中通过或驳回；修改仅限时间、地点、动物标签、关联档案和观察文字。管理员可修改和删除任意观察记录与动物档案。

当前轮次通过与 Codex 的自然语言对话确定需求和实现，使用 ImageGen 生成示例图片。真实用户反馈及相应改进待试用后补录。

### 自托管部署（Ubuntu）

项目零第三方依赖，服务器仅需 Node.js ≥ 24 即可运行，数据库与图片存放于本地目录，无需 Docker 或外部服务。

1. 安装 Node.js ≥ 24（NodeSource 或 nvm），把仓库放到服务器（如 `/opt/animaltracker`，更新时 `git pull`）。
2. 创建数据目录（首次启动会自动创建），并配置 `.env`：

   ```
   WILDLIFE_DATA_DIR=/var/lib/animaltracker
   WILDLIFE_HOST=0.0.0.0
   PORT=4173
   EVENT_ADMIN_USERNAMES=你的核心管理员用户名（逗号分隔）
   ```

   其中 `WILDLIFE_HOST=0.0.0.0` 直接对外；更推荐 `127.0.0.1` + Nginx/Caddy 反代 HTTPS（需转发 `Host` 与 `X-Forwarded-Proto` 头）。
3. 前台启动用 `npm start`；生产环境推荐 systemd：参考 `deploy/animaltracker.service` 修改路径与用户名后 `systemctl enable --now animaltracker`。
4. 升级：先备份数据目录（`wildlife.sqlite*` 与 `images/`），`git pull` 后重启服务，数据库迁移（`migrations/*.sql`）自动按版本号执行，无需手工操作。

## English

A wildlife observation map for students and staff at The Chinese University of Hong Kong, Shenzhen. Record everyday sightings and incidents such as bird-window and vehicle collisions, browse animal profiles, and build a personal collection.

Select **记录观察** to log a sighting. Optionally add a photo, choose a campus area and observation type, and confirm whether the sighting belongs to an existing or new animal. Confirmed everyday encounters appear in the personal collection alongside bookmarked profiles. The map uses OpenFreeMap vector tiles (OpenStreetMap data, no API key) with five location groups — Upper, Middle and Lower Campus, Fairy Lake and Others — plus free-text sublocations, and can be zoomed, panned, or collapsed into a draggable floating window. Photos are re-encoded before upload and location is stored by area. Sample sightings are fictional and sample images were generated with ImageGen.

Use Node.js 24 and run `npm run dev`. Open the address printed in the terminal. Local and self-hosted servers use username/password accounts and SQLite. The hosted application uses managed sign-in, D1 and R2. Photos are re-encoded locally to strip metadata; fill in category and species manually.

Incident records and photos are restricted to their submitters and approved accounts. Admins are configured server-side with `EVENT_ADMIN_USERNAMES` (core admins). From 「我的 → 管理员模式」 they approve, reject, or revoke access applications, review all incidents and remove inappropriate ones. Core admins can additionally promote regular users to admins or demote admins back to regular users; apart from that, core admins and admins share the same permissions. User roles are 核心管理员 (core admin), 管理员 (admin) and 普通用户 (regular user). The campus email is used for review; admins verify affiliations through campus channels. Filing a report does not dispatch help.

Observation records support tags (per animal category, multi-select or custom) and animal profiles include gender and health status. From an observation's detail dialog you can 修改这条记录 (edit directly for your own records; admins can edit any record) or 申请修改这条记录 (a modification request for other people's records), which admins review in 「我的 → 管理员模式 → 修改申请审核」. Edits are limited to time, location, tags, the linked profile and the observation text. Admins can modify and delete any observation record and animal profile.

This iteration used natural-language collaboration with Codex and generated sample imagery with ImageGen. Feedback from real users and corresponding changes will be added after testing.

### 设备权限、多媒体和义卖 / Device permissions, media and fundraising

设置页可请求相机、麦克风和定位权限，并保存个人主页的公开 ID、头像和成就选择。日常观察可使用文字、照片、视频或录音。视频和录音单文件上限 25 MB。

Settings requests device permissions and lets users choose a public ID, avatar, and unlocked badges to display. Everyday sightings support text, photos, video, or audio. Video and audio uploads are limited to 25 MB per file.

猫咪档案的义卖商品通过服务端 `CAT_FUNDRAISERS_JSON` 配置。每项需要对应的 `animalId`、商品名称 `title`、整数分价 `priceCents`、HTTPS 购买地址 `link`，以及经核实后设置的 `verified: true`。开放前请核实购买链接、授权与款项用途，并按赛事要求处理商业广告及付费内容。默认目录为空。

For cat fundraiser listings, configure the server variable `CAT_FUNDRAISERS_JSON` with an array of entries containing `animalId`, `title`, `priceCents`, an HTTPS `link`, and `verified: true` after verification. Verify the destination, authorization, and use of proceeds before enabling listings. The catalog is empty by default.
