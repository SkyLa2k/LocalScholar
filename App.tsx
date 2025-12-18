
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Upload, BrainCircuit, FolderOpen, Library, HelpCircle, AlertTriangle, 
  Play, RefreshCw, Settings as SettingsIcon, Sparkles, LayoutDashboard, 
  ShieldCheck, Zap, Layers, ChevronRight, FileText
} from 'lucide-react';
import { FileItem, ProcessingState, AppSettings } from './types';
import { extractTextFromPDF } from './services/pdfService';
import { analyzePaper } from './services/llmService'; 
import PaperCard from './components/PaperCard';
import ScriptGenerator from './components/ScriptGenerator';
import UserGuide from './components/UserGuide';
import SettingsPanel from './components/SettingsPanel';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false); 

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('localscholar_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { provider: 'google', apiKey: '', baseUrl: '', model: 'gemini-3-flash-preview', apiVersion: '2024-02-15-preview' };
  });

  useEffect(() => {
    localStorage.setItem('localscholar_settings', JSON.stringify(settings));
  }, [settings]);

  const [categories, setCategories] = useState<string[]>(['Artificial Intelligence', 'Computer Science', 'Physics', 'Biology']);

  const handleFiles = useCallback(async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;
    const newFiles: FileItem[] = Array.from(uploadedFiles)
      .filter(f => f.type === 'application/pdf')
      .map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        originalName: f.name,
        state: ProcessingState.QUEUED
      }));
    setFiles(prev => [...prev, ...newFiles]);
    setIsPaused(false); 
  }, []);

  useEffect(() => {
    const processNext = async () => {
      if (isPaused) return;
      const active = files.filter(f => f.state === ProcessingState.READING || f.state === ProcessingState.ANALYZING).length;
      if (active < 2) { // 保持适度的并发
        const next = files.find(f => f.state === ProcessingState.QUEUED);
        if (next) await processItem(next);
      }
    };
    processNext();
  }, [files, isPaused]);

  const processItem = async (item: FileItem) => {
    updateFileState(item.id, ProcessingState.READING);
    try {
      const text = await extractTextFromPDF(item.file, 1000000); // 1M chars is enough for logic
      updateFileState(item.id, ProcessingState.ANALYZING);
      const meta = await analyzePaper(text, categories, settings);
      if (meta.category && !categories.includes(meta.category)) {
        setCategories(prev => [...prev, meta.category]);
      }
      updateFileState(item.id, ProcessingState.COMPLETED, { metadata: meta });
    } catch (error: any) {
      console.error(error);
      const isQuota = error.message?.includes('429');
      if (isQuota) setIsPaused(true);
      updateFileState(item.id, ProcessingState.ERROR, { error: error.message || "分析链路异常" });
    }
  };

  const updateFileState = (id: string, state: ProcessingState, updates: Partial<FileItem> = {}) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, state, ...updates } : f));
  };

  const stats = useMemo(() => {
    const completed = files.filter(f => f.state === ProcessingState.COMPLETED).length;
    const errors = files.filter(f => f.state === ProcessingState.ERROR).length;
    const processing = files.filter(f => f.state === ProcessingState.ANALYZING || f.state === ProcessingState.READING).length;
    return { completed, errors, processing, total: files.length };
  }, [files]);

  return (
    <div className="min-h-screen">
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} />
      <UserGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Top Navigation / Branding */}
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Library className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                LocalScholar
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">Beta</span>
              </h1>
              <p className="text-slate-500 text-xs font-medium">科研文献自动化治理中心</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 rounded-xl glass-card hover:bg-white/5 transition-all text-slate-400 hover:text-white"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="px-5 py-2.5 rounded-xl btn-primary text-white text-sm font-bold flex items-center gap-2 shadow-xl shadow-indigo-600/10"
            >
              <HelpCircle className="w-4 h-4" /> 使用指南
            </button>
          </div>
        </nav>

        {/* Dynamic Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '待理文献', val: stats.total, icon: FileText, color: 'text-blue-400' },
            { label: '整理完成', val: stats.completed, icon: Zap, color: 'text-emerald-400' },
            { label: '分析中', val: stats.processing, icon: RefreshCw, color: 'text-indigo-400', spin: stats.processing > 0 },
            { label: '异常项', val: stats.errors, icon: AlertTriangle, color: 'text-rose-400' },
          ].map((item, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-4 group">
              <div className={`p-3 rounded-xl glass-inset ${item.color}`}>
                <item.icon className={`w-5 h-5 ${item.spin ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                <p className="text-xl font-extrabold text-white">{item.val}</p>
              </div>
            </div>
          ))}
        </section>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Dropzone & Context */}
          <div className="lg:col-span-4 space-y-6">
            <div 
              className={`
                relative h-80 rounded-3xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden
                ${isDragging ? 'border-indigo-400 bg-indigo-500/10 scale-95' : 'border-white/10 glass-card hover:border-white/20'}
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => document.getElementById('drop-input')?.click()}
            >
              <input id="drop-input" type="file" multiple accept=".pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              
              <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-white/5 relative z-10 shadow-inner shadow-white/5">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>
              
              <div className="text-center z-10 px-8">
                <h3 className="text-lg font-bold text-white">批量拖入 PDF</h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium">
                  由 {settings.provider === 'ollama' ? '本地 Ollama' : '云端 AI'} 提供语义分析支持
                </p>
              </div>

              {/* Decorative Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[100px] pointer-events-none rounded-full" />
            </div>

            {/* Feature Cards */}
            <div className="glass-card rounded-3xl p-6 space-y-6">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-amber-400" /> 核心优势
               </h4>
               <div className="space-y-4">
                  {[
                    { icon: ShieldCheck, title: "隐私至上", desc: "本地解析，仅发送摘要分析" },
                    { icon: Zap, title: "深度索引", desc: "自动识别 DOI、年份与顶级期刊" },
                    { icon: Layers, title: "结构化整理", desc: "生成分类目录，告别命名混乱" }
                  ].map((feat, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-lg glass-inset flex items-center justify-center">
                        <feat.icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{feat.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Right Column: Queue & Output */}
          <div className="lg:col-span-8 space-y-8">
            {files.length === 0 ? (
              <div className="glass-card rounded-3xl h-[500px] flex flex-col items-center justify-center text-center p-12 border-dashed border-white/5">
                <div className="w-24 h-24 rounded-3xl glass-inset flex items-center justify-center mb-6 opacity-40">
                  <FolderOpen className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-300">准备好开始了吗？</h3>
                <p className="text-slate-500 text-sm mt-3 max-w-sm font-medium">
                  将您的 Arxiv 论文、会议报告或学术期刊拖入左侧区域，我们将为您自动整理命名。
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-xl font-bold text-white tracking-tight">处理队列</h2>
                  </div>
                  <button 
                    onClick={() => setFiles([])}
                    className="text-[10px] font-bold text-slate-500 hover:text-rose-400 uppercase tracking-widest transition-colors"
                  >
                    重置列表
                  </button>
                </div>

                <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {files.map(file => (
                    <PaperCard key={file.id} item={file} onRetry={() => updateFileState(file.id, ProcessingState.QUEUED)} />
                  ))}
                </div>

                {stats.completed > 0 && (
                   <ScriptGenerator files={files} />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
