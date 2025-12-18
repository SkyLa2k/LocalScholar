
# LocalScholar 📚 | 智能科研论文管家

LocalScholar 是一款专注于隐私保护、由 AI 驱动的学术论文整理工具。它通过自动提取元数据、智能分类和生成整理脚本，帮助研究人员将混乱的 PDF 文献库治理得井井有条。

## ✨ 核心特性

- **本地优先隐私策略**：PDF 文本提取完全在浏览器内通过 `pdf.js` 完成，**文件不会上传到任何服务器**。
- **AI 驱动元数据提取**：自动识别标题、作者（支持识别通讯作者/PI）、年份及期刊名称。
- **多引擎支持**：支持连接 **Google Gemini**, **OpenAI**, **DeepSeek**, **Azure OpenAI** 或 **Ollama (本地私有化模型)**。
- **标准化重命名**：自动生成遵循 `年份_第一作者_[通讯作者]_标题.pdf` 规范的文件名。
- **自动化归档**：一键生成 `.sh` (macOS/Linux) 或 `.bat` (Windows) 整理脚本，按照 `分类/期刊/年份/` 结构自动移动文件。

## 🚀 快速开始

1. **克隆仓库**：
   ```bash
   git clone https://github.com/your-username/localscholar.git
   cd localscholar
   ```
2. **安装并运行**：
   ```bash
   npm install
   npm run dev
   ```
3. **环境变量配置（可选）**：
   如果你不想每次都在 UI 中输入 Key，可以创建 `.env` 文件：
   ```env
   API_KEY=你的Gemini密钥
   ```

## ⚙️ 配置指引

### 使用本地 Ollama
1. 在设置面板选择 **Ollama (Local)**。
2. 按照面板中的“跨域许可引导”重启 Ollama（需要设置 `OLLAMA_ORIGINS` 环境变量）。

### Azure OpenAI 配置
Azure 用户需要额外配置：**终结点 (Endpoint)**、**部署名称 (Deployment Name)** 以及 **API 版本 (API Version)**。

## 🛡 安全与隐私说明

本应用是一个纯前端工具。如果你选择使用云端供应商（如 OpenAI 或 Gemini），应用仅会将提取到的文本摘要发送至其接口。

**开源安全提醒**：
*   切勿提交包含密钥的 `.env` 文件。
*   在构建（Build）过程中设置的环境变量会被静态注入到 JS 代码中。如果你打算发布在线版本，请确保构建环境不包含你的私有密钥。

## 📄 开源协议
MIT License.
