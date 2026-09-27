# CloudBase 国内访问说明

该路径已经由用户及其家人在中国大陆实机验证可访问，并已合并到主分支。CloudBase 静态网页调用 CloudBase 云函数，云函数再以服务端凭据从现有 Supabase 公开知识库读取固定字段；Vercel 和 GitHub Actions 保持独立，不需要修改。

> 默认 `*.tcloudbaseapp.com` 与 HTTP 网关默认域名仅用于开发测试。不要把它作为长期公开链接；长期稳定运行应先准备已备案的自定义域名。

## 部署前准备

1. 在 CloudBase 控制台创建免费测试环境。接受服务条款、实名认证或付费升级提示只能由账号持有人完成。
2. 记下环境 ID 和 HTTP 网关的默认域名。初始测试不需要购买域名。
3. 在云函数的环境变量中设置以下两项：
   - `SUPABASE_URL`：现有 Supabase 项目 URL。
   - `SUPABASE_ANON_KEY`：现有项目的 publishable / `anon` key。

该函数只使用与原网页相同的匿名只读权限，仍受现有公开成品库 RLS 约束；它不需要也不接受 `service_role` key。这两个值只能保存为云函数环境变量，绝不能写入 Git 或静态站点环境变量。

## 部署云函数

从仓库根目录运行下列命令。CloudBase CLI 官方支持普通云函数、环境配置和 HTTP 网关；如尚未安装，请按其官方 CLI 指引完成登录。

```powershell
Push-Location cloudbase
tcb fn deploy frontier-library-api --config-file cloudbaserc.json --env-id <你的环境-ID>
Pop-Location
```

然后在 CloudBase 控制台的 **HTTP 网关** 新建路由：选择默认域名，关联资源选 `frontier-library-api`，触发路径填写 `/api/library`。等待路由生效后，访问：

```text
https://<你的默认网关域名>/api/library
```

它应返回 JSON 数组；若返回 502，说明 CloudBase 到现有 Supabase 的服务端链路未通过，不能把前端测试误判为成功。

## 部署静态站点

在 CloudBase 静态网站托管的 Git 仓库部署中，选择本仓库并设置：

| 设置 | 值 |
| --- | --- |
| 安装命令 | `npm ci` |
| 构建命令 | `npm run build` |
| Node.js | `24.x` |
| 输出目录 | `out` |
| `NEXT_PUBLIC_STATIC_EXPORT` | `true` |
| `NEXT_PUBLIC_LIBRARY_API_URL` | `https://<你的默认网关域名>/api/library` |

不要填写 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 或任何私钥。前端只会调用上表的公开只读 API。

静态站点的详情卡片会使用 `/item/?id=<知识卡片-ID>`，以支持运行时新增的知识卡片；这与 Vercel 的 `/item/<id>` 路径并存且互不影响。

## 验收与回退

1. 在大陆网络中分别打开首页、知识库和一张详情卡片。
2. 刷新详情页，确认仍能显示；检查浏览器网络面板只有 CloudBase API，不出现 Supabase 域名。
3. 检查函数日志，没有环境变量或鉴权头被记录。
4. 记录首屏、列表和详情页的可用性与延迟。若 API 链路失败或默认域名限频，停止把测试地址公开传播，继续使用现有 Vercel 地址。

此测试尚未把数据库或自动化任务迁入中国大陆。只有测试通过并决定长期运行时，才评估 Supabase 数据迁移、抓取任务的地域合规性、已备案域名和付费资源。
