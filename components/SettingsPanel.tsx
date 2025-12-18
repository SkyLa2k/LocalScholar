
import React, { useState, useEffect } from 'react';
import { 
  X, Key, CheckCircle, AlertCircle, Cpu, Save, Globe, Server, 
  RefreshCw, Terminal, Code, Copy, Info, AlertTriangle, ShieldCheck,
  Settings as SettingsIcon, Layers, Radio
} from 'lucide-react';
import { AppSettings, LLMProvider } from '../types';
import { getAvailableModels, analyzePaper } from '../services/llmService';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const PROVIDERS: { id: LLMProvider; name: string; defaultBaseUrl: string; desc: string }[] = [
  { id: 'google', name: 'Google Gemini', defaultBaseUrl: '', desc: '高性能云端多模态模型' },
  { id: 'ollama', name: 'Ollama (Local)', defaultBaseUrl: 'http://127.0.0.1:11434', desc: '本地私有化部署，隐私首选' },
  { id: 'openai', name: 'OpenAI', defaultBaseUrl: 'https://api.openai.com/v1', desc: '行业标准大模型服务' },
  { id: 'deepseek', name: 'DeepSeek', defaultBaseUrl: 'https://api.deepseek.com', desc: '高性价比国产领先模型' },
  { id: 'azure', name: 'Azure OpenAI', defaultBaseUrl: '', desc: '企业级实例 (需要终结点)' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [provider, setProvider] = useState<LLMProvider>(settings.provider);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [apiVersion, setApiVersion] = useState(settings.apiVersion || '2024-02-15-preview');
  const [model, setModel] = useState(settings.model);
  const [azureCustomHeaders, setAzureCustomHeaders] = useState(settings.azureCustomHeaders || '');
  
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const currentOrigin = window.location.origin;

  // 当供应商切换时，重置状态，防止配置污染
  useEffect(() => {
    setAvailableModels([]);
    setStatus('idle');
    setErrorMsg('');
    
    // 如果切换到了新供应商，且之前的模型 ID 看起来不属于新供应商，则清空
    const isGeminiModel = model.toLowerCase().includes('gemini');
    const isGPTModel = model.toLowerCase().includes('gpt');
    
    if (provider === 'google' && !isGeminiModel) setModel('gemini-3-flash-preview');
    if (provider === 'openai' && !isGPTModel) setModel('gpt-4o-mini');
    if (provider === 'ollama') setModel('');
  }, [provider]);

  useEffect(() => {
    if (isOpen) {
      setProvider(settings.provider);
      setApiKey(settings.apiKey);
      setBaseUrl(settings.baseUrl);
      setApiVersion(settings.apiVersion || '2024-02-15-preview');
      setModel(settings.model);
      setAzureCustomHeaders(settings.azureCustomHeaders || '');
    }
  }, [isOpen, settings]);

  const fetchModels = async () => {
    setIsLoadingModels(true);
    setErrorMsg('');
    try {
        const temp: AppSettings = { provider, apiKey, baseUrl, apiVersion, model: '', azureCustomHeaders };
        const models = await getAvailableModels(temp);
        setAvailableModels(models);
        if (models.length > 0 && !models.includes(model)) setModel(models[0]);
    } catch (e: any) {
        setErrorMsg(e.message || "无法拉取模型列表。请检查 API Key 或地址连通性。");
    } finally {
        setIsLoadingModels(false);
    }
  };

  const handleTest = async () => {
    setStatus('validating');
    setErrorMsg('');
    try {
      const temp: AppSettings = { provider, apiKey, baseUrl, apiVersion, model, azureCustomHeaders };
      await analyzePaper("Handshake test", [], temp);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || "连接测试失败。");
    }
  };

  const copy = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
      <div className="glass-card rounded-[40px] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden border-white/10">
        
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/[0.03] to-transparent">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
               <SettingsIcon className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-white tracking-tight">服务引擎配置</h2>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Engine Configuration</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-all hover:rotate-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar">
          
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Radio className="w-3 h-3" /> 服务供应商
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PROVIDERS.map(p => (
                    <button
                        key={p.id}
                        onClick={() => { 
                          setProvider(p.id); 
                          setBaseUrl(p.defaultBaseUrl);
                        }}
                        className={`group relative px-4 py-3 rounded-2xl text-left transition-all border ${
                            provider === p.id 
                            ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                            : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'
                        }`}
                    >
                        <p className={`text-xs font-bold ${provider === p.id ? 'text-indigo-400' : 'text-slate-300'}`}>{p.name}</p>
                        <p className="text-[9px] mt-1 opacity-60 leading-tight">{p.desc}</p>
                    </button>
                ))}
            </div>
          </div>

          {/* Ollama 跨域许可专用引导 */}
          {provider === 'ollama' && (
            <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-[24px] space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-tight">
                <ShieldCheck className="w-4 h-4" /> 跨域许可引导 (CORS Setup)
              </div>
              <p className="text-[11px] text-amber-200/60 leading-relaxed font-medium">
                由于浏览器安全策略，您必须手动许可当前地址 <strong>{currentOrigin}</strong> 访问 Ollama 服务。请<strong>完全退出</strong>并按照以下方式重启 Ollama：
              </p>

              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] text-slate-500 font-mono">Windows (PowerShell)</span>
                    <button onClick={() => copy(`$env:OLLAMA_ORIGINS="${currentOrigin}"; ollama serve`, 'win')} className="text-[9px] text-indigo-400 font-bold hover:underline">
                      {copyFeedback === 'win' ? '已复制' : '复制命令'}
                    </button>
                  </div>
                  <code className="block bg-black/40 p-3 rounded-xl border border-white/5 text-[10px] text-emerald-400 font-mono leading-tight overflow-x-auto">
                    $env:OLLAMA_ORIGINS="{currentOrigin}"; ollama serve
                  </code>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] text-slate-500 font-mono">macOS / Linux (Terminal)</span>
                    <button onClick={() => copy(`OLLAMA_ORIGINS="${currentOrigin}" ollama serve`, 'mac')} className="text-[9px] text-indigo-400 font-bold hover:underline">
                      {copyFeedback === 'mac' ? '已复制' : '复制命令'}
                    </button>
                  </div>
                  <code className="block bg-black/40 p-3 rounded-xl border border-white/5 text-[10px] text-emerald-400 font-mono leading-tight overflow-x-auto">
                    OLLAMA_ORIGINS="{currentOrigin}" ollama serve
                  </code>
                </div>

                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
                   <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-red-300/80 leading-snug">
                     提示：若报错 "Only one usage of each socket address is normally permitted"，请先在系统托盘彻底 Quit Ollama。
                   </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6">
            {provider !== 'google' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                  {provider === 'azure' ? '终结点 (Endpoint)' : '服务基地址 (Base URL)'}
                </label>
                <input 
                    type="text" value={baseUrl} 
                    onChange={(e) => { setBaseUrl(e.target.value); setStatus('idle'); }}
                    placeholder={provider === 'azure' ? "https://your-resource.openai.azure.com/" : "http://127.0.0.1:11434"}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
            )}

            {provider === 'azure' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">API 版本 (Version)</label>
                <input 
                    type="text" value={apiVersion} 
                    onChange={(e) => { setApiVersion(e.target.value); setStatus('idle'); }}
                    placeholder="2024-02-15-preview"
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
              </div>
            )}

            {provider !== 'ollama' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">API 密钥 (API Key)</label>
                <input 
                  type="password" value={apiKey} 
                  onChange={(e) => { setApiKey(e.target.value); setStatus('idle'); }}
                  placeholder="留空则尝试使用系统环境变量..."
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {provider === 'azure' ? '部署名称 (Deployment)' : '模型 ID'}
                  </label>
                  <button onClick={fetchModels} disabled={isLoadingModels} className="text-[10px] text-indigo-400 font-bold flex items-center gap-1.5 hover:underline">
                    <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} /> 同步列表
                  </button>
              </div>
              <div className="relative">
                {availableModels.length > 0 ? (
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white outline-none appearance-none cursor-pointer">
                        {availableModels.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
                    </select>
                ) : (
                    <input 
                      type="text" value={model} onChange={(e) => setModel(e.target.value)} 
                      placeholder={provider === 'google' ? "例如: gemini-3-flash-preview" : "例如: gpt-4o"} 
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    />
                )}
                {availableModels.length > 0 && <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />}
              </div>
            </div>
          </div>

          <div className="min-h-[60px]">
            {status === 'success' && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-bold animate-in fade-in">
                <CheckCircle className="w-4 h-4" /> 连通测试通过！
              </div>
            )}
            {(status === 'error' || errorMsg) && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-400 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed break-all">{errorMsg || "配置错误，请检查。"}</span>
              </div>
            )}
          </div>

        </div>

        <div className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
            <button 
              onClick={handleTest} 
              disabled={status === 'validating'}
              className="flex-1 py-4 rounded-2xl glass-inset text-slate-300 text-sm font-bold hover:bg-white/5"
            >
              {status === 'validating' ? '正在测试...' : '测试连通性'}
            </button>
            <button 
              onClick={() => { 
                onSave({ provider, apiKey, baseUrl, apiVersion, model, azureCustomHeaders }); 
                onClose(); 
              }}
              className="flex-1 py-4 rounded-2xl btn-primary text-white text-sm font-black shadow-lg"
            >
              保存并应用
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
