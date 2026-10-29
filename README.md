# Litong (Tony) Xing — personal website

个人网站提供英语、简体中文和法语三个完整版本。打开 `index.html` 即可查看，无需安装依赖或运行构建服务。`projects/` 是六个研究项目的详情页，`assets/documents/litong-xing-resume.pdf` 是用户指定的原始简历 PDF，保留其版式与内容。

## 内容与素材

正文来自用户提供的学生简历；NHSJS 的公开文章页面已核对作者和标题。其他经历与奖项依据学生简历整理，尚未独立核验证书。没有把缺失的论文附件、项目代码、头像、照片或视频做成无效链接，也没有虚构研究结论或个人反思。插画沿用课堂模板，与真实项目数据无关。

后续可补充：本人头像、项目截图、研究论文/海报、活动照片、演出或体育视频。新增文件后让 Codex 更新对应页面即可。未使用的批量下载素材和压缩包保留在本地，不随网站源码提交。

## 主要文件

- `index.html`：个人简介、头像、精选研究、荣誉摘要及各个独立页面的入口。
- `research.html`、`experience.html`、`community.html`、`honors.html`、`contact.html`：研究、经历、社区活动、荣誉及联系页面。
- `publication.html`、`beyond.html`、`athletics.html`：论文、课外兴趣及羽毛球照片页面。
- `projects/*.html`：项目详情页。
- `styles.css`：课堂模板基础样式与本人的页面调整。
- `script.js`：页面过渡、移动端菜单、阅读进度、文档预览、复制邮箱及旧章节链接跳转。
- `language-preference.js`：记住所选语言，并在打开英文入口时转到对应语言页面。
- `assets/previews/`：公开 PDF 的首页预览图片；完整文档仍可单独打开或下载。

## 多语言维护

英语页面位于根目录和 `projects/`，是内容源文件。`zh/` 和 `fr/` 各含 15 个对应页面，由 `tools/build-localizations.py` 和 `i18n/translations.json` 生成。语言选择器保留当前页面和章节，站内链接保持所选语言。三种版本都有独立的页面标题、说明、图片替代文本与语言元数据，无需浏览器翻译服务。

修改英文内容时，同时更新翻译目录，再运行：

```sh
python3 tools/build-localizations.py
python3 tools/build-localizations.py --check
node tools/check.mjs
node tools/check-language-preference.mjs
```

生成器遇到缺失译文会直接报错，避免发布夹杂英文的半成品页面。请勿直接编辑生成的 `zh/` 或 `fr/` 页面。原始论文、海报、简历 PDF 和研究图表保留原文；中文及法语的 PDF 链接注明英文来源。

## 本地预览

在项目目录运行 `python3 -m http.server 8000 --bind 127.0.0.1`，然后打开 `http://127.0.0.1:8000/`。本地修改不会自动推送到 GitHub。

## 发布

代码仓库：`git@github.com:litongxing11/litongxing11.github.io.git`。

网站文件位于仓库根目录，无需构建。在 GitHub 仓库的 Settings → Pages 中，选择 Deploy from a branch、`main` 和 `/(root)`，保存后由 GitHub Pages 发布。默认网址为 `https://litongxing11.github.io/`。

推送源码和 Pages 发布是两个步骤；实际部署状态以 GitHub 页面为准。简历文件已按用户 2026 年 10 月 28 日的明确要求替换为其提供的原始 PDF；未经请求不重新生成或删改内容。
