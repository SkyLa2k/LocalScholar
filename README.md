
# LocalScholar 📚

LocalScholar is a privacy-first, AI-powered academic paper organizer. It helps researchers manage their cluttered PDF libraries by automatically extracting metadata, classifying papers, and generating organization scripts.

## ✨ Features

- **Local-First Privacy**: PDF text extraction happens entirely in your browser using `pdf.js`. No files are uploaded to any server.
- **AI-Driven Metadata**: Automatically identifies Title, Authors (with PI detection), Year, and Journal name.
- **Multi-Engine Support**: Connect to **Google Gemini**, **OpenAI**, **DeepSeek**, **Azure OpenAI**, or **Ollama (Local)**.
- **Smart Renaming**: Generates consistent filenames following the `Year_FirstAuthor_[PI]_Title.pdf` standard.
- **Automated Filing**: Generates `.sh` (macOS/Linux) or `.bat` (Windows) scripts to move and categorize files into folders like `Category/Journal/Year/`.

## 🚀 Quick Start

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/your-username/localscholar.git
   cd localscholar
   ```
2. **Install & Run**:
   ```bash
   npm install
   ```
3. **Environment Setup (Optional)**:
   Create a `.env` file for your own API keys to avoid entering them repeatedly in the UI:
   ```env
   API_KEY=your_gemini_api_key
   ```
4. **Launch**:
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Using Local Ollama
1. Open the **Settings** panel in the app.
2. Select **Ollama (Local)**.
3. Follow the CORS guide in the panel to restart Ollama with proper origins allowed.

### Azure OpenAI
Requires **Endpoint**, **Deployment Name**, and **API Version**.

## 🛡 Security & Privacy
This app is a client-side tool. If you use a cloud provider (like OpenAI or Gemini), only the extracted text snippets are sent to their APIs. 

**Warning for Contributors**: Never commit your `.env` file. Any API keys set during the build process will be bundled into the production JavaScript files.

## 📄 License
MIT License.
