# 钟楼手记

血染钟楼玩家记录工具。静态 HTML，无需构建或安装依赖，可发布到 GitHub Pages。

## 发布到 GitHub Pages

1. 在 GitHub 创建一个仓库。如果使用免费方案，选择公开仓库。
2. 将本仓库内容上传到该仓库根目录，确保根目录直接有 index.html 和 scripts.json，不要再套一层文件夹。
3. 在仓库 Settings → Pages → Build and deployment 中，Source 选择 Deploy from a branch，Branch 选择 main，文件夹选择 /(root)，保存。
4. 等待发布成功，打开 Pages 显示的网址。iPhone 使用 Safari 打开这个网址，不要在“文件”App 中预览 HTML。
5. 可从 Safari 的分享菜单添加到主屏幕。此版本没有实现离线网页缓存，首次访问和检查共享库更新需要网络。

官方发布说明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 将本地 Git 仓库推到 GitHub

本目录已经初始化 Git 并包含初始提交。创建远程空仓库后，在本目录执行（把 YOUR_NAME 和 YOUR_REPO 替换为实际值）：

```powershell
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

Git 会通过你本机配置的凭据管理器处理授权。不需要把令牌写进网页或发到聊天里。也可以用 GitHub 网页上传文件；这种方式不会上传本地提交历史。

## 把你已保存的剧本加入仓库（重要）

本仓库已从你提供的“含已保存剧本”HTML 中导入 6 套剧本：风雅集、懦夫救星、双重疯狂、午夜俱乐部、桃之夭夭、惜墨如金。网页内置列表和 scripts.json 已更新为这些内容。之后在浏览器中新增或校对剧本时，按下面流程更新仓库。

1. 用原来保存过剧本的电脑浏览器打开更新后的“钟楼手记.html”，刷新页面。
2. 打开“管理剧本”，点击“导出共享剧本库”。下载的 scripts.json 包含该浏览器当前可用的全部剧本名称和角色，且不含玩家姓名、每日信息或游戏笔记。
3. 用下载文件替换仓库根目录的 scripts.json，提交并推送到 GitHub；也可以在 GitHub 网页上传并覆盖该文件。
4. 等待 GitHub Pages 发布完成。其他设备打开同一个网页，会读取新版剧本库。

## 剧本共享机制

- 页面启动、重新回到前台，以及页面可见时每分钟检查一次同站点 scripts.json。也可点击“检查共享剧本更新”。
- 网页里保存剧本只会先保存到本机。必须导出共享剧本库并提交仓库，其他设备才会得到更新；网页不持有 GitHub 写入权限。
- 收到更新时保留本机尚未发布的不同修改，并显示冲突提示。若确定采用仓库内容，可点“采用仓库版本”；建议先导出本机剧本库。
- 共享更新不修改当前正在进行的游戏角色选项。需要应用新版时，在开局设置中重新选中剧本并点“使用此剧本”。
- 共享库以稳定 ID 区分剧本，改名不会新建 ID。请保留导出文件中的 ID。
- 此版本支持新增、改名和修改角色，不实现远程删除传播。
- 游戏记录保存在各自浏览器中，不自动同步。

## 记录和本地文件

“导出分析记录”生成可上传给 AI 的 Markdown，同时附带可恢复的数据；“导入记录”兼容新格式和旧版 JSON。不要把分析记录提交到公开仓库。

“下载含剧本的 HTML”生成便携文件，但 iPhone 的“文件”App 预览不能保证运行脚本；手机请使用已发布的网址。

从本地 file:// 页面迁移到 GitHub Pages 属于新的浏览器存储位置。剧本用共享库迁移，游戏记录用导入分析记录迁移。

## 本地查看和验证

用桌面浏览器打开 index.html 即可查看。共享库读取需要 HTTP 服务或发布的网址。

如果电脑安装了 Node.js，可运行：

```powershell
node --test tests/shared-library.test.cjs
```

已做脚本和数据流程验证，尚未做真实 iPhone Safari 测试。
