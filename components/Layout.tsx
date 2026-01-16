import React, { useState } from 'react';
import { LayoutDashboard, BarChart2, LogOut, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  view: string;
  onChangeView: (view: string) => void;
  isAdmin: boolean;
}

const Layout: React.FC<Props> = ({ children, view, onChangeView, isAdmin }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Helper for Nav Item
  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button 
        onClick={() => onChangeView(id)}
        title={isCollapsed ? label : ''}
        className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group relative mb-2
          ${view === id 
            ? 'bg-gradient-to-r from-sociolla-accent to-sociolla-pink text-white shadow-lg shadow-pink-200' 
            : 'text-slate-500 hover:text-sociolla-accent hover:bg-white hover:shadow-md'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
    >
        <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${view === id && !isCollapsed ? 'animate-pulse' : ''} ${isCollapsed ? 'group-hover:scale-110' : ''}`} />
        
        <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 origin-left 
            ${isCollapsed ? 'opacity-0 w-0 overflow-hidden scale-0' : 'opacity-100 w-auto scale-100'}
        `}>
            {label}
        </span>
    </button>
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-sociolla-base">
        <header className="sticky top-0 z-50 glass border-b border-white/40 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => onChangeView('home')}
            >
                <div className="w-10 h-10 rounded-xl shadow-lg shadow-pink-200 overflow-hidden group-hover:scale-110 transition-transform duration-300 border-2 border-white">
                    <img 
                        src="https://play-lh.googleusercontent.com/J0NYr2cNJmhQiGbDXJHOqa4o9WhPeqC4BGuaD-YKp28KxH1xoW83A3dJyQMsaNwpx0Pv" 
                        alt="Sociolla" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <span className="font-serif font-bold text-2xl tracking-tight text-sociolla-dark lowercase">
                  sociolla<span className="text-sociolla-accent">.</span>
                </span>
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8 animate-fade-in-up">
          {children}
        </main>
        <footer className="glass border-t border-white/20 py-8 text-center text-sm text-slate-500 mt-auto">
            <p className="font-medium">&copy; 2024 PT Social Bella Indonesia. <span className="text-sociolla-accent">Secure & Integrated System</span>.</p>
        </footer>
      </div>
    );
  }

  // Admin Layout
  return (
    <div className="min-h-screen flex font-sans bg-sociolla-base">
      {/* Sidebar Desktop - Glassmorphism */}
      <aside 
        className={`bg-white/80 backdrop-blur-xl flex flex-col fixed h-full z-30 shadow-2xl shadow-pink-100/50 transition-all duration-300 ease-in-out border-r border-white
            ${isCollapsed ? 'w-24' : 'w-72'}
        `}
      >
        {/* Toggle Button */}
        <button 
            onClick={toggleSidebar}
            className="absolute -right-3 top-10 bg-white text-sociolla-accent p-1.5 rounded-full shadow-md border border-pink-100 hover:scale-110 transition-transform z-50"
        >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Header */}
        <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} transition-all duration-300`}>
           <div className="w-11 h-11 bg-white rounded-xl shadow-lg shadow-pink-200 shrink-0 overflow-hidden border border-pink-50">
                <img 
                    src="https://play-lh.googleusercontent.com/J0NYr2cNJmhQiGbDXJHOqa4o9WhPeqC4BGuaD-YKp28KxH1xoW83A3dJyQMsaNwpx0Pv" 
                    alt="Sociolla" 
                    className="w-full h-full object-cover"
                />
            </div>
           <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
             <h1 className="font-serif font-bold text-2xl text-sociolla-dark tracking-wide whitespace-nowrap lowercase">sociolla</h1>
             <p className="text-[10px] text-sociolla-accent font-bold tracking-widest whitespace-nowrap uppercase">Admin Console</p>
           </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-grow px-6 space-y-2 py-4 overflow-y-auto custom-scrollbar">
            <div className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 transition-all ${isCollapsed ? 'text-center' : 'px-2'}`}>
                {isCollapsed ? 'MENU' : 'Main Menu'}
            </div>
            <NavItem id="admin-dashboard" icon={LayoutDashboard} label="Traffic Control" />
            <NavItem id="admin-reports" icon={BarChart2} label="Laporan Harian" />
        </nav>
        
        {/* Footer */}
        <div className="p-6 border-t border-pink-50">
            <button 
              onClick={() => onChangeView('home')} 
              className={`flex items-center gap-3 text-slate-400 hover:text-red-500 transition-colors w-full px-4 py-3 rounded-xl hover:bg-red-50 group relative
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
                <LogOut className="w-5 h-5 shrink-0" /> 
                <span className={`font-bold text-sm whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                    Sign Out
                </span>
            </button>
        </div>
      </aside>

      <main 
        className={`flex-1 min-h-screen bg-sociolla-base transition-all duration-300 ease-in-out
            ${isCollapsed ? 'ml-24' : 'ml-72'}
        `}
      >
        <div className="p-8 max-w-[1920px] mx-auto animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;