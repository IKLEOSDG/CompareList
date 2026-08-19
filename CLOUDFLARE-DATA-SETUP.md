# Cloudflare 跨设备数据配置

站点前端仍由 Pages 托管；动态数据、压缩后的手机照片和小附件统一使用 D1。本地打开 `static/index.html` 时自动退回本机存储，访问 `https://comparelist.pages.dev/` 时启用云端同步。

## 1. 创建 D1 数据库

在 Cloudflare 控制台创建 D1 数据库，建议命名 `comparelist-data`，然后执行仓库中的：

```powershell
npx wrangler d1 execute comparelist-data --remote --file=./migrations/0001_cloud_project.sql
```

## 2. 绑定 D1

项目不再提交 `wrangler.toml`，绑定由 Cloudflare 控制台管理。在 Pages 项目 `comparelist` 的 Settings → Bindings 中新增 D1 binding：

- Variable name: `DB`
- D1 database: `comparelist-data`

Production 和 Preview 环境都建议绑定。

## 3. 设置项目访问口令

在 Settings → Variables and Secrets 新增加密 Secret：

- Name: `PROJECT_KEY`
- Value: 自己生成的一段长口令（建议至少 20 位）

不要把口令写进 Git 仓库。部署后点击网站顶栏的“未连接”，在每台设备输入同一个口令。浏览器只保存口令，不会把它写入 D1。

## 4. 重新部署

提交并推送仓库。Pages Functions 会从仓库根目录的 `functions/` 自动部署；Git 集成模式下继续使用：

- Build command: `npm run build`
- Build output directory: `cloudflare-dist`
- Root directory: 留空

部署完成后：

1. 打开 `https://comparelist.pages.dev/`。
2. 点击顶栏云同步状态并输入访问口令。
3. 用手机进入家电选型 → 添加设备 → 现场照片，可直接调用相机。
4. 另一台设备输入同一口令后即可读取同一份预算、进度、智能方案、设备和照片。

## 数据说明

- 预算、家电方案、全屋智能方案、施工阶段：D1 中的项目状态快照。
- 自定义主材/家具/定制候选和上传文档：D1 记录。
- 手机照片会在浏览器中自动压缩后保存为 D1 二进制记录；单个附件限制约 1.2 MB。
- 浏览器仍保留本机缓存，断网或 API 暂时失败时不会让页面无法使用。
- D1 免费版单库容量为 500 MB，适合家庭内部装修档案；建议保留重要原图的本机备份，不要把访问口令发给无关人员。
