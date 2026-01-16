import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, Settings, Database, Activity, 
  Plus, Trash2, RefreshCw, Shield, Search, Filter,
  AlertTriangle, Copy, X, Truck, Lock, UserCheck, Key, CheckCircle, Warehouse, Download, Upload, Edit, Server, Layout, Heart, User, Eye, EyeOff, ShieldCheck, LayoutDashboard, Shuffle, PenLine, ChevronRight, TestTube, ToggleLeft, ToggleRight
} from 'lucide-react';
import { 
  getProfiles, addProfile, updateProfile, deleteProfile, 
  getGateConfigs, saveGateConfig, deleteSystemSetting,
  getActivityLogs, wipeDatabase, seedDummyData,
  exportDatabase, importDatabase, getDivisions, saveDivision, deleteDivision,
  getDevConfig, saveDevConfig, DevConfig
} from '../services/dataService';
import { UserProfile, GateConfig, ActivityLog, DivisionConfig } from '../types';

interface Props {
  onBack: () => void;
}

const SystemManagerDashboard: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'GATES' | 'SYSTEM' | 'LOGS' | 'DEV'>('USERS');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Data States
  const [gates, setGates] = useState<GateConfig[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [divisions, setDivisions] = useState<DivisionConfig[]>([]);
  const [devConfig, setDevConfig] = useState<DevConfig>({ enableGpsBypass: false, enableMockOCR: false });

  // UI States for User Management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'SECURITY' | 'MANAGER'>('ALL');
  const [visiblePassword, setVisiblePassword] = useState<Record<string, boolean>>({});

  // UI States for Division Management
  const [divSearchTerm, setDivSearchTerm] = useState('');
  const [divFilterRole, setDivFilterRole] = useState<'ALL' | 'ADMIN' | 'SECURITY' | 'MANAGER'>('ALL');
  const [visibleDivPass, setVisibleDivPass] = useState<Record<string, boolean>>({});

  // Modal States
  const [modalMode, setModalMode] = useState<'NONE' | 'ADD_USER' | 'ADD_GATE' | 'ADD_DIVISION'>('NONE');
  const [isEditingUser, setIsEditingUser] = useState(false); // Flag for User Edit Mode
  const [isEditingDivision, setIsEditingDivision] = useState(false); // Flag for Division Edit Mode
  
  // Forms
  const [userForm, setUserForm] = useState<Partial<UserProfile>>({ name: '', id: '', role: 'SECURITY', email: '', status: 'ACTIVE' });
  const [gateForm, setGateForm] = useState<Partial<GateConfig>>({ name: '', capacity: 5, status: 'OPEN', type: 'GENERAL' });
  const [divForm, setDivForm] = useState<Partial<DivisionConfig>>({ id: '', name: '', role: 'SECURITY', theme: 'emerald' });
  
  const [tempPassword, setTempPassword] = useState('');

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    const [g, u, l, d] = await Promise.all([
      getGateConfigs(),
      getProfiles(),
      getActivityLogs(),
      getDivisions()
    ]);
    const dev = getDevConfig();
    setGates(g);
    setUsers(u);
    setLogs(l);
    setDivisions(d);
    setDevConfig(dev);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // --- LOGIC HANDLERS ---

  const handleGenerateNewPassword = () => {
    const chars = "0123456789";
    let pass = "";
    for(let i=0; i<4; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };
  
  const handleGenerateRandomID = () => {
      if (isEditingUser) return; // Disable generation in edit mode
      const names = userForm.name ? userForm.name.split(' ')[0].toLowerCase() : 'user';
      const random = Math.floor(Math.random() * 1000);
      setUserForm({ ...userForm, id: `${names}${random}`});
  };

  // --- DEV CONFIG HANDLERS ---
  const handleToggleDevConfig = (key: keyof DevConfig) => {
      const newConfig = { ...devConfig, [key]: !devConfig[key] };
      setDevConfig(newConfig);
      saveDevConfig(newConfig);
      showToast(`${key} ${newConfig[key] ? 'Enabled' : 'Disabled'}`);
  };

  // --- USER HANDLERS ---
  const handleEditUserClick = (user: UserProfile) => {
      setUserForm({ ...user });
      setTempPassword(user.pin_code || '');
      setIsEditingUser(true);
      setModalMode('ADD_USER');
  };

  const handleNewUserClick = () => {
      setUserForm({ name: '', id: '', role: 'SECURITY', status: 'ACTIVE' });
      setTempPassword('');
      setIsEditingUser(false);
      setModalMode('ADD_USER');
  };

  const handleSaveUser = async () => {
    if(!userForm.name || !userForm.id) return showToast("Nama & Login ID wajib diisi", 'error');
    if(!tempPassword) return showToast("Password belum diisi", 'error');
    
    setLoading(true);
    // Cast to UserProfile because checks above ensure required fields are present
    const payload = { ...userForm, pin_code: tempPassword } as UserProfile;
    
    let success = false;
    if (isEditingUser) {
        success = await updateProfile(payload);
    } else {
        success = await addProfile(payload);
    }

    setLoading(false);
    if (success) {
        showToast(isEditingUser ? "User berhasil diperbarui" : "User berhasil ditambahkan");
        setModalMode('NONE');
        loadData();
    } else {
        showToast("Gagal menyimpan (ID mungkin duplikat)", 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
      if(!confirm('Hapus user ini? Akses login akan dicabut.')) return;
      await deleteProfile(id);
      loadData();
      showToast("User dihapus", 'success');
  };

  // --- DIVISION HANDLERS (NEW) ---
  const handleEditDivisionClick = (div: DivisionConfig) => {
      setDivForm({ ...div });
      setTempPassword(div.password);
      setIsEditingDivision(true);
      setModalMode('ADD_DIVISION');
  };

  const handleNewDivisionClick = () => {
      setDivForm({ id: '', name: '', role: 'SECURITY', theme: 'emerald' });
      setTempPassword('');
      setIsEditingDivision(false);
      setModalMode('ADD_DIVISION');
  };

  const handleSaveDivision = async () => {
      if(!divForm.name || !divForm.id) return showToast("Nama & Division ID wajib diisi", 'error');
      if(!tempPassword) return showToast("Password Shared Key belum diisi", 'error');

      setLoading(true);
      const payload = { ...divForm, password: tempPassword } as DivisionConfig;
      
      const success = await saveDivision(payload);
      setLoading(false);

      if (success) {
          showToast(isEditingDivision ? "Divisi diperbarui" : "Divisi dibuat");
          setModalMode('NONE');
          loadData();
      } else {
          showToast("ID Divisi sudah ada", 'error');
      }
  };

  const handleDeleteDivision = async (id: string) => {
      if (!confirm('PERINGATAN: Menghapus Divisi akan memutuskan akses semua user di dalamnya. Lanjutkan?')) return;
      await deleteDivision(id);
      loadData();
      showToast("Divisi dihapus");
  };

  const togglePasswordVisibility = (id: string) => {
      setVisiblePassword(prev => ({
          ...prev,
          [id]: !prev[id]
      }));
  };

  const toggleDivPassVisibility = (id: string) => {
      setVisibleDivPass(prev => ({
          ...prev,
          [id]: !prev[id]
      }));
  };

  const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      showToast(`${label} disalin ke clipboard!`);
  };

  const handleAddGateClick = () => {
      setGateForm({ name: '', capacity: 5, status: 'OPEN', type: 'GENERAL' });
      setModalMode('ADD_GATE');
  };

  const handleEditGate = (gate: GateConfig) => {
      setGateForm({ ...gate });
      setModalMode('ADD_GATE');
  };

  const handleGateToggle = async (gate: GateConfig) => {
      const newStatus: GateConfig['status'] = gate.status === 'OPEN' ? 'MAINTENANCE' : 'OPEN';
      const updatedGates = gates.map(g => g.id === gate.id ? { ...g, status: newStatus } : g);
      setGates(updatedGates);
      await saveGateConfig({ ...gate, status: newStatus });
  };

  const handleSaveGate = async () => {
      if(!gateForm.name) return showToast("Nama Gate wajib diisi", 'error');
      setLoading(true);
      
      // Ensure ID is generated if missing
      const payload = {
          ...gateForm,
          id: gateForm.id || gateForm.name.toUpperCase().replace(/\s+/g, '_')
      } as GateConfig;

      const success = await saveGateConfig(payload);
      setLoading(false);
      if(success) {
          showToast(gateForm.id ? "Gate berhasil diperbarui" : "Gate berhasil dibuat");
          setModalMode('NONE');
          loadData();
      } else {
          showToast("Gagal menyimpan gate", 'error');
      }
  };

  const handleDeleteGate = async (id: string) => {
      if(!confirm("Yakin hapus gate ini?")) return;
      await deleteSystemSetting(id);
      loadData();
      showToast("Gate dihapus");
  };

  const handleExport = () => {
      const json = exportDatabase();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `YMS_Backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          if (importDatabase(content)) {
              showToast("Database berhasil dipulihkan!");
              loadData();
          } else {
              showToast("File backup tidak valid/corrupt", 'error');
          }
      };
      reader.readAsText(file);
  };

  // Helper for User Colors & Initials
  const getUserStyle = (role: string) => {
      switch(role) {
          case 'ADMIN': return { color: 'indigo', initial: 'A', bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-600' };
          case 'SECURITY': return { color: 'emerald', initial: 'D', bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' };
          case 'MANAGER': return { color: 'purple', initial: 'S', bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600' };
          default: return { color: 'slate', initial: 'U', bg: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-600' };
      }
  };

  // Helper for Theme Styles
  const getThemeStyle = (theme: string) => {
      switch(theme) {
          case 'emerald': return { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: ShieldCheck };
          case 'blue': return { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: LayoutDashboard };
          case 'purple': return { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', icon: Settings };
          case 'orange': return { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: Lock };
          default: return { bg: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', icon: Shield };
      }
  };

  // Filter Users
  const filteredUsers = users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'ALL' || u.role === filterRole;
      return matchesSearch && matchesRole;
  });

  // Filter Divisions
  const filteredDivisions = divisions.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(divSearchTerm.toLowerCase()) || d.id.toLowerCase().includes(divSearchTerm.toLowerCase());
      const matchesRole = divFilterRole === 'ALL' || d.role === divFilterRole;
      return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#FDF2F4] flex flex-col font-sans overflow-hidden relative selection:bg-[#F4A8B6] selection:text-white">
       
       {/* Ambient Background Blobs */}
       <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#F4A8B6]/20 rounded-full blur-[100px] pointer-events-none animate-float"></div>
       <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#D46A83]/10 rounded-full blur-[120px] pointer-events-none"></div>

       {/* Toast */}
       {toast && (
           <div className={`fixed top-6 right-6 z-50 px-8 py-4 rounded-2xl shadow-2xl text-white font-bold animate-fade-in-up ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
               {toast.msg}
           </div>
       )}

       {/* HEADER: Glassmorphism + Branding */}
       <div className="bg-white/80 backdrop-blur-xl border-b border-white/60 px-8 py-5 flex justify-between items-center sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-200 overflow-hidden p-1 border border-pink-50">
                    <img 
                        src="https://play-lh.googleusercontent.com/J0NYr2cNJmhQiGbDXJHOqa4o9WhPeqC4BGuaD-YKp28KxH1xoW83A3dJyQMsaNwpx0Pv" 
                        alt="Sociolla" 
                        className="w-full h-full object-cover rounded-lg"
                    />
                </div>
                <div>
                    <h1 className="font-serif font-bold text-2xl text-[#2D2D2D] tracking-tight">
                        System Manager
                    </h1>
                    <p className="text-[10px] text-[#D46A83] font-bold tracking-[0.2em] uppercase">Configuration Center</p>
                </div>
            </div>
            
            <button 
                onClick={onBack} 
                className="px-6 py-3 bg-white border-2 border-[#F4A8B6] hover:bg-[#FDF2F4] text-[#2D2D2D] rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-105"
            >
                Log Out
            </button>
       </div>

       <div className="flex flex-1 overflow-hidden relative z-10">
            {/* SIDEBAR: Glass Pill Navigation */}
            <div className="w-72 bg-white/60 backdrop-blur-lg border-r border-white/60 p-6 flex flex-col gap-3 hidden md:flex">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Menu</div>
                
                {[
                    { id: 'USERS', icon: Users, label: 'User Staff' },
                    { id: 'GATES', icon: Truck, label: 'Gate Config' },
                    { id: 'LOGS', icon: Activity, label: 'Audit Logs' },
                    { id: 'SYSTEM', icon: Database, label: 'Database' },
                    { id: 'DEV', icon: TestTube, label: 'Dev & Simulation' }
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`flex items-center gap-4 px-6 py-4 rounded-full font-bold text-sm transition-all duration-300 group text-left
                            ${activeTab === item.id 
                                ? 'bg-gradient-to-r from-[#D46A83] to-[#F4A8B6] text-white shadow-lg shadow-pink-200' 
                                : 'text-slate-500 hover:bg-white hover:text-[#D46A83]'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`}/> 
                        {item.label}
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                
                {/* === TAB: USERS & DIVISIONS === */}
                {activeTab === 'USERS' && (
                     <div className="space-y-8 animate-fade-in-up">
                        
                        {/* --- LAYER 1: DIVISION CREDENTIALS (ENHANCED) --- */}
                        <div>
                            {/* Title & Action */}
                            <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4 px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">1</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Division Access (Layer 1)</h3>
                                        <p className="text-xs text-slate-500">Kredensial pintu utama untuk setiap departemen (Shared Password).</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleNewDivisionClick}
                                    className="px-6 py-3 bg-indigo-500 text-white rounded-full text-xs font-bold hover:bg-indigo-600 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all uppercase tracking-wider"
                                >
                                    <Plus className="w-4 h-4"/> NEW DIVISION
                                </button>
                            </div>

                            {/* Search & Filter for Divisions */}
                            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-2 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari Divisi atau ID..." 
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                                        value={divSearchTerm}
                                        onChange={(e) => setDivSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex bg-slate-50 rounded-xl p-1 gap-1 overflow-x-auto">
                                    {['ALL', 'SECURITY', 'ADMIN', 'MANAGER'].map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setDivFilterRole(role as any)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${divFilterRole === role ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Division Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredDivisions.length === 0 ? (
                                    <div className="col-span-full py-10 text-center opacity-50">
                                        <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300"/>
                                        <p className="font-bold text-slate-400">Tidak ada divisi ditemukan.</p>
                                    </div>
                                ) : filteredDivisions.map(div => {
                                    const style = getThemeStyle(div.theme);
                                    const isVis = visibleDivPass[div.id];

                                    return (
                                        <div key={div.id} className={`bg-white rounded-[2rem] p-6 relative overflow-hidden border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between ${style.border}`}>
                                            {/* Decorative Blob */}
                                            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-10 ${style.bg}`}></div>
                                            
                                            <div className="relative z-10">
                                                {/* Header */}
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${style.bg}`}>
                                                        <style.icon className="w-7 h-7" />
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleEditDivisionClick(div)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"><PenLine className="w-4 h-4"/></button>
                                                        <button onClick={() => handleDeleteDivision(div.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                    </div>
                                                </div>

                                                {/* Division Info */}
                                                <div className="mb-4">
                                                    <h3 className="font-bold text-lg text-slate-800 mb-0.5 leading-tight">{div.name}</h3>
                                                    <button 
                                                        onClick={() => copyToClipboard(div.id, "Division ID")}
                                                        className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 hover:text-indigo-600 transition-colors group/id"
                                                    >
                                                        ID: {div.id} <Copy className="w-3 h-3 opacity-0 group-hover/id:opacity-100"/>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Footer (Role & Password) */}
                                            <div className="relative z-10 mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${style.light} ${style.text}`}>
                                                    {div.role}
                                                </span>
                                                
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <Key className="w-3 h-3 text-slate-400"/>
                                                    <span className="text-xs font-mono font-bold text-slate-600 min-w-[60px] text-center">
                                                        {isVis ? div.password : '••••••••'}
                                                    </span>
                                                    <button 
                                                        onClick={() => toggleDivPassVisibility(div.id)}
                                                        className="text-slate-400 hover:text-indigo-600 transition-colors ml-1"
                                                    >
                                                        {isVis ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                                    </button>
                                                    {isVis && (
                                                        <button onClick={() => copyToClipboard(div.password, "Password")} className="text-slate-300 hover:text-blue-500">
                                                            <Copy className="w-3 h-3"/>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-200"></div>

                        {/* --- LAYER 2: PERSONAL ACCOUNTS --- */}
                        <div>
                            {/* Title & Action */}
                            <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4 px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#D46A83] text-white flex items-center justify-center font-bold">2</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Personal Staff (Layer 2)</h3>
                                        <p className="text-xs text-slate-500">Akun individual staff yang dibuat di bawah akses divisi.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleNewUserClick}
                                    className="px-6 py-3 bg-[#F4A8B6] text-white rounded-full text-xs font-bold hover:bg-[#D46A83] flex items-center gap-2 shadow-lg shadow-pink-200 transition-all uppercase tracking-wider"
                                >
                                    <Plus className="w-4 h-4"/> NEW USER
                                </button>
                            </div>

                            {/* Search & Filter Toolbar */}
                            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-2 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari nama staff atau ID..." 
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex bg-slate-50 rounded-xl p-1 gap-1 overflow-x-auto">
                                    {['ALL', 'SECURITY', 'ADMIN', 'MANAGER'].map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setFilterRole(role as any)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterRole === role ? 'bg-white text-[#D46A83] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* User Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredUsers.length === 0 ? (
                                    <div className="col-span-full py-20 text-center opacity-50">
                                        <Users className="w-16 h-16 mx-auto mb-4 text-slate-300"/>
                                        <p className="font-bold text-slate-400">Tidak ada user ditemukan.</p>
                                    </div>
                                ) : filteredUsers.map(u => {
                                    const style = getUserStyle(u.role);
                                    const isPasswordVisible = visiblePassword[u.id];

                                    return (
                                        <div key={u.id} className="bg-white rounded-[2rem] p-6 relative overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between">
                                            
                                            {/* Decorative Header Blob */}
                                            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-10 ${style.bg}`}></div>

                                            <div className="relative z-10">
                                                {/* Header Card */}
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-serif font-bold shadow-lg ${style.bg}`}>
                                                        {style.initial}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {/* Edit Button */}
                                                        <button 
                                                            onClick={() => handleEditUserClick(u)} 
                                                            className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                                            title="Edit User"
                                                        >
                                                            <PenLine className="w-4 h-4"/>
                                                        </button>
                                                        {/* Delete Button */}
                                                        <button 
                                                            onClick={() => handleDeleteUser(u.id)} 
                                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                            title="Hapus User"
                                                        >
                                                            <Trash2 className="w-4 h-4"/>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* User Info */}
                                                <div className="mb-4">
                                                    <h3 className="font-bold text-lg text-slate-800 mb-0.5 leading-tight">{u.name}</h3>
                                                    <button 
                                                        onClick={() => copyToClipboard(u.id, "User ID")}
                                                        className="text-xs text-slate-400 font-medium flex items-center gap-1 hover:text-[#D46A83] transition-colors group/id"
                                                    >
                                                        <User className="w-3 h-3"/> @{u.id} <Copy className="w-2.5 h-2.5 opacity-0 group-hover/id:opacity-100"/>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Footer Card (Role & PIN) */}
                                            <div className="relative z-10 mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${style.light} ${style.text}`}>
                                                    {u.role}
                                                </span>
                                                
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <Key className="w-3 h-3 text-slate-400"/>
                                                    <span className="text-xs font-mono font-bold text-slate-600 min-w-[30px] text-center">
                                                        {isPasswordVisible ? u.pin_code : '••••'}
                                                    </span>
                                                    <button 
                                                        onClick={() => togglePasswordVisibility(u.id)}
                                                        className="text-slate-400 hover:text-[#D46A83] transition-colors ml-1"
                                                    >
                                                        {isPasswordVisible ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                                    </button>
                                                    {isPasswordVisible && (
                                                        <button onClick={() => copyToClipboard(u.pin_code || '', "PIN")} className="text-slate-300 hover:text-blue-500">
                                                            <Copy className="w-3 h-3"/>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                )}

                {/* === TAB: GATES === */}
                {activeTab === 'GATES' && (
                    <div className="space-y-8 animate-fade-in-up">
                         <div className="flex justify-between items-end mb-4 px-2">
                             <div>
                                 <h3 className="text-lg font-bold text-slate-800">Gate Configuration</h3>
                                 <p className="text-xs text-slate-500">Atur kapasitas dan status pintu muatan.</p>
                             </div>
                             <button 
                                 onClick={handleAddGateClick}
                                 className="px-6 py-3 bg-[#2D2D2D] text-white rounded-full text-xs font-bold hover:bg-black flex items-center gap-2 shadow-lg"
                             >
                                 <Plus className="w-4 h-4"/> ADD GATE
                             </button>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {gates.map(gate => (
                                 <div key={gate.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                                     <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-3xl opacity-10 ${gate.status === 'OPEN' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                     
                                     <div className="flex justify-between items-start mb-4 relative z-10">
                                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${gate.status === 'OPEN' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                             <Truck className="w-6 h-6" />
                                         </div>
                                         <div className="flex gap-1">
                                             <button onClick={() => handleEditGate(gate)} className="p-2 text-slate-300 hover:text-blue-500 bg-slate-50 hover:bg-blue-50 rounded-full"><PenLine className="w-4 h-4"/></button>
                                             <button onClick={() => handleDeleteGate(gate.id)} className="p-2 text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4"/></button>
                                         </div>
                                     </div>

                                     <h3 className="text-xl font-bold text-slate-800 mb-1">{gate.name}</h3>
                                     <div className="flex items-center gap-2 mb-6">
                                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${gate.type === 'DOCK' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                             {gate.type}
                                         </span>
                                         <span className="text-xs text-slate-400 font-bold">Cap: {gate.capacity}</span>
                                     </div>

                                     <button 
                                         onClick={() => handleGateToggle(gate)}
                                         className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${gate.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                     >
                                         <PowerIcon status={gate.status} /> 
                                         {gate.status === 'OPEN' ? 'OPEN (ACTIVE)' : 'MAINTENANCE'}
                                     </button>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}

                {/* === TAB: LOGS === */}
                {activeTab === 'LOGS' && (
                    <div className="space-y-6 animate-fade-in-up">
                         <h3 className="text-lg font-bold text-slate-800 px-2">System Audit Logs</h3>
                         <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                             <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                     <thead className="bg-slate-50 border-b border-slate-100">
                                         <tr>
                                             <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Time</th>
                                             <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                                             <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                             <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-50">
                                         {logs.map(log => (
                                             <tr key={log.id} className="hover:bg-slate-50/50">
                                                 <td className="p-4 text-xs font-mono text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                                                 <td className="p-4 text-sm font-bold text-slate-700">{log.user_email}</td>
                                                 <td className="p-4">
                                                     <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">{log.action}</span>
                                                 </td>
                                                 <td className="p-4 text-sm text-slate-600">{log.details}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                    </div>
                )}

                {/* === TAB: DEV & SIMULATION (NEW) === */}
                {activeTab === 'DEV' && (
                    <div className="space-y-8 animate-fade-in-up max-w-4xl">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Environment Simulation</h3>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-bl-[100px]"></div>
                                
                                <div className="relative z-10 grid gap-6">
                                    {/* GPS TOGGLE */}
                                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl text-orange-500 shadow-sm"><Settings className="w-6 h-6"/></div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Global GPS Bypass</h4>
                                                <p className="text-sm text-slate-500">Izinkan driver check-in tanpa validasi lokasi (Mock Location).</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleToggleDevConfig('enableGpsBypass')}
                                            className={`p-2 rounded-full transition-colors ${devConfig.enableGpsBypass ? 'text-green-500 hover:text-green-600' : 'text-slate-300 hover:text-slate-400'}`}
                                        >
                                            {devConfig.enableGpsBypass ? <ToggleRight className="w-10 h-10"/> : <ToggleLeft className="w-10 h-10"/>}
                                        </button>
                                    </div>

                                    {/* OCR TOGGLE (Mocking) */}
                                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl text-orange-500 shadow-sm"><TestTube className="w-6 h-6"/></div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Mock OCR Scanning</h4>
                                                <p className="text-sm text-slate-500">Simulasi scan plat nomor otomatis tanpa kamera fisik.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleToggleDevConfig('enableMockOCR')}
                                            className={`p-2 rounded-full transition-colors ${devConfig.enableMockOCR ? 'text-green-500 hover:text-green-600' : 'text-slate-300 hover:text-slate-400'}`}
                                        >
                                            {devConfig.enableMockOCR ? <ToggleRight className="w-10 h-10"/> : <ToggleLeft className="w-10 h-10"/>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === TAB: SYSTEM === */}
                {activeTab === 'SYSTEM' && (
                    <div className="space-y-8 animate-fade-in-up max-w-4xl">
                         <div>
                             <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Database Maintenance</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                     <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-4"><AlertTriangle className="w-6 h-6"/></div>
                                     <h4 className="font-bold text-slate-800 mb-2">Factory Reset</h4>
                                     <p className="text-sm text-slate-500 mb-6">Menghapus seluruh data transaksi (drivers, logs). Konfigurasi user & gate tetap aman.</p>
                                     <button onClick={() => {if(confirm("Yakin reset database?")) { wipeDatabase(); loadData(); showToast("Database Reset!"); }}} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                                         WIPE DATA
                                     </button>
                                 </div>
                                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                     <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-4"><Database className="w-6 h-6"/></div>
                                     <h4 className="font-bold text-slate-800 mb-2">Seed Dummy Data</h4>
                                     <p className="text-sm text-slate-500 mb-6">Mengisi database dengan 5 data dummy acak untuk testing sistem.</p>
                                     <button onClick={() => { seedDummyData(); loadData(); showToast("Dummy Data Injected"); }} className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors">
                                         INJECT DATA
                                     </button>
                                 </div>
                             </div>
                         </div>

                         <div>
                             <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Backup & Restore</h3>
                             <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                 
                                 <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                                     <div className="flex-1">
                                         <h4 className="text-2xl font-serif font-bold mb-2">Data Backup</h4>
                                         <p className="text-slate-400 mb-6">Simpan seluruh konfigurasi dan data transaksi ke dalam file JSON terenkripsi lokal.</p>
                                         <div className="flex gap-4">
                                             <button onClick={handleExport} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center gap-2">
                                                 <Download className="w-4 h-4"/> DOWNLOAD JSON
                                             </button>
                                             <label className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center gap-2 cursor-pointer">
                                                 <Upload className="w-4 h-4"/> RESTORE FILE
                                                 <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                                             </label>
                                         </div>
                                     </div>
                                     <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/10">
                                         <Server className="w-12 h-12 text-white/80" />
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                )}

            </div>
       </div>

       {/* === MODAL: ADD/EDIT USER === */}
       {modalMode === 'ADD_USER' && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2D]/60 backdrop-blur-md p-4 animate-fade-in-up">
               <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white">
                   <div className="bg-[#FDF2F4] p-8 border-b border-pink-100 flex justify-between items-start">
                       <div>
                           <div className="w-12 h-12 bg-white text-[#D46A83] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                               <UserCheck className="w-6 h-6"/>
                           </div>
                           <h3 className="font-serif font-bold text-3xl text-[#2D2D2D]">
                               {isEditingUser ? 'Edit User' : 'New User'}
                           </h3>
                           <p className="text-slate-500 font-medium">
                               {isEditingUser ? 'Perbarui informasi akses staff.' : 'Buat akses untuk staff baru.'}
                           </p>
                       </div>
                       <button onClick={() => setModalMode('NONE')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                           <X className="w-6 h-6"/>
                       </button>
                   </div>
                   
                   <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                       
                       {/* 1. Full Name */}
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nama Lengkap</label>
                           <input 
                               type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-[#F4A8B6] focus:bg-white transition-all"
                               placeholder="e.g. Budi Santoso"
                               value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})}
                           />
                       </div>

                       {/* 2. DIVISION ROLE SELECTION */}
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Pilih Hak Akses Departemen</label>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                               {['SECURITY', 'ADMIN', 'MANAGER'].map(role => (
                                   <button 
                                       key={role}
                                       onClick={() => setUserForm({...userForm, role: role as any})}
                                       className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all 
                                        ${userForm.role === role ? 'bg-white border-[#D46A83] text-[#D46A83] shadow-md scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                   >
                                       <span className="text-xs font-bold uppercase">{role}</span>
                                   </button>
                               ))}
                           </div>
                       </div>

                       {/* 3. Credentials (ID & PIN) */}
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">User ID</label>
                               <div className="relative">
                                    <input 
                                        type="text" 
                                        className={`w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono font-bold text-slate-800 outline-none focus:border-[#F4A8B6] ${isEditingUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                        placeholder="budi_s"
                                        value={userForm.id} 
                                        onChange={e => setUserForm({...userForm, id: e.target.value.replace(/\s+/g, '').toLowerCase()})}
                                        readOnly={isEditingUser}
                                    />
                                    {!isEditingUser && (
                                        <button onClick={handleGenerateRandomID} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#D46A83]" title="Generate ID">
                                            <Shuffle className="w-4 h-4"/>
                                        </button>
                                    )}
                               </div>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">PIN (4-Digit)</label>
                               <div className="flex gap-2">
                                   <input 
                                       type="text" value={tempPassword} onChange={(e) => setTempPassword(e.target.value.replace(/\D/g,'').slice(0,4))}
                                       placeholder="1234" 
                                       maxLength={4}
                                       className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-mono text-lg font-bold text-slate-700 outline-none focus:border-[#F4A8B6] text-center"
                                   />
                                   <button onClick={handleGenerateNewPassword} className="px-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">🎲</button>
                               </div>
                           </div>
                       </div>
                   </div>
                   <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                       <button onClick={() => setModalMode('NONE')} className="flex-1 py-4 text-slate-500 font-bold hover:bg-white rounded-full border border-transparent hover:border-slate-200">Cancel</button>
                       <button onClick={handleSaveUser} className="flex-1 py-4 bg-[#D46A83] text-white font-bold rounded-full hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-pink-200 transition-all">
                           <CheckCircle className="w-5 h-5"/> {isEditingUser ? 'Update User' : 'Simpan User'}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* === MODAL: ADD/EDIT DIVISION (NEW) === */}
       {modalMode === 'ADD_DIVISION' && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2D]/60 backdrop-blur-md p-4 animate-fade-in-up">
               <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white">
                   <div className="bg-[#FDF2F4] p-8 border-b border-pink-100 flex justify-between items-start">
                       <div>
                           <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                               <Shield className="w-6 h-6"/>
                           </div>
                           <h3 className="font-serif font-bold text-3xl text-[#2D2D2D]">
                               {isEditingDivision ? 'Edit Division' : 'New Division'}
                           </h3>
                           <p className="text-slate-500 font-medium">
                               Konfigurasi akses login pintu utama (Layer 1).
                           </p>
                       </div>
                       <button onClick={() => setModalMode('NONE')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                           <X className="w-6 h-6"/>
                       </button>
                   </div>
                   
                   <div className="p-8 space-y-6">
                       
                       {/* 1. Division Name */}
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nama Divisi</label>
                           <input 
                               type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                               placeholder="e.g. Warehouse Ops A"
                               value={divForm.name} onChange={e => setDivForm({...divForm, name: e.target.value})}
                           />
                       </div>

                       {/* 2. Credentials */}
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Division Login ID</label>
                               <input 
                                   type="text" 
                                   className={`w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 uppercase ${isEditingDivision ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                   placeholder="SECURITY"
                                   value={divForm.id} 
                                   onChange={e => setDivForm({...divForm, id: e.target.value.toUpperCase()})}
                                   readOnly={isEditingDivision}
                               />
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Shared Password</label>
                               <input 
                                   type="text" 
                                   value={tempPassword} 
                                   onChange={(e) => setTempPassword(e.target.value)}
                                   placeholder="Secret@123" 
                                   className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-mono text-lg font-bold text-slate-700 outline-none focus:border-indigo-500"
                               />
                           </div>
                       </div>

                       {/* 3. Theme Color */}
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Warna Tema Card</label>
                           <div className="flex gap-4">
                               {['emerald', 'blue', 'purple', 'orange'].map((color) => (
                                   <button 
                                       key={color}
                                       onClick={() => setDivForm({...divForm, theme: color as any})}
                                       className={`w-12 h-12 rounded-full border-4 transition-all ${divForm.theme === color ? 'border-slate-800 scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                       style={{ backgroundColor: color === 'emerald' ? '#10b981' : color === 'blue' ? '#3b82f6' : color === 'purple' ? '#a855f7' : '#f97316' }}
                                   />
                               ))}
                           </div>
                       </div>

                       {/* 4. Role Mapping (Permission Level) */}
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Permission Role</label>
                           <select 
                                value={divForm.role}
                                onChange={(e) => setDivForm({...divForm, role: e.target.value as any})}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500"
                           >
                               <option value="SECURITY">SECURITY (Field Ops)</option>
                               <option value="ADMIN">ADMIN (Traffic Control)</option>
                               <option value="MANAGER">MANAGER (System Config)</option>
                           </select>
                       </div>

                   </div>
                   <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                       <button onClick={() => setModalMode('NONE')} className="flex-1 py-4 text-slate-500 font-bold hover:bg-white rounded-full border border-transparent hover:border-slate-200">Cancel</button>
                       <button onClick={handleSaveDivision} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-full hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all">
                           <CheckCircle className="w-5 h-5"/> {isEditingDivision ? 'Update Division' : 'Create Division'}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* === MODAL: ADD/EDIT GATE === */}
       {modalMode === 'ADD_GATE' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2D]/60 backdrop-blur-md p-4 animate-fade-in-up">
                <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white">
                    <div className="bg-[#2D2D2D] p-6 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="font-serif font-bold text-xl text-white">Gate Configuration</h3>
                        <button onClick={() => setModalMode('NONE')} className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nama Gate</label>
                            <input 
                                type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-slate-800 focus:bg-white transition-all"
                                placeholder="e.g. GATE 1 (Utama)"
                                value={gateForm.name} onChange={e => setGateForm({...gateForm, name: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Tipe Gate</label>
                                <select 
                                     value={gateForm.type}
                                     onChange={(e) => setGateForm({...gateForm, type: e.target.value as any})}
                                     className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-slate-800"
                                >
                                    <option value="GENERAL">General (Masuk)</option>
                                    <option value="DOCK">Loading Dock</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Kapasitas</label>
                                <input 
                                    type="number" 
                                    value={gateForm.capacity} onChange={(e) => setGateForm({...gateForm, capacity: parseInt(e.target.value)})}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-slate-800 text-center"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Status Awal</label>
                            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl">
                                <button 
                                    onClick={() => setGateForm({...gateForm, status: 'OPEN'})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${gateForm.status === 'OPEN' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    OPEN
                                </button>
                                <button 
                                    onClick={() => setGateForm({...gateForm, status: 'MAINTENANCE'})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${gateForm.status === 'MAINTENANCE' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    CLOSED
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button onClick={() => setModalMode('NONE')} className="flex-1 py-4 text-slate-500 font-bold hover:bg-white rounded-full border border-transparent hover:border-slate-200">Cancel</button>
                        <button onClick={handleSaveGate} className="flex-1 py-4 bg-[#2D2D2D] text-white font-bold rounded-full hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg transition-all">
                            <CheckCircle className="w-5 h-5"/> Simpan Gate
                        </button>
                    </div>
                </div>
            </div>
       )}

    </div>
  );
};

// Helper Component for Power Icon
const PowerIcon = ({ status }: { status: string }) => {
    return status === 'OPEN' ? <CheckCircle className="w-4 h-4"/> : <X className="w-4 h-4"/>;
};

export default SystemManagerDashboard;