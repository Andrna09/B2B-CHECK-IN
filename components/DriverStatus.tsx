
import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, MapPin, RefreshCw, Truck, FileText, CheckCircle, ArrowLeft, Loader2, Megaphone, Bell, BellOff, Volume2, VolumeX, StopCircle, PlayCircle } from 'lucide-react';
import { DriverData, QueueStatus, Gate } from '../types';
import { getDriverById, getDrivers } from '../services/dataService';

interface Props {
  driverId: string;
  onBack?: () => void;
}

const DriverStatus: React.FC<Props> = ({ driverId, onBack }) => {
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [position, setPosition] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // --- NOTIFICATION STATE ---
  // Default to true because we assume user interacted with "Check-In" button previously
  const [allowAudio, setAllowAudio] = useState(true); 
  const [isPlayingAlarm, setIsPlayingAlarm] = useState(false);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Object
  useEffect(() => {
      // Use a persistent alarm sound
      alarmAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3'); // Loud Alarm
      alarmAudio.current.loop = true;
      return () => {
          if (alarmAudio.current) {
              alarmAudio.current.pause();
              alarmAudio.current.src = "";
          }
      };
  }, []);

  // Helper: Play Notification Sound & Vibrate
  const triggerNotification = (status: QueueStatus) => {
      if (status === QueueStatus.CALLED) {
          // Continuous Alarm Loop
          if (allowAudio && alarmAudio.current) {
              const playPromise = alarmAudio.current.play();
              if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlayingAlarm(true))
                    .catch(e => console.error("Audio block", e));
              }
          }
          if (navigator.vibrate) navigator.vibrate([1000, 500, 1000, 500, 1000]); // Long vibration
      } else {
          // Standard Beep for other status
          if (navigator.vibrate) navigator.vibrate([200]);
      }
  };

  const stopAlarm = () => {
      if (alarmAudio.current) {
          alarmAudio.current.pause();
          alarmAudio.current.currentTime = 0;
      }
      setIsPlayingAlarm(false);
  };

  const fetchStatus = async () => {
    const data = await getDriverById(driverId);
    if (data) {
      // Check for status change to CALLED
      if (driver && driver.status !== QueueStatus.CALLED && data.status === QueueStatus.CALLED) {
          triggerNotification(QueueStatus.CALLED);
      }

      setDriver(data);
      if (data.status === QueueStatus.VERIFIED) {
        const allDrivers = await getDrivers();
        const ahead = allDrivers.filter(d => 
          d.status === QueueStatus.VERIFIED && 
          d.checkInTime < data.checkInTime
        );
        setPosition(ahead.length + 1);
      } else {
        setPosition(0);
      }
      
      // Auto-Stop alarm if status changes AWAY from CALLED (e.g. Loading started)
      if (isPlayingAlarm && data.status !== QueueStatus.CALLED) {
          stopAlarm();
      }
    }
    setLoading(false);
  };

  // Initial Load
  useEffect(() => {
    setLoading(true);
    fetchStatus();
  }, [driverId]);

  // Polling Interval
  useEffect(() => {
    const interval = setInterval(fetchStatus, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [driverId, driver, allowAudio]); 

  if (loading && !driver) return <div className="min-h-[50vh] flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  if (!driver) return <div className="p-8 text-center text-red-600 font-bold bg-white rounded-xl shadow-lg mt-10">Data antrian tidak ditemukan atau ID salah.</div>;

  const getStatusDisplay = (status: QueueStatus) => {
    switch (status) {
      case QueueStatus.BOOKED:
      case QueueStatus.CHECKED_IN:
      case QueueStatus.AT_GATE: 
        return {
           color: 'orange',
           icon: <Clock className="w-16 h-16 text-orange-500 mb-4" />,
           title: 'Menunggu Verifikasi',
           desc: 'Silakan menuju Pos Security untuk scan QR Code.',
           bg: 'bg-orange-50 border-orange-200'
        };
      case QueueStatus.VERIFIED: 
        return {
           color: 'blue',
           icon: <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4"><Clock className="w-10 h-10 text-blue-600" /></div>,
           title: 'Dalam Antrian',
           desc: 'Silakan parkir dan tunggu panggilan.',
           bg: 'bg-blue-50 border-blue-200'
        };
      case QueueStatus.CALLED: 
        return {
           color: 'indigo',
           icon: <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4 animate-bounce"><Megaphone className="w-10 h-10 text-indigo-600" /></div>,
           title: 'DIPANGGIL!',
           desc: 'Segera menuju Loading Dock sekarang juga!',
           bg: 'bg-indigo-50 border-indigo-200 animate-pulse ring-4 ring-indigo-300'
        };
      case QueueStatus.LOADING: 
        return {
           color: 'purple',
           icon: <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4"><Loader2 className="w-10 h-10 text-purple-600 animate-spin" /></div>,
           title: 'Proses Loading',
           desc: 'Kegiatan bongkar muat sedang berlangsung.',
           bg: 'bg-purple-50 border-purple-200'
        };
      case QueueStatus.COMPLETED: 
        return {
           color: 'emerald',
           icon: <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-10 h-10 text-emerald-600" /></div>,
           title: 'Selesai',
           desc: 'Proses selesai. Hati-hati di jalan.',
           bg: 'bg-emerald-50 border-emerald-200'
        };
      case QueueStatus.EXITED: 
        return {
           color: 'slate',
           icon: <CheckCircle className="w-16 h-16 text-slate-400 mb-4" />,
           title: 'Sudah Keluar',
           desc: 'Driver telah meninggalkan area gudang.',
           bg: 'bg-slate-100 border-slate-200'
        };
      default: return { color: 'slate', icon: null, title: status, desc: '', bg: 'bg-slate-50' };
    }
  };

  const statusUI = getStatusDisplay(driver.status);
  const isCalled = driver.status === QueueStatus.CALLED;

  return (
    <div className={`max-w-xl mx-auto animate-fade-in-up pb-10 px-4 pt-28 md:pt-32 ${isCalled ? 'bg-indigo-50/50 min-h-screen' : ''}`}>
      
      {onBack && (
        <button 
            onClick={onBack}
            className="fixed top-6 left-6 md:top-8 md:left-8 z-[100] group flex items-center gap-3 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-full border border-white/50 text-slate-600 font-bold tracking-wide hover:bg-white hover:text-[#D46A83] hover:scale-105 transition-all shadow-xl shadow-pink-100/50"
        >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="uppercase text-xs tracking-widest hidden md:inline">Back to Home</span>
        </button>
      )}

      {/* --- NOTIFICATION INDICATOR --- */}
      {!isCalled && driver.status !== QueueStatus.COMPLETED && driver.status !== QueueStatus.EXITED && (
          <div className="mb-6 flex justify-end">
              <div 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm
                    ${allowAudio ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
              >
                  {allowAudio ? <Volume2 className="w-4 h-4"/> : <VolumeX className="w-4 h-4"/>}
                  {allowAudio ? 'Alarm Otomatis' : 'Alarm Mati'}
              </div>
          </div>
      )}

      {/* --- ALARM STOP BUTTON (When Called) --- */}
      {isCalled && isPlayingAlarm && (
          <div className="fixed inset-x-4 top-24 z-[90] animate-bounce">
              <button 
                onClick={stopAlarm}
                className="w-full py-6 bg-red-600 text-white rounded-3xl shadow-2xl shadow-red-500/50 flex flex-col items-center justify-center gap-2 border-4 border-white/20"
              >
                  <StopCircle className="w-12 h-12 animate-pulse" />
                  <span className="text-xl font-black uppercase tracking-widest">Matikan Alarm</span>
                  <span className="text-xs font-medium opacity-80">Saya sedang menuju lokasi</span>
              </button>
          </div>
      )}

      {/* Main Status Card */}
      <div className={`bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 border border-white/50 relative overflow-hidden text-center transition-all duration-500 ${isCalled ? 'scale-105 ring-8 ring-indigo-200/50 shadow-indigo-500/30 mt-20' : ''}`}>
        {/* Decorative Blob */}
        <div className={`absolute top-0 left-0 w-full h-2 bg-${statusUI.color}-500`}></div>
        <div className={`absolute -top-20 -right-20 w-64 h-64 bg-${statusUI.color}-500/10 rounded-full blur-3xl -z-10`}></div>

        <div className="flex flex-col items-center justify-center relative z-10">
            {statusUI.icon}
            <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight leading-none">{statusUI.title}</h1>
            <p className="text-slate-500 font-medium text-lg max-w-xs mx-auto leading-relaxed">{statusUI.desc}</p>
            
            {/* Queue Position Badge */}
            {driver.status === QueueStatus.VERIFIED && position > 0 && (
               <div className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-200">
                  <span className="text-sm font-bold uppercase tracking-wide opacity-80">Antrian Ke</span>
                  <span className="text-3xl font-black">{position}</span>
               </div>
            )}

            {/* Gate Assignment Badge */}
            {driver.gate !== Gate.NONE && (
                <div className="mt-6 w-full">
                    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between">
                         <div className="text-left">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">LOKASI GATE</div>
                            <div className="text-2xl font-black flex items-center gap-2">
                                <MapPin className="w-6 h-6 text-blue-400" />
                                {driver.gate.replace('_', ' ')}
                            </div>
                         </div>
                         <div className="text-right border-l border-slate-700 pl-6">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">NO. ANTRIAN</div>
                            <div className="text-4xl font-black font-mono tracking-tighter text-blue-400">{driver.queueNumber}</div>
                         </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white/60 backdrop-blur-lg mt-6 rounded-[2rem] p-6 shadow-lg border border-white/40">
         <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60">
            <div>
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Driver</p>
               <h3 className="font-bold text-xl text-slate-800">{driver.name}</h3>
            </div>
            <div className="text-right">
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Plat Nomor</p>
               <div className="bg-slate-200 px-3 py-1 rounded-lg font-black font-mono text-slate-700">
                  {driver.licensePlate}
               </div>
            </div>
         </div>

         <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
               <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Truck className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Ekspedisi</p>
                  <p className="font-bold text-slate-800 text-lg leading-tight">{driver.company}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
               <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <FileText className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Dokumen / DO</p>
                  <p className="font-bold text-slate-800 text-lg leading-tight">{driver.doNumber}</p>
                  {driver.documentFile && (
                      <div className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3" /> Terlampir
                      </div>
                  )}
               </div>
            </div>
         </div>

         {/* QR Code Section */}
         <div className="mt-8 pt-6 border-t border-dashed border-slate-300 text-center">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 inline-block mb-3">
               <QRCodeSVG value={`https://yms-app.com/status/${driverId}`} size={120} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Scan untuk simpan status</p>
            <p className="text-[10px] text-slate-400 mt-2 italic">Pastikan halaman ini tetap terbuka agar alarm berbunyi</p>
         </div>
      </div>
      
      <div className="flex flex-col gap-3 mt-8">
        <button 
            onClick={fetchStatus}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all py-4 rounded-2xl shadow-lg disabled:opacity-50"
        >
            {loading ? 'Refreshing...' : <><RefreshCw className="w-5 h-5" /> REFRESH DATA</>}
        </button>
      </div>

    </div>
  );
};

export default DriverStatus;
