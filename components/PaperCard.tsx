
import React from 'react';
import { FileItem, ProcessingState } from '../types';
import { 
  FileText, Loader2, CheckCircle, AlertCircle, Calendar, 
  Tag, Users, BookMarked, RefreshCw, ChevronRight, Hash
} from 'lucide-react';

interface PaperCardProps {
  item: FileItem;
  onRetry: () => void;
}

const PaperCard: React.FC<PaperCardProps> = ({ item, onRetry }) => {
  const isError = item.state === ProcessingState.ERROR;
  const isDone = item.state === ProcessingState.COMPLETED;
  const meta = item.metadata;

  return (
    <div className={`
      group glass-card relative rounded-2xl p-5 border-l-4 transition-all duration-300 hover:scale-[1.01]
      ${isError ? 'border-l-rose-500' : isDone ? 'border-l-emerald-500' : 'border-l-indigo-500/50'}
    `}>
      <div className="flex gap-5">
        
        {/* State Icon */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
            ${isError ? 'bg-rose-500/10 text-rose-400' : isDone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}
          `}>
            {item.state === ProcessingState.ANALYZING || item.state === ProcessingState.READING ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isDone ? (
              <CheckCircle className="w-6 h-6" />
            ) : isError ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <Hash className="w-5 h-5" />
            )}
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter text-slate-600 opacity-60">
            {item.state}
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h4 className="font-bold text-sm text-slate-100 truncate pr-4" title={isDone ? meta?.title : item.originalName}>
              {isDone ? meta?.title : item.originalName}
            </h4>
            {isError && (
              <button 
                onClick={onRetry}
                className="p-1.5 rounded-lg glass-inset text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

          {isError ? (
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
              <p className="text-[11px] text-rose-300/80 font-medium leading-relaxed italic">
                {item.error || '解析服务暂时不可用'}
              </p>
            </div>
          ) : isDone && meta ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <Users className="w-3.5 h-3.5 text-indigo-400/70" />
                  <span className="truncate">{meta.authorsFull.slice(0, 3).join(', ')}{meta.authorsFull.length > 3 && '...'}</span>
                  {meta.seniorAuthorFull && <span className="text-violet-400 font-bold ml-1">PI: {meta.seniorAuthorFull}</span>}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <BookMarked className="w-3.5 h-3.5 text-indigo-400/70" />
                  <span className="truncate font-bold italic">{meta.journal}</span>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end md:items-start gap-2">
                <div className="flex flex-wrap gap-2">
                   <span className="px-2 py-0.5 rounded-md glass-inset text-[10px] font-bold text-emerald-400 border border-emerald-500/10">
                     <Calendar className="w-3 h-3 inline mr-1 mb-0.5" /> {meta.year}
                   </span>
                   <span className="px-2 py-0.5 rounded-md glass-inset text-[10px] font-bold text-amber-400 border border-amber-500/10">
                     <Tag className="w-3 h-3 inline mr-1 mb-0.5" /> {meta.category}
                   </span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[10px] font-mono text-indigo-300 w-full group/fn">
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                  <span className="truncate">{meta.suggestedFilename}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500/50 animate-shimmer" style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] text-slate-500 font-bold animate-pulse tracking-widest uppercase">
                {item.state === ProcessingState.ANALYZING ? '正在提取元数据...' : 'PDF 读取中...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperCard;
