import React from 'react';
import { X, Book, FolderInput, FilePlus, Terminal } from 'lucide-react';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 space-y-6">
          <header className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Book className="w-6 h-6 text-indigo-400" />
              LocalScholar 使用指南
            </h2>
          </header>

          <div className="space-y-8 text-slate-300">
            {/* 1. 简介 */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-2">简介</h3>
              <p className="text-sm leading-relaxed">
                LocalScholar 是一个本地优先的文献管理工具。它读取 PDF 的首页文本，利用 AI 识别论文的标题、年份和领域，并生成一个简单的脚本（Windows 的 .bat 或 Mac/Linux 的 .sh）来帮您自动重命名和分类文件。
              </p>
            </section>

            {/* 2. 首次使用 */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FolderInput className="w-5 h-5 text-emerald-400" />
                首次整理（批量模式）
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm ml-2">
                <li>将您杂乱的 PDF 文件夹中的所有文件选中，拖入本网页。</li>
                <li>等待 AI 分析完成（进度条全绿）。</li>
                <li>在页面下方的“生成整理脚本”区域，确认目标文件夹名称（默认为 <code>OrganizedLibrary</code>）。</li>
                <li>下载脚本文件（<code>organize_papers.bat</code> 或 <code>.sh</code>）。</li>
                <li><strong>关键：</strong>将下载的脚本文件放到您存放 PDF 的目录下。</li>
                <li>双击运行脚本。您的文件将被移动到 <code>OrganizedLibrary/领域/年份/</code> 目录结构中。</li>
              </ol>
            </section>

            {/* 3. 增量更新 */}
            <section className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-indigo-400" />
                日常使用（增量模式）
              </h3>
              <p className="text-sm mb-3">
                当您下载了新的论文（例如 <code>paper.pdf</code>）并希望将其加入已整理好的资料库时：
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm ml-2">
                <li>仅将新下载的 <code>paper.pdf</code> 拖入本网页。</li>
                <li>AI 分析完成后，确保<strong>“目标文件夹名称”</strong>与您现有的资料库文件夹名称一致（例如 <code>OrganizedLibrary</code>）。</li>
                <li>下载脚本。</li>
                <li>将脚本和新论文放在同一目录下（通常是“下载”文件夹，或者您可以把新论文移到资料库旁边）。</li>
                <li>运行脚本。系统会自动将新论文移动并归档到现有的文件夹结构中，不会覆盖旧文件。</li>
              </ol>
            </section>

            {/* 4. 注意事项 */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-slate-400" />
                注意事项
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm ml-2 text-slate-400">
                <li><strong>隐私安全：</strong> PDF 文件本身不会上传，仅提取前两页的文本发送给 AI 进行元数据分析。</li>
                <li><strong>Mac/Linux 用户：</strong> 下载 <code>.sh</code> 脚本后，可能需要赋予执行权限。在终端运行：<code>chmod +x organize_papers.sh</code>。</li>
                <li><strong>撤销操作：</strong> 脚本是纯文本，您可以先用记事本打开查看具体命令，确保无误后再运行。</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;