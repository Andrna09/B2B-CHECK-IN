import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, Truck, Smartphone, QrCode, 
  Megaphone, LogOut, ArrowLeft, ArrowRight,
  Activity, Users, Server, Database, Lock
} from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
  onBack: () => void;
}

const SystemOverview: React.FC<Props> = ({ onNavigate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'SECURITY' | 'ADMIN'>('SECURITY');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Shared Glass Card Style (Reused for consistency)
  const glassCardStyle = "relative bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-2xl shadow-pink-100/50 overflow-hidden transition-all duration-500 hover:bg-white/40";
  const glossyShine = "absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/50 to-transparent pointer-events-none opacity-60";

  return (
    <div className="min-h-screen bg-[#FDF2F4] font-sans text-[#2D2D2D] overflow-x-hidden relative selection:bg-[#F4A8B6] selection:text-white pb-20">
      
      {/* --- BACKGROUND AMBIENCE (Sama seperti Login Page) --- */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#F4A8B6]/30 rounded-full blur-[100px] animate-blob pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#D46A83]/10 rounded-full blur-[120px] animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light"></div>

      {/* --- UNIFORM BACK BUTTON (Fixed Top-Left, Updated to Solid) --- */}
      <button 
        onClick={onBack}
        className="fixed top-6 left-6 md:top-8 md:left-8 z-[100] group flex items-center gap-3 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-full border border-white/50 text-slate-600 font-bold tracking-wide hover:bg-white hover:text-[#D46A83] hover:scale-105 transition-all shadow-xl shadow-pink-100/50"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="uppercase text-xs tracking-widest hidden md:inline">Back to Home</span>
      </button>

      {/* --- HEADER --- */}
      <div className="relative pt-24 px-6 z-10 max-w-7xl mx-auto mb-12">
        <div className={`transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#D46A83] to-[#F4A8B6] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-200 mb-6">
                <Server className="w-3 h-3" /> System Architecture v4.0
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-[#2D2D2D] leading-tight mb-4">
                Sociolla <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D46A83] to-purple-500 font-sans">Warehouse</span><br/>
                Ecosystem.
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl font-medium leading-relaxed">
                Platform orkestrasi logistik yang menggabungkan keamanan fisik dan manajemen antrian digital dalam satu dashboard transparan.
            </p>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT COL: ROLE TOGGLE & DETAIL (7 Columns) */}
              <div className="lg:col-span-7 space-y-8">
                  
                  {/* Toggle Pills */}
                  <div className="flex p-1.5 bg-white/30 backdrop-blur-xl border border-white/50 rounded-full w-fit shadow-sm">
                      <button 
                        onClick={() => setActiveTab('SECURITY')}
                        className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2
                            ${activeTab === 'SECURITY' ? 'bg-[#D46A83] text-white shadow-lg' : 'text-slate-500 hover:text-[#D46A83]'}`}
                      >
                          <ShieldCheck className="w-4 h-4"/> Field Ops
                      </button>
                      <button 
                        onClick={() => setActiveTab('ADMIN')}
                        className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2
                            ${activeTab === 'ADMIN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
                      >
                          <LayoutDashboard className="w-4 h-4"/> Admin Ops
                      </button>
                  </div>

                  {/* MAIN GLASS CARD (DYNAMIC CONTENT) */}
                  <div className={`${glassCardStyle} min-h-[500px] p-8 md:p-12 flex flex-col justify-between group`}>
                      <div className={glossyShine}></div>
                      
                      {/* Content Security */}
                      <div className={`transition-all duration-500 absolute inset-0 p-8 md:p-12 flex flex-col justify-between ${activeTab === 'SECURITY' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
                           <div>
                               <div className="w-20 h-20 bg-gradient-to-br from-[#D46A83] to-[#F4A8B6] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-pink-200 mb-8 border-4 border-white/20">
                                   <ShieldCheck className="w-10 h-10" />
                               </div>
                               <h2 className="text-4xl font-serif font-bold text-[#2D2D2D] mb-2">Security Gatekeeper</h2>
                               <p className="text-[#D46A83] font-bold text-xs uppercase tracking-widest mb-6">Physical Validation Layer</p>
                               <p className="text-slate-600 text-lg leading-relaxed mb-8">
                                   Modul keamanan yang didesain untuk penggunaan mobile di lapangan. Memungkinkan petugas memvalidasi kedatangan driver via QR Code dan mencocokkan dokumen fisik (Surat Jalan) dengan data digital.
                               </p>

                               <div className="grid grid-cols-2 gap-4">
                                   <div className="p-4 bg-white/40 rounded-2xl border border-white/50">
                                       <QrCode className="w-6 h-6 text-[#D46A83] mb-2"/>
                                       <div className="font-bold text-slate-800">QR Scanning</div>
                                       <div className="text-xs text-slate-500">Instant Check-in</div>
                                   </div>
                                   <div className="p-4 bg-white/40 rounded-2xl border border-white/50">
                                       <Lock className="w-6 h-6 text-[#D46A83] mb-2"/>
                                       <div className="font-bold text-slate-800">Access Control</div>
                                       <div className="text-xs text-slate-500">Validasi Masuk/Keluar</div>
                                   </div>
                               </div>
                           </div>
                           <button onClick={() => onNavigate('login')} className="mt-8 w-full py-4 bg-[#D46A83] hover:bg-[#c0566e] text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition-all">
                               Access Security Login
                           </button>
                      </div>

                      {/* Content Admin */}
                      <div className={`transition-all duration-500 absolute inset-0 p-8 md:p-12 flex flex-col justify-between ${activeTab === 'ADMIN' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                           <div>
                               <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-8 border-4 border-white/20">
                                   <LayoutDashboard className="w-10 h-10" />
                               </div>
                               <h2 className="text-4xl font-serif font-bold text-[#2D2D2D] mb-2">Traffic Control Tower</h2>
                               <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mb-6">Operational Management Layer</p>
                               <p className="text-slate-600 text-lg leading-relaxed mb-8">
                                   Pusat komando untuk Admin Gudang. Mengatur alokasi Loading Dock, memanggil antrian via WhatsApp/Display, dan memantau KPI bongkar muat secara real-time.
                               </p>

                               <div className="grid grid-cols-2 gap-4">
                                   <div className="p-4 bg-white/40 rounded-2xl border border-white/50">
                                       <Megaphone className="w-6 h-6 text-indigo-600 mb-2"/>
                                       <div className="font-bold text-slate-800">Queue Calling</div>
                                       <div className="text-xs text-slate-500">Panggilan Otomatis</div>
                                   </div>
                                   <div className="p-4 bg-white/40 rounded-2xl border border-white/50">
                                       <Activity className="w-6 h-6 text-indigo-600 mb-2"/>
                                       <div className="font-bold text-slate-800">KPI Monitoring</div>
                                       <div className="text-xs text-slate-500">Durasi Bongkar Muat</div>
                                   </div>
                               </div>
                           </div>
                           <button onClick={() => onNavigate('login')} className="mt-8 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all">
                               Access Admin Login
                           </button>
                      </div>

                  </div>
              </div>

              {/* RIGHT COL: WORKFLOW TIMELINE (5 Columns) */}
              <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-[#D46A83] animate-pulse"></div>
                      <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Workflow Alur Data</h3>
                  </div>

                  {[
                      { step: '01', title: 'Self Check-In', desc: 'Driver scan QR / Input data mandiri di lokasi.', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                      { step: '02', title: 'Security Validation', desc: 'Pengecekan fisik kendaraan & surat jalan di gerbang.', icon: ShieldCheck, color: 'text-pink-600', bg: 'bg-pink-100' },
                      { step: '03', title: 'Virtual Waiting Room', desc: 'Sistem mengurutkan antrian berdasarkan prioritas.', icon: Database, color: 'text-slate-600', bg: 'bg-slate-100' },
                      { step: '04', title: 'Dock Assignment', desc: 'Admin memanggil driver ke Gate/Dock spesifik.', icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                      { step: '05', title: 'Checkout & Exit', desc: 'Validasi keluar dan pencatatan durasi selesai.', icon: LogOut, color: 'text-orange-600', bg: 'bg-orange-100' }
                  ].map((item, idx) => (
                      <div key={idx} className={`${glassCardStyle} p-4 flex items-center gap-4 group hover:scale-[1.02] hover:-translate-y-1`}>
                           <div className={glossyShine}></div>
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm shrink-0 ${item.bg} ${item.color}`}>
                               {item.step}
                           </div>
                           <div>
                               <h4 className="font-serif font-bold text-lg text-slate-800 leading-none mb-1 group-hover:text-[#D46A83] transition-colors">{item.title}</h4>
                               <p className="text-xs text-slate-500 font-medium leading-tight">{item.desc}</p>
                           </div>
                      </div>
                  ))}

                  {/* Tech Stack Badge */}
                  <div className="mt-8 pt-6 border-t border-white/40 flex justify-between items-center opacity-60">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Powered by</span>
                      <div className="flex gap-3">
                          <span className="text-xs font-bold text-slate-600">React 18</span>
                          <span className="text-xs font-bold text-slate-600">Tailwind</span>
                          <span className="text-xs font-bold text-slate-600">Supabase</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
};

export default SystemOverview;