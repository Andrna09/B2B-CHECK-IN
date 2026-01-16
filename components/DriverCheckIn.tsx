import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Truck, MapPin, Calendar, CheckCircle, 
  ArrowLeft, Loader2, Check, Ticket, Edit2, Save, Camera, Image as ImageIcon, AlertCircle, HelpCircle, Search, Navigation, ToggleLeft, ToggleRight
} from 'lucide-react';
import { createCheckIn, getAvailableSlots, findBookingByCode, confirmArrivalCheckIn, updateDriverStatus, findBookingByPlateOrPhone, getDevConfig } from '../services/dataService'; 
import { EntryType, Priority, SlotInfo, DriverData, QueueStatus } from '../types';
import TicketPass from './TicketPass'; // IMPORT TICKET COMPONENT

interface Props {
  onSuccess: (driverId: string) => void;
  onBack?: () => void;
}

const TARGET_LOCATION = {
  lat: -6.226976,
  lng: 106.5446167,
  name: "Sociolla Warehouse Cikupa (Gudang Pink)",
  address: "Pergudangan Griya Idola, Jl. Raya Serang No.KM12 Blok W1"
};

const MAX_DISTANCE_METERS = 1000;

// --- HELPER: Convert File to Base64 ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const DriverCheckIn: React.FC<Props> = ({ onSuccess, onBack }) => {
  // Modes: 
  // 1. SELECT_MODE: User chooses "New Booking" or "I Have Booking"
  // 2. BOOKING_FLOW: Select Date -> Slot -> Form -> Get Code
  // 3. ARRIVAL_FLOW: Enter Code -> Verify -> CheckIn
  const [viewMode, setViewMode] = useState<'SELECT_MODE' | 'BOOKING_FLOW' | 'ARRIVAL_FLOW'>('SELECT_MODE');
  
  // -- Common State --
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<DriverData | null>(null); // STORE FULL DATA FOR TICKET
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({}); // NEW: Error Map

  // -- Booking Flow State --
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);

  // -- Arrival Flow State --
  const [bookingCodeInput, setBookingCodeInput] = useState('');
  const [searchMode, setSearchMode] = useState<'CODE' | 'MANUAL'>('CODE'); // NEW: Search Mode for Forgot Code
  const [foundBooking, setFoundBooking] = useState<DriverData | null>(null);
  const [locationCheck, setLocationCheck] = useState<{lat: number, lng: number, distance: number, valid: boolean} | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  
  // -- Arrival Edit Mode --
  const [isEditingArrival, setIsEditingArrival] = useState(false);
  const [editData, setEditData] = useState<Partial<DriverData>>({});
  const [newArrivalDoc, setNewArrivalDoc] = useState<File | null>(null); // For replacing doc at gate
  
  // -- GPS EVIDENCE MODE (New) --
  const [gpsEvidencePhoto, setGpsEvidencePhoto] = useState<File | null>(null);

  // -- DEV MODE STATE (Now read from Global Config) --
  const [isGpsBypassEnabled, setIsGpsBypassEnabled] = useState(false);

  // -- Form Data (For Booking) --
  const [poEntity, setPoEntity] = useState('SBI');
  const [poInputs, setPoInputs] = useState({ year: new Date().getFullYear().toString(), sequence: '' });
  const [plateInputs, setPlateInputs] = useState({ prefix: '', number: '', suffix: '' });
  const [formData, setFormData] = useState({
    name: '', phone: '', licensePlate: '', company: '', pic: 'Bu Santi',
    purpose: 'UNLOADING' as 'LOADING' | 'UNLOADING', doNumber: '',
    itemType: '', priority: Priority.NORMAL, notes: '', documentFile: null as File | null
  });

  useEffect(() => {
      // Check Global Dev Config on Mount
      const config = getDevConfig();
      setIsGpsBypassEnabled(config.enableGpsBypass);
  }, []);

  // --- HELPER: Clear Error on Input ---
  const clearError = (field: string) => {
      setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
      });
  };

  // --- EFFECT: Load Slots when Date Changes ---
  useEffect(() => {
    if (viewMode === 'BOOKING_FLOW') {
        loadSlots();
    }
  }, [selectedDate, viewMode]);

  const loadSlots = async () => {
      const slots = await getAvailableSlots(selectedDate);
      setAvailableSlots(slots);
      setSelectedSlot(null); // Reset selection
  };

  // --- EFFECT: PO Number Logic ---
  useEffect(() => {
    if (poEntity === 'OTHER') return;
    const cleanSeq = poInputs.sequence.replace(/\D/g, '');
    const cleanYear = poInputs.year.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, doNumber: `PO/${poEntity}/${cleanYear}/${cleanSeq}` }));
  }, [poEntity, poInputs.year, poInputs.sequence]);

  // --- EFFECT: Plate Sync ---
  useEffect(() => {
     if (formData.licensePlate) {
         const parts = formData.licensePlate.split(' ');
         if(parts.length >= 2) setPlateInputs({ prefix: parts[0]||'', number: parts[1]||'', suffix: parts.slice(2).join('')||'' });
     }
  }, []);

  const handlePlateInputChange = (part: 'prefix' | 'number' | 'suffix', value: string) => {
      let clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (part === 'number') clean = clean.replace(/\D/g, '');
      else clean = clean.replace(/[^A-Z]/g, '');
      
      const newInputs = { ...plateInputs, [part]: clean };
      setPlateInputs(newInputs);
      setFormData(prev => ({ ...prev, licensePlate: `${newInputs.prefix} ${newInputs.number} ${newInputs.suffix}`.trim() }));
      clearError('licensePlate');
  };

  // --- VALIDATION HANDLERS ---
  const validateStep2 = () => {
      const errors: Record<string, string> = {};
      if (!formData.name.trim()) errors['name'] = "Nama Driver wajib diisi";
      if (!formData.phone.trim()) errors['phone'] = "No WhatsApp wajib diisi";
      if (!plateInputs.prefix || !plateInputs.number) errors['licensePlate'] = "Plat Nomor tidak lengkap";
      
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
      const errors: Record<string, string> = {};
      if (!formData.company.trim()) errors['company'] = "Nama Vendor / PT wajib diisi";
      if (!formData.doNumber.trim() || formData.doNumber.includes('PO//')) errors['doNumber'] = "No Surat Jalan / DO wajib diisi";
      
      // --- UPDATE: Validasi File dihapus ---
      // if (!formData.documentFile) errors['documentFile'] = "Foto Surat Jalan WAJIB diupload";

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
  };

  // --- LOCATION LOGIC (Used for Arrival) ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const verifyLocation = async () => {
      setLocLoading(true);
      
      // MANAGER-CONTROLLED BYPASS (Global Config)
      if (isGpsBypassEnabled) {
          setTimeout(() => {
              setLocationCheck({
                  lat: TARGET_LOCATION.lat, 
                  lng: TARGET_LOCATION.lng,
                  distance: 50,
                  valid: true
              });
              setLocLoading(false);
          }, 800);
          return;
      }

      if (!navigator.geolocation) { alert("GPS tidak didukung browser."); setLocLoading(false); return; }
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
            const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, TARGET_LOCATION.lat, TARGET_LOCATION.lng);
            setLocationCheck({
                lat: pos.coords.latitude, lng: pos.coords.longitude,
                distance: Math.round(dist),
                valid: dist <= MAX_DISTANCE_METERS
            });
            setLocLoading(false);
        },
        (err) => {
            alert("Gagal ambil lokasi. Pastikan GPS aktif dan izin diberikan.");
            setLocLoading(false);
        }
      );
  };

  // --- SUBMIT: CREATE BOOKING ---
  const handleSubmitBooking = async () => {
    if (!validateStep3()) return; // Errors handled by UI state
    
    setIsSubmitting(true);
    try {
        // Convert file to base64 if exists (now optional)
        let docBase64: string | undefined = undefined;
        if (formData.documentFile) {
            docBase64 = await fileToBase64(formData.documentFile);
        }

        const { documentFile, ...formDataWithoutFile } = formData;
        
        const driver = await createCheckIn({
            ...formDataWithoutFile,
            entryType: EntryType.BOOKING,
            slotDate: selectedDate,
            slotTime: selectedSlot!.timeLabel
        }, docBase64); // Pass base64 string
        
        // Success - SHOW TICKET
        setSuccessData(driver);
        setIsSubmitting(false);
    } catch (e: any) {
        alert("Booking Gagal: " + e.message);
        setIsSubmitting(false);
    }
  };

  // --- SUBMIT: ARRIVAL CHECK-IN ---
  const handleFindBooking = async () => {
      if(!bookingCodeInput) return;
      setIsSubmitting(true);
      
      let booking;
      if (searchMode === 'CODE') {
          booking = await findBookingByCode(bookingCodeInput);
      } else {
          // Manual Search by Plate or Phone
          booking = await findBookingByPlateOrPhone(bookingCodeInput);
      }

      setIsSubmitting(false);
      
      if (!booking) {
          alert(searchMode === 'CODE' ? "Kode Booking tidak ditemukan." : "Data tidak ditemukan. Cek Plat Nomor atau pastikan sudah booking.");
          setFoundBooking(null);
      } else if (booking.status !== QueueStatus.BOOKED) {
          alert(`Status Booking tidak valid: ${booking.status}. (Mungkin sudah check-in?)`);
          setFoundBooking(null);
      } else {
          setFoundBooking(booking);
          // Initialize Edit Data with found booking
          setEditData({
              name: booking.name,
              licensePlate: booking.licensePlate,
              company: booking.company,
              phone: booking.phone
          });
          setNewArrivalDoc(null);
          setGpsEvidencePhoto(null); // Reset evidence
          setIsEditingArrival(false); // Default to view mode
          
          // Reset Location State
          setLocationCheck(null);
      }
  };

  const handleConfirmArrival = async () => {
      if(!foundBooking) return;
      
      setIsSubmitting(true);
      try {
          let locationNote = `GPS Dist: ${locationCheck?.distance || 'Unknown'}m`;
          
          if (isEditingArrival) {
             locationNote += ` | Edited at Gate`;
          }

          if (gpsEvidencePhoto) {
             locationNote += ` | Manual Evidence Uploaded (GPS Fail/Far)`;
          }

          if (isGpsBypassEnabled) {
              locationNote += ` | [MANAGER_BYPASS]`;
          }

          // Handle new doc file conversion
          let docBase64: string | undefined = undefined;
          if (newArrivalDoc) {
              docBase64 = await fileToBase64(newArrivalDoc);
          }

          // UPDATED: Pass edited data and new file (if any) to service
          const updated = await confirmArrivalCheckIn(foundBooking.id, locationNote, isEditingArrival ? editData : undefined, docBase64);
          onSuccess(updated.id);
      } catch (e: any) {
          alert("Gagal Check-in: " + e.message);
          setIsSubmitting(false);
      }
  };


  // --- VIEW 1: SELECT MODE ---
  if (viewMode === 'SELECT_MODE') {
      return (
        <div className="max-w-xl mx-auto animate-fade-in-up pb-20 pt-28 px-4">
             {onBack && (
                <button onClick={onBack} className="fixed top-6 left-6 z-[100] bg-white/80 p-3 rounded-full shadow-sm hover:scale-110 transition-transform">
                    <ArrowLeft className="w-5 h-5 text-slate-700"/>
                </button>
             )}
             <div className="text-center mb-10">
                <div className="inline-block p-4 bg-white rounded-3xl shadow-lg shadow-pink-100 mb-4">
                    <img src="https://play-lh.googleusercontent.com/J0NYr2cNJmhQiGbDXJHOqa4o9WhPeqC4BGuaD-YKp28KxH1xoW83A3dJyQMsaNwpx0Pv" alt="Logo" className="w-16 h-16 rounded-xl"/>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sociolla Warehouse</h2>
                <p className="text-slate-500 font-medium">Sistem Booking & Antrian</p>
                
                {isGpsBypassEnabled && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-yellow-300">
                        <AlertCircle className="w-3 h-3"/> SIMULATION MODE ACTIVE
                    </div>
                )}
            </div>

            <div className="grid gap-6">
                <button onClick={() => setViewMode('BOOKING_FLOW')} className="group bg-white p-8 rounded-[2rem] shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-left relative overflow-hidden border border-slate-100">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                            <Calendar className="w-7 h-7"/>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800">Booking Slot Baru</h3>
                        <p className="text-slate-500 mt-1">Isi data lengkap H-1 atau sebelum berangkat ke gudang.</p>
                    </div>
                </button>

                <button onClick={() => setViewMode('ARRIVAL_FLOW')} className="group bg-slate-900 p-8 rounded-[2rem] shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/50">
                            <CheckCircle className="w-7 h-7"/>
                        </div>
                        <h3 className="text-2xl font-black text-white">Check-in Kedatangan</h3>
                        <p className="text-slate-400 mt-1">Klik di sini jika sudah punya kode booking dan sudah sampai di gudang.</p>
                    </div>
                </button>
            </div>
        </div>
      );
  }

  // --- VIEW 2: BOOKING FLOW ---
  if (viewMode === 'BOOKING_FLOW') {
      // SUCCESS STATE (SHOW TICKET PASS)
      if (successData) {
          return (
             <TicketPass 
                data={successData} 
                onClose={() => {
                    setViewMode('SELECT_MODE');
                    setSuccessData(null);
                    setStep(1);
                    setFormData({ ...formData, licensePlate: '', documentFile: null }); // Reset basic
                }}
             />
          );
      }

      return (
          <div className="max-w-xl mx-auto pb-20 pt-28 px-4 animate-fade-in-up">
              <button onClick={() => setViewMode('SELECT_MODE')} className="fixed top-6 left-6 z-[100] bg-white/80 p-3 rounded-full shadow-sm hover:scale-110 transition-transform flex items-center gap-2 text-sm font-bold text-slate-600 pr-5">
                 <ArrowLeft className="w-5 h-5"/> BATAL
              </button>

              {/* Progress Stepper */}
              <div className="flex gap-2 mb-8">
                  {[1,2,3].map(i => (
                      <div key={i} className={`h-2 flex-1 rounded-full transition-all ${step >= i ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                  ))}
              </div>

              {/* STEP 1: SELECT SLOT */}
              {step === 1 && (
                  <div className="space-y-6">
                      <div className="text-center mb-6">
                          <h2 className="text-3xl font-black text-slate-900">Pilih Jadwal</h2>
                          <p className="text-slate-500">Tentukan rencana kedatangan Anda.</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Tanggal Kedatangan</label>
                          <input 
                              type="date" 
                              className="w-full text-lg font-bold p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              min={new Date().toISOString().slice(0, 10)}
                          />
                      </div>

                      <div className="grid gap-3">
                          {availableSlots.map((slot) => (
                              <button 
                                  key={slot.id}
                                  disabled={!slot.isAvailable}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`p-5 rounded-2xl border-2 transition-all flex justify-between items-center group
                                      ${!slot.isAvailable ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' : 
                                        selectedSlot?.id === slot.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02]' : 'bg-white border-slate-100 hover:border-blue-300'}`}
                              >
                                  <div className="text-left">
                                      <div className={`text-lg font-black ${selectedSlot?.id === slot.id ? 'text-white' : 'text-slate-800'}`}>{slot.timeLabel}</div>
                                      <div className={`text-xs font-bold uppercase ${selectedSlot?.id === slot.id ? 'text-blue-200' : 'text-slate-400'}`}>
                                          {slot.isAvailable ? 'Tersedia' : 'Penuh'}
                                      </div>
                                  </div>
                                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedSlot?.id === slot.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                      Sisa {slot.capacity - slot.booked} Slot
                                  </div>
                              </button>
                          ))}
                      </div>

                      <button 
                          disabled={!selectedSlot}
                          onClick={() => setStep(2)}
                          className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-[1.02] transition-transform"
                      >
                          Lanjut: Isi Data Driver
                      </button>
                  </div>
              )}

              {/* STEP 2: DATA DRIVER (Updated Validation) */}
              {step === 2 && (
                  <div className="space-y-6">
                      <h2 className="text-2xl font-black text-slate-900">Identitas Driver</h2>
                      <p className="text-sm text-slate-500">Lengkapi data ini sekarang agar nanti di gerbang tinggal scan saja.</p>
                      
                      {/* Name & Phone */}
                      <div>
                          <input 
                            type="text" 
                            placeholder="Nama Lengkap" 
                            className={`w-full p-4 bg-white rounded-2xl border-2 font-bold outline-none focus:border-blue-500 ${validationErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} 
                            value={formData.name} 
                            onChange={e=>{ setFormData({...formData, name:e.target.value}); clearError('name'); }}
                          />
                          {validationErrors.name && <p className="text-xs text-red-500 font-bold mt-1 ml-2">{validationErrors.name}</p>}
                      </div>

                      <div>
                          <input 
                            type="tel" 
                            placeholder="Nomor WhatsApp" 
                            className={`w-full p-4 bg-white rounded-2xl border-2 font-bold outline-none focus:border-blue-500 ${validationErrors.phone ? 'border-red-500 bg-red-50' : 'border-slate-100'}`}
                            value={formData.phone} 
                            onChange={e=>{ setFormData({...formData, phone:e.target.value}); clearError('phone'); }}
                          />
                          {validationErrors.phone && <p className="text-xs text-red-500 font-bold mt-1 ml-2">{validationErrors.phone}</p>}
                      </div>
                      
                      {/* Plate */}
                      <div>
                          <div className="flex gap-2">
                              <input type="text" placeholder="B" className={`w-1/4 p-4 bg-white rounded-2xl border-2 font-black text-center outline-none focus:border-blue-500 uppercase ${validationErrors.licensePlate ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} value={plateInputs.prefix} onChange={e=>handlePlateInputChange('prefix', e.target.value)}/>
                              <input type="tel" placeholder="1234" className={`flex-1 p-4 bg-white rounded-2xl border-2 font-black text-center outline-none focus:border-blue-500 ${validationErrors.licensePlate ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} value={plateInputs.number} onChange={e=>handlePlateInputChange('number', e.target.value)}/>
                              <input type="text" placeholder="XYZ" className={`w-1/3 p-4 bg-white rounded-2xl border-2 font-black text-center outline-none focus:border-blue-500 uppercase ${validationErrors.licensePlate ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} value={plateInputs.suffix} onChange={e=>handlePlateInputChange('suffix', e.target.value)}/>
                          </div>
                          {validationErrors.licensePlate && <p className="text-xs text-red-500 font-bold mt-1 ml-2">{validationErrors.licensePlate}</p>}
                      </div>

                      <div className="flex gap-4">
                          <button onClick={() => setStep(1)} className="px-6 py-4 font-bold text-slate-500">Kembali</button>
                          <button onClick={() => { if(validateStep2()) setStep(3); }} className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl">Lanjut</button>
                      </div>
                  </div>
              )}

              {/* STEP 3: CARGO & PO (UPDATED: Document Upload Removed) */}
              {step === 3 && (
                  <div className="space-y-6">
                      <h2 className="text-2xl font-black text-slate-900">Detail Muatan</h2>
                      
                      {/* Purpose */}
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setFormData({...formData, purpose: 'UNLOADING'})} className={`p-4 rounded-xl border-2 font-bold ${formData.purpose === 'UNLOADING' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white text-slate-400'}`}>BONGKAR</button>
                          <button onClick={() => setFormData({...formData, purpose: 'LOADING'})} className={`p-4 rounded-xl border-2 font-bold ${formData.purpose === 'LOADING' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-slate-400'}`}>MUAT</button>
                      </div>

                      {/* Vendor Name */}
                      <div>
                          <input 
                            type="text" 
                            placeholder="Nama Vendor / PT" 
                            className={`w-full p-4 bg-white rounded-2xl border-2 font-bold outline-none focus:border-blue-500 ${validationErrors.company ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} 
                            value={formData.company} 
                            onChange={e=>{ setFormData({...formData, company:e.target.value}); clearError('company'); }}
                          />
                          {validationErrors.company && <p className="text-xs text-red-500 font-bold mt-1 ml-2">{validationErrors.company}</p>}
                      </div>

                      {/* PO Type */}
                      <div className="flex gap-2 overflow-x-auto pb-2">
                          {['SBI', 'SDI', 'SRI', 'OTHER'].map(ent => (
                              <button key={ent} onClick={() => setPoEntity(ent)} className={`px-4 py-2 rounded-lg font-bold border-2 whitespace-nowrap ${poEntity === ent ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500'}`}>{ent}</button>
                          ))}
                      </div>

                      {/* PO Input */}
                      {poEntity === 'OTHER' ? (
                          <div>
                              <input 
                                type="text" 
                                placeholder="No. Surat Jalan Manual" 
                                className={`w-full p-4 bg-white rounded-2xl border-2 font-bold outline-none focus:border-blue-500 ${validationErrors.doNumber ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} 
                                value={formData.doNumber} 
                                onChange={e=>{ setFormData({...formData, doNumber:e.target.value}); clearError('doNumber'); }}
                              />
                              {validationErrors.doNumber && <p className="text-xs text-red-500 font-bold mt-1 ml-2">{validationErrors.doNumber}</p>}
                          </div>
                      ) : (
                          <div className="flex gap-2">
                              <input type="text" value={poInputs.year} onChange={e=>setPoInputs({...poInputs, year:e.target.value})} className="w-1/3 p-4 bg-white rounded-2xl border-2 border-slate-100 font-bold text-center" placeholder="YYYY"/>
                              <input type="text" value={poInputs.sequence} onChange={e=>setPoInputs({...poInputs, sequence:e.target.value})} className="flex-1 p-4 bg-white rounded-2xl border-2 border-slate-100 font-bold" placeholder="Nomor Urut"/>
                          </div>
                      )}
                      
                      {/* Document Upload Section REMOVED Here */}

                      <div className="mt-6">
                          {/* VALIDATION ERROR TEXT */}
                          {Object.keys(validationErrors).length > 0 && (
                              <div className="mb-3 text-center bg-red-100 text-red-600 p-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 animate-pulse">
                                  <AlertCircle className="w-4 h-4" /> Lengkapi data yang ditandai merah
                              </div>
                          )}

                          <div className="flex gap-4">
                              <button onClick={() => setStep(2)} className="px-6 py-4 font-bold text-slate-500">Kembali</button>
                              <button 
                                  onClick={handleSubmitBooking} 
                                  disabled={isSubmitting} 
                                  className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all
                                    ${Object.keys(validationErrors).length > 0 ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                              >
                                  {isSubmitting ? <Loader2 className="animate-spin"/> : "KONFIRMASI BOOKING"}
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- VIEW 3: ARRIVAL FLOW (CHECK-IN) ---
  if (viewMode === 'ARRIVAL_FLOW') {
      return (
          <div className="max-w-md mx-auto pt-28 px-4 animate-fade-in-up pb-20">
              <button onClick={() => setViewMode('SELECT_MODE')} className="fixed top-6 left-6 z-[100] bg-white/80 p-3 rounded-full shadow-sm hover:scale-110 transition-transform">
                 <ArrowLeft className="w-5 h-5 text-slate-700"/>
              </button>

              <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-white/50">
                  <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Arrival Check-in</h2>
                  
                  {/* DEV MODE BANNER (If Enabled Globally) */}
                  {isGpsBypassEnabled && (
                      <div className="mb-6 bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center animate-pulse">
                          <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide flex items-center justify-center gap-2">
                               <AlertCircle className="w-4 h-4"/> SIMULATION MODE
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">
                              Validasi GPS dimatikan oleh Manager.
                          </p>
                      </div>
                  )}

                  {!foundBooking ? (
                      <div className="space-y-4">
                          <div className="relative">
                              {searchMode === 'CODE' ? (
                                  <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                              ) : (
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                              )}
                              <input 
                                  type="text" 
                                  placeholder={searchMode === 'CODE' ? "Kode Booking (Cth: SOC-1234)" : "Plat Nomor atau No WA"}
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-lg text-slate-800 uppercase placeholder:normal-case placeholder:font-medium focus:border-blue-500 outline-none"
                                  value={bookingCodeInput}
                                  onChange={e => setBookingCodeInput(e.target.value)}
                              />
                          </div>
                          
                          <button 
                              onClick={handleFindBooking}
                              disabled={isSubmitting || !bookingCodeInput}
                              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 flex justify-center items-center gap-2"
                          >
                              {isSubmitting ? <Loader2 className="animate-spin"/> : (searchMode === 'CODE' ? "CARI BOOKING" : "CARI MANUAL")}
                          </button>

                          {/* TOGGLE SEARCH MODE */}
                          <button 
                              onClick={() => {
                                  setSearchMode(searchMode === 'CODE' ? 'MANUAL' : 'CODE');
                                  setBookingCodeInput('');
                              }}
                              className="w-full py-2 text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors"
                          >
                              {searchMode === 'CODE' ? (
                                  <><HelpCircle className="w-3 h-3"/> Lupa Kode Booking? Cari Manual</>
                              ) : (
                                  <><Ticket className="w-3 h-3"/> Kembali ke Scan Kode Booking</>
                              )}
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          {/* Booking Details Card (Read Only by default) */}
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
                                <div className="absolute top-4 right-4">
                                     {!isEditingArrival ? (
                                        <button onClick={() => setIsEditingArrival(true)} className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100">
                                            <Edit2 className="w-3 h-3"/> Ubah Data
                                        </button>
                                     ) : (
                                         <button onClick={() => setIsEditingArrival(false)} className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                                            Batal Ubah
                                         </button>
                                     )}
                                </div>

                                {!isEditingArrival ? (
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase">Driver</p>
                                                <p className="text-xl font-black text-slate-800">{foundBooking.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Plat No</p>
                                                <p className="text-xl font-black text-slate-800">{foundBooking.licensePlate}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">{foundBooking.slotTime}</span>
                                            <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">{foundBooking.slotDate}</span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <p className="text-xs text-slate-500 font-medium">PT: {foundBooking.company}</p>
                                        </div>
                                        {/* Show existing doc thumbnail if present */}
                                        {foundBooking.documentFile && (
                                            <div className="mt-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Dokumen Terlampir</p>
                                                <img src={foundBooking.documentFile} className="h-16 w-16 object-cover rounded-lg border border-slate-200" alt="Doc"/>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="space-y-3 pt-4">
                                        <p className="text-xs font-bold text-orange-500 mb-2 flex items-center gap-1"><Edit2 className="w-3 h-3"/> MODE EDIT (REVISI DATA)</p>
                                        
                                        <input 
                                            className="w-full p-2 border rounded-lg text-sm font-bold" 
                                            placeholder="Ganti Plat Nomor"
                                            value={editData.licensePlate || ''}
                                            onChange={e => setEditData({...editData, licensePlate: e.target.value})}
                                        />
                                        <input 
                                            className="w-full p-2 border rounded-lg text-sm font-bold" 
                                            placeholder="Ganti Nama Driver"
                                            value={editData.name || ''}
                                            onChange={e => setEditData({...editData, name: e.target.value})}
                                        />
                                        
                                        {/* DOCUMENT RE-UPLOAD */}
                                        <div className="mt-2">
                                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Ganti Foto Dokumen (Opsional)</label>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                capture="environment"
                                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                onChange={(e) => { if(e.target.files?.[0]) setNewArrivalDoc(e.target.files[0]); }}
                                            />
                                            {newArrivalDoc && <p className="text-[10px] text-green-600 mt-1">File baru dipilih: {newArrivalDoc.name}</p>}
                                        </div>

                                        <p className="text-[10px] text-slate-400 italic">Perubahan akan disimpan saat check-in.</p>
                                    </div>
                                )}
                          </div>

                          {/* Location Check (With Evidence Mode) */}
                          <div className={`p-4 rounded-xl border-2 transition-all ${
                              locLoading ? 'bg-slate-50 border-slate-100' :
                              !locationCheck ? 'bg-blue-50 border-blue-200' : // Not Checked Yet
                              locationCheck.valid ? 'bg-emerald-50 border-emerald-200' : 
                              'bg-orange-50 border-orange-200'
                          }`}>
                              
                              {/* --- NEW: MANUAL GPS TRIGGER BUTTON --- */}
                              {!locationCheck && !locLoading ? (
                                  <div className="flex flex-col items-center text-center py-2">
                                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                          <MapPin className="w-6 h-6" />
                                      </div>
                                      <h3 className="font-bold text-slate-800 mb-1">Verifikasi Lokasi</h3>
                                      <p className="text-xs text-slate-500 mb-4 px-4">
                                          Sistem perlu memastikan Anda berada di area gudang. Klik tombol di bawah.
                                      </p>
                                      <button 
                                        onClick={verifyLocation}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                      >
                                          <Navigation className="w-4 h-4"/> CEK LOKASI GPS {isGpsBypassEnabled && '(SIMULATION)'}
                                      </button>
                                  </div>
                              ) : (
                                  <>
                                    <div className="flex items-center gap-3">
                                        {locLoading ? <Loader2 className="animate-spin text-slate-400"/> : locationCheck?.valid ? <CheckCircle className="text-emerald-500"/> : <MapPin className="text-orange-500"/>}
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{locLoading ? 'Mengecek Lokasi...' : locationCheck?.valid ? 'Lokasi Terkonfirmasi' : 'Lokasi Tidak Sesuai'}</p>
                                            {!locLoading && <p className="text-xs text-slate-500">Jarak: {locationCheck?.distance || '?'}m (Max {MAX_DISTANCE_METERS}m)</p>}
                                        </div>
                                    </div>
                                    
                                    {/* EVIDENCE MODE: If Location Invalid or Null, Show Camera Upload */}
                                    {!locLoading && (!locationCheck || !locationCheck.valid) && (
                                        <div className="mt-4 pt-4 border-t border-orange-200/50">
                                            <div className="flex items-center gap-2 mb-2 text-orange-700">
                                                <AlertCircle className="w-4 h-4" />
                                                <p className="text-xs font-bold">GPS Error / Terlalu Jauh?</p>
                                            </div>
                                            <p className="text-[11px] text-orange-600 mb-3 leading-tight">
                                                Sistem mendeteksi Anda belum di area gudang. Jika ini kesalahan GPS, <strong>wajib upload foto selfie di depan gerbang</strong> sebagai bukti.
                                            </p>
                                            
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                capture="environment"
                                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                                                onChange={(e) => { if(e.target.files?.[0]) setGpsEvidencePhoto(e.target.files[0]); }}
                                            />
                                            {gpsEvidencePhoto && (
                                                <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3"/> Bukti Foto Terlampir
                                                </div>
                                            )}
                                        </div>
                                    )}
                                  </>
                              )}
                          </div>

                          <div className="flex gap-3">
                              <button onClick={() => { setFoundBooking(null); setBookingCodeInput(''); setIsEditingArrival(false); setNewArrivalDoc(null); setGpsEvidencePhoto(null); }} className="px-4 py-4 font-bold text-slate-400 hover:text-slate-600">Batal</button>
                              
                              {/* DISABLED Logic: 
                                  1. If submitting -> Disabled
                                  2. If Location NOT Valid AND No Evidence Photo -> Disabled
                              */}
                              <button 
                                  onClick={handleConfirmArrival}
                                  disabled={isSubmitting || ((!locationCheck?.valid) && !gpsEvidencePhoto)}
                                  className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2
                                    ${((!locationCheck?.valid) && !gpsEvidencePhoto) ? 'bg-slate-300 cursor-not-allowed opacity-70' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                              >
                                  {isSubmitting ? <Loader2 className="animate-spin"/> : isEditingArrival ? 'SIMPAN & CHECK-IN' : (!locationCheck?.valid && gpsEvidencePhoto) ? 'CHECK-IN DGN BUKTI' : 'YA, CHECK-IN SEKARANG'}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return null;
};

export default DriverCheckIn;
