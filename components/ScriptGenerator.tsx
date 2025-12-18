
import React, { useState } from 'react';
import { FileItem, ProcessingState } from '../types';
// Add Info icon to the lucide-react imports
import { Download, FileCode, Copy, CheckCircle, Monitor, HardDrive, Info } from 'lucide-react';

interface ScriptGeneratorProps {
  files: FileItem[];
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ files }) => {
  const [osType, setOsType] = useState<'unix' | 'windows'>('unix');
  const [rootFolderName, setRootFolderName] = useState<string>('LocalScholarLibrary');
  const [copied, setCopied] = useState(false);

  const processed = files.filter(f => f.state === ProcessingState.COMPLETED && f.metadata);
  if (processed.length === 0) return null;

  const sanitize = (n: string) => n.replace(/[^\p{L}\p{N}_\-\s\.]/gu, '_').trim();

  const generate = () => {
    const root = sanitize(rootFolderName) || 'Library';
    if (osType === 'unix') {
      let s = `#!/bin/bash\n# Created by LocalScholar\n\nmkdir -p "${root}"\n`;
      processed.forEach(f => {
        const cat = sanitize(f.metadata!.category);
        const j = sanitize(f.metadata!.journal || 'Preprint');
        const dir = `${root}/${cat}/${j}`;
        s += `mkdir -p "${dir}"\n`;
        s += `mv "${f.originalName.replace(/(["$`\\])/g,'\\$1')}" "${dir}/${f.metadata!.suggestedFilename}"\n`;
      });
      return s;
    } else {
      let s = `@echo off\nchcp 65001 >nul\nif not exist "${root}" mkdir "${root}"\n`;
      processed.forEach(f => {
        const cat = sanitize(f.metadata!.category);
        const j = sanitize(f.metadata!.journal || 'Preprint');
        const dir = `${root}\\${cat}\\${j}`;
        s += `if not exist "${dir}" mkdir "${dir}"\nmove "${f.originalName}" "${dir}\\${f.metadata!.suggestedFilename}"\n`;
      });
      return s;
    }
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-8">
      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-lg">组织脚本生成器</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Deployment Script</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex glass-inset p-1 rounded-xl">
            {[
              { id: 'unix', label: 'macOS / Linux', icon: Monitor },
              { id: 'windows', label: 'Windows', icon: HardDrive }
            ].map(plat => (
              <button 
                key={plat.id}
                onClick={() => setOsType(plat.id as any)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${osType === plat.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <plat.icon className="w-3.5 h-3.5" /> {plat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">根目录名称 (Root Folder)</label>
              <input 
                type="text" value={rootFolderName} onChange={e => setRootFolderName(e.target.value)}
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-indigo-400 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
           </div>
           <div className="flex items-end">
              <button 
                onClick={() => {
                  const b = new Blob([generate()], { type: 'text/plain' });
                  const url = URL.createObjectURL(b);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = osType === 'unix' ? 'organize.sh' : 'organize.bat';
                  a.click();
                }}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" /> 导出并下载
              </button>
           </div>
        </div>

        <div className="relative group/code">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={() => { navigator.clipboard.writeText(generate()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="p-2.5 rounded-xl glass-inset hover:bg-white/10 text-slate-400 transition-all active:scale-95"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="bg-slate-950/80 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-indigo-300/80 max-h-48 overflow-y-auto custom-scrollbar border border-white/5">
            <pre>{generate()}</pre>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
             <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
             <div className="text-[10px] text-blue-300/60 leading-normal font-medium">
               <strong>运行建议：</strong> 将下载的脚本移动至 PDF 所在目录后运行。该操作仅移动文件，不会删除您的任何原始数据。
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;
