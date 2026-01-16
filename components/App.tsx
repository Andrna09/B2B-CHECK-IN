import React, { useState } from 'react';
import Layout from './components/Layout';
import DriverCheckIn from './components/DriverCheckIn';
import DriverStatus from './components/DriverStatus';
import AdminDashboard from './components/AdminDashboard';
import AdminReports from './components/AdminReports';
import SecurityDashboard from './components/SecurityDashboard';
import PublicMonitor from './components/PublicMonitor';
import SystemManagerDashboard from './components/CommandCenter'; 
import { LoginPage } from './components/LoginPage'; // FIXED: Named Import
import SystemOverview from './components/SystemOverview';
import { ArrowRight, Activity, Lock, Info, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { UserProfile } from './types';

const App: React.FC = () => {
  // Routing State
  const [view, setView] = useState('home'); 
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Transition State
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionRole, setTransitionRole] = useState<'ADMIN' | 'SECURITY' | 'MANAGER' | null>(null);

  // Landing Page Component (Sociolla Premium Split Layout)
  const LandingPage = () => (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 lg:px-12 py-10">
      
      {/* Background Decor: Animated Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-sociolla-pink/20 rounded-full blur-[100px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sociolla-accent/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-[1440px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* LEFT COLUMN (45%) - Typography & Buttons */}
        <div className="lg:col-span-5 text-left space-y-8 pl-4">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/50 shadow-sm animate-fade-in-up opacity-0" style={{animationDelay: '0.1s'}}>
            <span className="w-2 h-2 rounded-full bg-sociolla-accent animate-pulse"></span>
            <span className="text-[10px] font-bold text-sociolla-accent tracking-widest uppercase">Warehouse V4.0</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-2 animate-fade-in-up opacity-0" style={{animationDelay: '0.2s'}}>
            <h1 className="text-6xl md:text-7xl font-serif font-bold text-sociolla-dark leading-tight">
              Logistik
            </h1>
            <h1 className="text-6xl md:text-7xl font-sans font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sociolla-accent to-sociolla-pink leading-tight">
              Gudang
            </h1>
          </div>

          <p className="text-lg text-slate-500 font-light leading-relaxed max-w-md animate-fade-in-up opacity-0" style={{animationDelay: '0.3s'}}>
            Platform manajemen distribusi terintegrasi untuk <strong className="text-sociolla-accent font-medium">Sociolla Indonesia</strong>. Efisiensi check-in dan monitoring antrian yang cantik dan modern.
          </p>

          {/* Action Buttons - PILL SHAPE & CHUNKY */}
          <div className="flex flex-col sm:flex-row gap-5 pt-4 animate-fade-in-up opacity-0" style={{animationDelay: '0.4s'}}>
            {/* Primary Button */}
            <button 
              onClick={() => setView('public-monitor')}
              className="group relative px-8 py-4 bg-gradient-to-r from-sociolla-accent to-sociolla-pink text-white font-bold text-lg rounded-full shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-300 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
            >
               <Activity className="w-5 h-5" /> MONITOR ANTRIAN
            </button>

            {/* Secondary Button */}
            <button 
              onClick={() => setView('checkin')}
              className="px-8 py-4 bg-white border-2 border-sociolla-pink text-sociolla-dark font-bold text-lg rounded-full hover:bg-sociolla-base hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 shadow-sm"
            >
               DRIVER CHECK-IN <ArrowRight className="w-5 h-5 text-sociolla-accent"/>
            </button>
          </div>

          {/* Footer Links */}
          <div className="flex items-center gap-6 pt-8 text-sm font-medium text-slate-400 animate-fade-in-up opacity-0" style={{animationDelay: '0.5s'}}>
            <button onClick={() => setView('system-overview')} className="hover:text-sociolla-accent flex items-center gap-2 transition-colors">
              <Info className="w-4 h-4"/> Tentang Sistem
            </button>
            <button onClick={() => setView('login')} className="hover:text-sociolla-accent flex items-center gap-2 transition-colors">
              <Lock className="w-4 h-4"/> Staff Login
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN (55%) - Visual Image */}
        <div className="hidden lg:block lg:col-span-7 relative h-[600px] animate-fade-in-up opacity-0" style={{animationDelay: '0.6s'}}>
          <div className="relative w-full h-full rounded-[3rem] overflow-hidden border-[6px] border-white shadow-2xl shadow-sociolla-pink/20 group">
             
             {/* Main Image */}
             <img 
               src="https://lh3.googleusercontent.com/gps-cs-s/AG0ilSyUnU3OugVJpRf26RWFVCuVaFLhm_b6RKgTqLCDJdQyybIi9U5jNGoFoF1jrRWtWJmggqd9VZm5kUwbTdKH1AG22qGrImduifg6Msj1iSgTXpqdBH0OSmX8BYhsdTZp9riWEPeDHw=s680-w680-h510-rw" 
               alt="Sociolla Warehouse" 
               className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
             />
             
             {/* Gradient Overlay */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

             {/* Top Right Watermark */}
             <div className="absolute top-8 right-10">
               <span className="font-serif font-bold text-4xl text-white/90 drop-shadow-md">sociolla</span>
             </div>

             {/* Bottom Left Glass Card */}
             <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-lg max-w-xs border border-white/50">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden p-1">
                    <img 
                        src="https://play-lh.googleusercontent.com/J0NYr2cNJmhQiGbDXJHOqa4o9WhPeqC4BGuaD-YKp28KxH1xoW83A3dJyQMsaNwpx0Pv" 
                        alt="Sociolla" 
                        className="w-full h-full object-cover rounded-lg"
                    />
                 </div>
                 <div>
                   <h3 className="font-serif font-bold text-sociolla-dark text-lg leading-tight">PT Social Bella Indonesia</h3>
                   <p className="text-[10px] font-bold text-sociolla-gold uppercase tracking-widest mt-0.5">Secure Integrated System</p>
                 </div>
               </div>
             </div>
          </div>

          {/* Floating Decor behind image */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-sociolla-accent rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sociolla-pink rounded-full blur-2xl opacity-30 animate-pulse"></div>
        </div>

      </div>
    </div>
  );

  const handleCheckInSuccess = (id: string) => {
    setCurrentDriverId(id);
    setView('status');
  };

  const handleLoginSuccess = (user: UserProfile) => {
      setCurrentUser(user);
      
      let targetView = 'home';
      if (user.role === 'ADMIN') targetView = 'admin-dashboard';
      else if (user.role === 'SECURITY') targetView = 'security-dashboard';
      else if (user.role === 'MANAGER') targetView = 'system-manager';
      
      setTransitionRole(user.role);
      setIsTransitioning(true);

      setTimeout(() => {
          setView(targetView);
          setTimeout(() => {
              setIsTransitioning(false);
              setTransitionRole(null);
          }, 500);
      }, 2000); // Extended delay slightly for the animation
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setView('home');
  };

  const renderContent = () => {
    switch (view) {
      // Note: 'home' and 'login' are handled in the main return for overlay effect
      case 'system-overview': return <SystemOverview onNavigate={setView} onBack={() => setView('home')} />;
      case 'checkin': return <DriverCheckIn onSuccess={handleCheckInSuccess} onBack={() => setView('home')} />;
      case 'status': return currentDriverId ? <DriverStatus driverId={currentDriverId} onBack={() => setView('home')} /> : <LandingPage />;
      case 'admin-dashboard': return <AdminDashboard onBack={handleLogout} />;
      case 'admin-reports': return <AdminReports />;
      case 'security-dashboard': return <SecurityDashboard onBack={handleLogout} currentUser={currentUser} />;
      case 'public-monitor': return <PublicMonitor onBack={() => setView('home')} />;
      case 'system-manager': return <SystemManagerDashboard onBack={handleLogout} />;
      default: return null;
    }
  };

  const isFullscreen = ['home', 'public-monitor', 'system-manager', 'security-dashboard', 'login', 'system-overview'].includes(view);
  const isAdminView = view.startsWith('admin');
  const isLandingVisible = view === 'home' || view === 'login';

  return (
    <>
        {/* NEW CUSTOM TRANSITION SCREEN (Sociolla Branded) */}
        {isTransitioning && (
          <div className="fixed inset-0 z-[100] bg-[#FDF2F4] flex flex-col items-center justify-center font-sans">
              {/* Subtle Gradient Background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 to-transparent pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
                  {/* Bouncing Logo */}
                  <div className="mb-6 animate-bounce w-24 h-24 bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-white">
                      <img 
                          src="https://play-lh.googleusercontent.com/J0NYr2cNJmhQiGbDXJHOqa4o9WhPeqC4BGuaD-YKp28KxH1xoW83A3dJyQMsaNwpx0Pv" 
                          alt="Sociolla" 
                          className="w-full h-full object-cover"
                      />
                  </div>

                  {/* Sociolla Logo */}
                  <h1 className="text-6xl md:text-7xl font-serif font-bold text-[#D46A83] mb-3 tracking-tight drop-shadow-sm scale-110">
                      sociolla
                  </h1>

                  {/* Loading Status Text & Bar */}
                  <div className="flex flex-col items-center gap-4 mt-2">
                       <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">
                          {transitionRole === 'ADMIN' ? 'PREPARING CONTROL TOWER...' : 
                           transitionRole === 'SECURITY' ? 'CONNECTING TO FIELD OPS...' : 
                           transitionRole === 'MANAGER' ? 'LOADING SYSTEM CONFIG...' : 
                           'PREPARING DASHBOARD...'}
                       </p>
                       
                       {/* Custom Progress Bar */}
                       <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#D46A83] w-1/3 animate-[float_1.5s_ease-in-out_infinite]"></div>
                       </div>
                  </div>
              </div>
          </div>
        )}

        {/* Render Landing Page as Background if needed */}
        {isLandingVisible && <LandingPage />}

        {/* Login Overlay (Transparent) */}
        {view === 'login' && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
             <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setView('home')} />
          </div>
        )}

        {/* Main Content Routing */}
        {!isLandingVisible && (
           isFullscreen ? (
             renderContent()
           ) : (
             <Layout view={view} onChangeView={setView} isAdmin={isAdminView}>
                 {renderContent()}
             </Layout>
           )
        )}
    </>
  );
};

export default App;