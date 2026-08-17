# 悦景新世界 · Cloudflare Pages 上传说明

## 最简单：网页后台拖拽上传

1. 打开 Cloudflare 控制台的 **Workers & Pages**。
2. 选择 **Create application → Pages → Drag and drop**。
3. 项目名填写 `comparelist`。
4. 上传项目根目录生成的 `悦景新世界-Cloudflare-Pages.zip`，或直接拖入 `cloudflare-dist` 文件夹。
5. 点击部署，完成后会得到一个 `*.pages.dev` 地址。

## 使用命令行上传

首次使用需要在项目目录登录 Cloudflare：

```powershell
npx wrangler login
```

然后执行：

```powershell
npm run deploy:cloudflare
```

## 数据与隐私

- 本站没有服务器数据库，愿望单、门款价格、自定义候选和本地资料均保存在当前浏览器。
- 换电脑、换浏览器或清理浏览器数据后，这些本地录入内容不会自动同步。
- 已配置 `noindex` 和 `robots.txt`，用于阻止常规搜索引擎收录；但 Pages 地址本身仍可能被知道链接的人访问。
- 如需真正限制访问，请在 Cloudflare Zero Trust 中为该站点配置 Access 登录保护。
