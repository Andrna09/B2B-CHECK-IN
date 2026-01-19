import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Loader2, CheckCircle, Clock, Calendar, MapPin } from 'lucide-react';
import { DriverData } from '../types';
import html2canvas from 'html2canvas';

interface Props {
  data: DriverData;
  onClose: () => void;
  autoDownload?: boolean; // <--- PROPS BARU
}

const TicketPass: React.FC<Props> = ({ data, onClose, autoDownload = false }) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(""); // <--- STATE PESAN

  // --- LOGIKA DOWNLOAD UTAMA ---
  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setIsGenerating(true);
    setStatusMessage("Menyiapkan desain tiket...");

    try {
      // Tunggu 1.5 detik agar render font & gambar sempurna
      await new Promise(resolve => setTimeout(resolve, 1500));

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, // Kualitas HD
        backgroundColor: null,
        useCORS: true, // WAJIB: Agar gambar profil Google tidak bikin error
        logging: false
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Sociolla_Pass_${data.bookingCode || 'TICKET'}.png`;
      document.body.appendChild(link);
      
      link.click(); // TRIGGER DOWNLOAD OTOMATIS
      
      document.body.removeChild(link);
      setStatusMessage("Berhasil disimpan di Galeri!"); 
      
      // Bersihkan pesan sukses setelah 3 detik
      setTimeout(() => setStatusMessage(""), 3000);

    } catch (err) {
      console.error("Gagal generate tiket", err);
      setStatusMessage("Gagal otomatis. Silakan klik tombol manual.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- EFFECT: PEMICU OTOMATIS ---
  useEffect(() => {
    if (autoDownload) {
        // Beri jeda sedikit saat halaman baru terbuka
        const timer = setTimeout(() => {
            handleDownload();
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [autoDownload]);

  return (
    <div className="flex flex-col items-center justify-center w-full animate-fade-in-up relative">
      
      {/* --- NOTIFIKASI MENGAMBANG (TOAST) --- */}
      {statusMessage && (
          <div className="fixed top-24 z-[100] bg-slate-900/90 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce border border-slate-700 backdrop-blur-md">
              <p className="text-sm font-bold flex items-center gap-2">
                 {isGenerating ? <Loader2 className="animate-spin w-4 h-4 text-blue-400"/> : <CheckCircle className="w-4 h-4 text-emerald-400"/>}
                 {statusMessage}
              </p>
          </div>
      )}

      {/* --- AREA TIKET (DESAIN ASLI ANDA) --- */}
      <div className="relative p-4 w-full max-w-[380px]">
        <div 
          ref={ticketRef} 
          className="bg-white rounded-[2rem] overflow-hidden shadow-2xl relative border-[6px] border-white"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
            {/* Header / Top Section */}
            <div className="bg-[#2D2D2D] p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D46A83] rounded-full blur-[50px] opacity-40 -mr-10 -mt-10"></div>
                
                <div className="flex justify-between items-center relative z-10 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                             {/* PERBAIKAN PENTING: TAMBAH crossOrigin="anonymous" */}
                             <img 
                                src="https://play-lh.googleusercontent.com/J0NYr2cNJmhQiGbDXJHOqa4o9WhPeqC4BGuaD-YKp28KxH1xoW83A3dJyQMsaNwpx0Pv" 
                                className="w-full h-full object-cover rounded"
                                crossOrigin="anonymous" 
                                alt="Profile"
                             />
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-lg leading-none">sociolla</h3>
                            <p className="text-[8px] font-bold text-[#D46A83] uppercase tracking-widest">Official Entry Pass</p>
                        </div>
                    </div>
                    <div className="bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                            {data.entryType === 'BOOKING' ? 'PRE-BOOKED' : 'DIRECT ENTRY'}
                        </span>
                    </div>
                </div>

                {/* Main Plate Number */}
                <div className="text-center relative z-10 mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">LICENSE PLATE</p>
                    <h1 className="text-5xl font-black tracking-tighter text-white">{data.licensePlate}</h1>
                </div>
            </div>

            {/* Middle Section (Details) */}
            <div className="bg-white p-6 relative">
                 {/* Cutout Circles */}
                <div className="absolute -left-4 top-[-16px] w-8 h-8 bg-[#FDF2F4] rounded-full"></div>
                <div className="absolute -right-4 top-[-16px] w-8 h-8 bg-[#FDF2F4] rounded-full"></div>
                
                {/* Dotted Line */}
                <div className="absolute left-4 right-4 top-[-1px] border-t-2 border-dashed border-slate-300"></div>

                <div className="grid grid-cols-2 gap-y-6 mt-4">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">DRIVER NAME</p>
                        <p className="font-bold text-slate-800 text-sm truncate pr-2">{data.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">VENDOR / PT</p>
                        <p className="font-bold text-slate-800 text-sm truncate pl-2">{data.company}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">CHECK-IN SLOT</p>
                        <div className="flex items-center gap-1 text-[#D46A83] font-bold text-sm">
                            <Clock className="w-3 h-3"/> {data.slotTime || 'Now'}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">DATE</p>
                        <div className="flex items-center justify-end gap-1 text-slate-800 font-bold text-sm">
                            <Calendar className="w-3 h-3 text-slate-400"/> {data.slotDate || new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* QR Code Area */}
                <div className="mt-8 flex flex-col items-center justify-center">
                    <div className="p-3 bg-white border-4 border-[#FDF2F4] rounded-2xl shadow-sm">
                        <QRCodeSVG value={data.bookingCode} size={160} />
                    </div>
                    <p className="mt-4 font-mono font-bold text-lg sm:text-xl tracking-widest text-slate-700 text-center break-all">
                        {data.bookingCode}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Tunjukkan QR ini kepada Security</p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="bg-[#FDF2F4] p-4 border-t border-dashed border-slate-200">
                <div className="flex items-start gap-3 opacity-70">
                    <MapPin className="w-4 h-4 text-[#D46A83] shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-bold text-slate-700 uppercase">Gudang Pink - Cikupa</p>
                        <p className="text-[9px] text-slate-500 leading-tight">Pergudangan Griya Idola, Jl. Raya Serang Km 12.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- ACTION BUTTONS (Tetap Ada sebagai Backup) --- */}
      <div className="w-full max-w-sm px-4 space-y-3 mt-4 mb-10">
          <button 
            onClick={handleDownload}
            disabled={isGenerating}
            className={`w-full py-4 font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all
              ${isGenerating 
                ? 'bg-slate-100 text-slate-400 cursor-wait' 
                : 'bg-[#D46A83] text-white hover:bg-[#c0566e] hover:scale-[1.02] shadow-pink-200'}`}
          >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin"/> : <Download className="w-5 h-5"/>}
              {isGenerating ? 'Memproses...' : 'SIMPAN TIKET (GAMBAR)'}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all"
          >
              Tutup & Kembali
          </button>
      </div>

    </div>
  );
};

export default TicketPass;
