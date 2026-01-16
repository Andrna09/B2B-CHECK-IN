import React, { useState } from 'react';
import { 
  Loader2, AlertCircle, Eye, EyeOff, ArrowLeft,
  ChevronRight, User, KeyRound, ShieldCheck, Lock
} from 'lucide-react';
import { loginSystem, verifyDivisionCredential } from '../services/dataService';
import { UserProfile, DivisionConfig } from '../types';

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess, onBack }) => {
  const [step, setStep] = useState<1 | 2>(1); 
  const [authenticatedDiv, setAuthenticatedDiv] = useState<DivisionConfig | null>(null);

  // Form Data
  const [inputID, setInputID] = useState('');
  const [inputPass, setInputPass] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDivisionLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulasi network delay
        
        // Panggil service yang sekarang throw error spesifik
        const divConfig = await verifyDivisionCredential(inputID, inputPass);

        if (divConfig) {
            setAuthenticatedDiv(divConfig);
            setStep(2);
            setInputID('');
            setInputPass('');
            setError(null);
        }
    } catch (err: any) {
        setError(err.message);
    }
    setLoading(false);
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      // Panggil service yang sekarang throw error spesifik
      const user = await loginSystem(inputID, inputPass);
      
      if (!authenticatedDiv) throw new Error("Sesi invalid.");
      if (user.role !== authenticatedDiv.role) {
          throw new Error(`User ${user.name} salah divisi.`);
      }
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Login gagal.");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
      if (step === 1) handleDivisionLogin(e);
      else handleUserLogin(e);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#FDF2F4] font-sans overflow-hidden">
      
      {/* --- BACKGROUND AMBIENCE (Sociolla Colors) --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#F4A8B6]/30 rounded-full blur-[80px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D46A83]/20 rounded-full blur-[80px] pointer-events-none animate-blob"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      {/* --- BACK BUTTON --- */}
      <button 
        onClick={step === 2 ? () => { setStep(1); setInputID(''); setInputPass(''); setError(null); } : onBack}
        className="fixed top-8 left-8 z-[50] group flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-md rounded-full border border-white/60 text-[#D46A83] font-bold text-xs hover:bg-white hover:shadow-lg transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {step === 2 ? 'GANTI DIVISI' : 'KEMBALI'}
      </button>

      {/* --- CENTER LAYOUT --- */}
      <div className="relative w-full max-w-[420px] px-4 flex flex-col items-center z-20">
        
        {/* LOGO AREA */}
        <div className="mb-8 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-xl shadow-pink-200 p-1.5 border border-white rotate-3 hover:rotate-0 transition-transform duration-500">
                 <img 
                    src="https://play-lh.googleusercontent.com/J0NYr2cNJmhQiGbDXJHOqa4o9WhPeqC4BGuaD-YKp28KxH1xoW83A3dJyQMsaNwpx0Pv" 
                    alt="Sociolla Logo" 
                    className="w-full h-full object-cover rounded-xl"
                 />
            </div>
        </div>

        {/* LOGIN CARD */}
        <div className="w-full bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-pink-200/50 p-8 pt-10 pb-10 border border-white/80 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            
            {/* Header Text */}
            <div className="text-center mb-8">
                 <h2 className="text-3xl font-serif font-bold text-[#2D2D2D] tracking-tight mb-2">
                    {step === 1 ? 'Division Access' : 'Staff Login'}
                 </h2>
                 <div className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D46A83]"></span>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {step === 1 ? 'Warehouse Gate V4.0' : authenticatedDiv?.name}
                    </p>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D46A83]"></span>
                 </div>
            </div>

            {/* Error Notification */}
            {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-pulse">
                    <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                    <span className="text-xs font-bold text-rose-600 leading-relaxed">{error}</span>
                </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* ID Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        {step === 1 ? 'Division ID' : 'Username'}
                    </label>
                    <div className="relative group transition-all duration-300">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <div className="p-2 bg-[#FDF2F4] rounded-xl group-focus-within:bg-pink-100 transition-colors">
                                {step === 1 
                                    ? <ShieldCheck className="h-5 w-5 text-[#D46A83]"/>
                                    : <User className="h-5 w-5 text-[#D46A83]"/>
                                }
                            </div>
                        </div>
                        <input
                            type="text"
                            value={inputID}
                            onChange={(e) => setInputID(e.target.value)}
                            className="block w-full pl-14 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-[#F4A8B6] focus:ring-4 focus:ring-pink-100 transition-all outline-none"
                            placeholder={step === 1 ? "e.g. SECURITY" : "e.g. budi"}
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        {step === 1 ? 'Shared Password' : 'Personal PIN'}
                    </label>
                    <div className="relative group transition-all duration-300">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <div className="p-2 bg-[#FDF2F4] rounded-xl group-focus-within:bg-pink-100 transition-colors">
                                <KeyRound className="h-5 w-5 text-[#D46A83]"/>
                            </div>
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={inputPass}
                            onChange={(e) => setInputPass(e.target.value)}
                            className="block w-full pl-14 pr-12 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-[#F4A8B6] focus:ring-4 focus:ring-pink-100 transition-all outline-none font-mono tracking-wider"
                            placeholder="••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center group/eye cursor-pointer"
                        >
                            {showPassword ? 
                                <EyeOff className="h-5 w-5 text-slate-300 group-hover/eye:text-[#D46A83] transition-colors" /> : 
                                <Eye className="h-5 w-5 text-slate-300 group-hover/eye:text-[#D46A83] transition-colors" />
                            }
                        </button>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-4 px-6 rounded-2xl shadow-xl shadow-pink-200 bg-gradient-to-r from-[#D46A83] to-[#F4A8B6] hover:from-[#c0566e] hover:to-[#e0909e] text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center group"
                >
                    {loading ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                        <div className="flex items-center gap-2 uppercase tracking-wide">
                            {step === 1 ? 'Verify Credential' : 'Access System'} 
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                        </div>
                    )}
                </button>
            </form>
        </div>

        {/* 3. QUICK ACCESS (Fix: Password disamakan dengan Database '1234') */}
        {step === 1 && (
            <div className="mt-8 flex justify-center gap-2 flex-wrap animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                {[
                    { id: 'SECURITY', pass: '1234', label: 'Field Ops' },
                    { id: 'ADMIN', pass: '1234', label: 'Traffic' },
                    { id: 'MANAGER', pass: '1234', label: 'System' }
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={() => { setInputID(item.id); setInputPass(item.pass); }}
                        className="px-3 py-1.5 bg-white/40 hover:bg-white rounded-lg border border-white text-[10px] font-bold text-slate-500 hover:text-[#D46A83] hover:scale-105 transition-all shadow-sm"
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        )}

      </div>
    </div>
  );
};
