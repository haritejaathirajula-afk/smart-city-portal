import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Wifi, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Zap, 
  Smartphone, 
  Laptop,
  Copy,
  Check
} from 'lucide-react';
import { 
  getEffectiveApiUrl, 
  getSavedCustomApiUrl, 
  saveCustomApiUrl, 
  clearCustomApiUrl, 
  testApiConnection, 
  isNativeMobileApp 
} from '../../services/api';

export default function ServerConfigModal({ isOpen, onClose, onConfigSaved }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [candidateUrl, setCandidateUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | { success: bool, message: string, latencyMs?: number }
  const [copied, setCopied] = useState(false);
  const isMobile = isNativeMobileApp();

  useEffect(() => {
    if (isOpen) {
      const effective = getEffectiveApiUrl();
      const custom = getSavedCustomApiUrl();
      setCurrentUrl(effective);
      setCandidateUrl(custom || effective);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testApiConnection(candidateUrl);
      const healthData = result.data?.data;
      setTestResult({
        success: true,
        message: `Connected successfully! Latency: ${result.latencyMs}ms`,
        latencyMs: result.latencyMs,
        health: healthData,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Connection failed. Check network or tunnel URL.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveCustomApiUrl(candidateUrl);
    setCurrentUrl(getEffectiveApiUrl());
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const handleReset = () => {
    clearCustomApiUrl();
    const defaultUrl = getEffectiveApiUrl();
    setCandidateUrl(defaultUrl);
    setCurrentUrl(defaultUrl);
    setTestResult(null);
    if (onConfigSaved) onConfigSaved();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-civic-500/20 border border-civic-500/40 flex items-center justify-center text-civic-400">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Network & Server Settings
              </h3>
              <p className="text-xs text-slate-400">
                Connect seamlessly across mobile data (4G/5G), Wi-Fi, or remote networks
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Active Status Box */}
          <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">Active Server Endpoint</span>
              <span className={`px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                isMobile 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isMobile ? <Smartphone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
                {isMobile ? 'Mobile App (Capacitor)' : 'Web Browser'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs text-slate-200">
              <span className="truncate">{currentUrl}</span>
              <button 
                onClick={() => copyToClipboard(currentUrl)} 
                title="Copy URL" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Candidate URL Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Backend Server / Tunnel URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={candidateUrl}
                onChange={(e) => setCandidateUrl(e.target.value)}
                placeholder="https://xxxx.loca.lt/api or http://192.168.x.x:5000/api"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-civic-500/50 focus:border-civic-500"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Tip: When using <code className="text-civic-400 font-mono">npm run tunnel</code>, paste the generated HTTPS URL here.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCandidateUrl('http://localhost:5000/api')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Localhost (Port 5000)
              </button>
              <button
                type="button"
                onClick={() => setCandidateUrl('http://10.0.2.2:5000/api')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Android Emulator (10.0.2.2)
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Auto-Detect Default
              </button>
            </div>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
              testResult.success 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}>
              <div className="flex items-start gap-2.5">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <span className="font-semibold block">{testResult.message}</span>
                </div>
              </div>

              {testResult.health && (
                <div className="mt-2 pt-2 border-t border-emerald-800/40 grid grid-cols-2 gap-2 text-[11px] font-mono text-emerald-200">
                  <div className="bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/30">
                    <span className="text-emerald-400 block font-sans font-medium text-[10px]">MySQL Database</span>
                    <strong className="text-white text-xs">
                      {testResult.health.database?.connected ? 'Online (MySQL 8)' : 'Disconnected'}
                    </strong>
                    <div className="text-[10px] text-emerald-300/80 truncate">
                      {testResult.health.database?.details?.database || 'smart_city_db'}
                    </div>
                  </div>
                  <div className="bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/30">
                    <span className="text-emerald-400 block font-sans font-medium text-[10px]">Backend Server</span>
                    <strong className="text-white text-xs">Uptime: {testResult.health.uptime}</strong>
                    <div className="text-[10px] text-emerald-300/80">
                      RAM: {testResult.health.memory?.used} / {testResult.health.memory?.total}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Network Scenarios Advice */}
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-civic-400" />
              How to connect across ANY network:
            </div>
            <div>
              <strong className="text-slate-300">1. Any Network (Mobile Data 4G/5G, Remote):</strong> Launch tunnel via <code className="text-civic-400 font-mono">npm run tunnel</code> on laptop, then open the HTTPS URL in mobile browser or paste it above.
            </div>
            <div>
              <strong className="text-slate-300">2. Same Wi-Fi:</strong> Connect phone to your laptop's Wi-Fi IP (e.g. <code className="text-civic-400 font-mono">http://192.168.x.x:5000/api</code>).
            </div>
            <div>
              <strong className="text-slate-300">3. Laptop Browser:</strong> Automatically routes to local backend or tunnel with zero configuration.
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !candidateUrl}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-civic-600 hover:bg-civic-500 text-white text-xs font-semibold shadow-lg shadow-civic-600/30 flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
