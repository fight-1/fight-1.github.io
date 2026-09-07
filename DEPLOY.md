---
name: github-pages-deploy
description: 部署 fight-1 个人主页到 GitHub Pages
---

## 部署步骤

### 1. 推送代码到 GitHub

```bash
# 在 d:/project/github/fight-1 目录下执行
git init
git remote add origin git@github.com:fight-1/fight-1.github.com.git
git add .
git commit -m "feat: initial deploy"
git branch -M main
git push -u origin main
```

### 2. 在 GitHub 上启用 Pages

1. 打开 `https://github.com/fight-1/fight-1.github.com`
2. 点 **Settings** → **Pages**
3. **Source** 选择 `GitHub Actions`
4. （默认已配置，不需要改）

### 3. 创建 GitHub Token（用于 lowlighter/metrics）

1. 打开 `https://github.com/settings/tokens`（Classic token）
2. 勾选 `public_repo` 权限
3. 生成 token，复制保存
4. 回到仓库 → **Settings** → **Secrets and variables** → **Actions**
5. 点 **New repository secret**
6. Name: `METRICS_TOKEN`，Value: 填入 token

### 4. 等待自动构建

推送后 GitHub Actions 会自动运行：
- `Build and Deploy to GitHub Pages` → 构建 Astro → 部署到 `https://fight-1.github.com/`
- `GitHub Metrics Dashboard` → 生成 metrics SVG（每周自动更新）

### 5. 验证

访问 `https://fight-1.github.com/` 应该能看到完整的个人主页。

---

## 后续维护

- **修改内容**：改代码 → `git push` → 自动重新部署
- **Metrics 手动刷新**：仓库 → Actions → GitHub Metrics Dashboard → Run workflow
- **自定义域名**：如果有域名，在 Pages 设置中填写，然后加 CNAME 文件到 `public/` 目录

## 注意事项

- 所有 GitHub API 调用是客户端直连（无后端），无需 token
- 数据有 5 分钟 localStorage 缓存，减少 API 限流
- 粒子动画在移动端自动降级（减少粒子数）