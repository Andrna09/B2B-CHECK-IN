import { ActivityLog, DivisionConfig, DriverData, EntryType, Gate, GateConfig, Priority, QueueStatus, SlotInfo, UserProfile } from '../types';

// --- LOCAL STORAGE KEYS ---
const DB_KEY_DRIVERS = 'yms_drivers_v1';
const DB_KEY_GATES = 'yms_gates_v1';
const DB_KEY_USERS = 'yms_users_v1';
const DB_KEY_DIVISIONS = 'yms_divisions_v1';
const DB_KEY_LOGS = 'yms_logs_v1';
const DB_KEY_CONFIG = 'yms_dev_config';
const DB_KEY_WA_GROUP = 'wa_group_id';

// --- INITIAL DATA SEEDING ---
const seedLocalData = () => {
    if (!localStorage.getItem(DB_KEY_GATES)) {
        const defaultGates: GateConfig[] = [
            { id: 'GATE_1', name: 'GATE 1 (Utama)', capacity: 5, status: 'OPEN', type: 'GENERAL' },
            { id: 'DOCK_1', name: 'Loading Dock A', capacity: 1, status: 'OPEN', type: 'DOCK' },
            { id: 'DOCK_2', name: 'Loading Dock B', capacity: 1, status: 'OPEN', type: 'DOCK' },
        ];
        localStorage.setItem(DB_KEY_GATES, JSON.stringify(defaultGates));
    }
    if (!localStorage.getItem(DB_KEY_USERS)) {
        const defaultUsers: UserProfile[] = [
            { id: 'SECURITY', name: 'Pak Satpam', role: 'SECURITY', pin_code: '1234', status: 'ACTIVE' },
            { id: 'ADMIN', name: 'Admin Ops', role: 'ADMIN', pin_code: '1234', status: 'ACTIVE' },
            { id: 'MANAGER', name: 'Manager Logistik', role: 'MANAGER', pin_code: '1234', status: 'ACTIVE' }
        ];
        localStorage.setItem(DB_KEY_USERS, JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem(DB_KEY_DIVISIONS)) {
        const defaultDivs: DivisionConfig[] = [
            { id: 'SECURITY', name: 'Pos Security', password: '1234', role: 'SECURITY', theme: 'emerald' },
            { id: 'ADMIN', name: 'Traffic Control', password: '1234', role: 'ADMIN', theme: 'blue' },
            { id: 'MANAGER', name: 'System Admin', password: '1234', role: 'MANAGER', theme: 'purple' }
        ];
        localStorage.setItem(DB_KEY_DIVISIONS, JSON.stringify(defaultDivs));
    }
};

seedLocalData();

// --- HELPER ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStorage = <T>(key: string, defaultVal: T): T => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
};

const setStorage = (key: string, val: any) => {
    localStorage.setItem(key, JSON.stringify(val));
};

export const getWAGroupID = (): string => {
    return localStorage.getItem(DB_KEY_WA_GROUP) || '120363423657558569@g.us';
};

export const saveWAGroupID = (id: string) => {
    localStorage.setItem(DB_KEY_WA_GROUP, id);
};

// --- 🔥 WHATSAPP ENGINE (REVISED & SECURE) 🔥 ---
const sendWANotification = async (target: string, message: string) => {
    if (!target) return false;
    
    // 1. Bersihkan nomor HP (hanya ambil angka) agar format sesuai
    const cleanTarget = target.replace(/[^0-9]/g, '');

    try {
        console.log(`[WA DEBUG] Mengirim ke: ${cleanTarget}`);

        const response = await fetch('/api/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: cleanTarget, message }),
        });

        const result = await response.json();

        // 2. Cek apakah Server menolak (Status bukan 200 OK)
        if (!response.ok) {
            console.error("[WA ERROR] Server menolak:", result);
            return false;
        }

        // 3. Cek apakah Fonnte menolak (Status false dalam body response)
        if (result.status === false) {
             console.error("[WA ERROR] Fonnte menolak:", result);
             return false;
        }

        console.log("[WA SUKSES] Terkirim:", result);
        return true;

    } catch (error) {
        console.error("[WA SYSTEM ERROR] Koneksi gagal:", error);
        return false;
    }
};

// --- DRIVER SERVICES ---

export const getDrivers = async (): Promise<DriverData[]> => {
    await delay(200);
    return getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
};

export const getDriverById = async (id: string): Promise<DriverData | null> => {
    await delay(100);
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    return drivers.find(d => d.id === id) || null;
};

export const createCheckIn = async (data: Partial<DriverData>, docFile?: string): Promise<DriverData> => {
    await delay(500);
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    const newId = `DRV-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    
    // --- GENERATE SEQUENTIAL TICKET CODE ---
    // Format: SOC-IN-YYYYMM-XXXXXX
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `SOC-IN-${period}-`;

    // Cari sequence terakhir untuk bulan ini
    let maxSeq = 0;
    drivers.forEach(d => {
        if (d.bookingCode && d.bookingCode.startsWith(prefix)) {
            const parts = d.bookingCode.split('-');
            const seqStr = parts[parts.length - 1]; 
            const seq = parseInt(seqStr, 10);
            if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
            }
        }
    });

    // Increment sequence
    const nextSeq = maxSeq + 1;
    const unique = nextSeq.toString().padStart(6, '0');
    const bookingCode = `${prefix}${unique}`;

    const newDriver: DriverData = {
        ...data as DriverData,
        id: newId,
        bookingCode: bookingCode,
        status: QueueStatus.BOOKED,
        checkInTime: Date.now(),
        documentFile: docFile,
        gate: Gate.NONE,
        queueNumber: '-',
    };

    drivers.push(newDriver);
    setStorage(DB_KEY_DRIVERS, drivers);

    // [TEMPLATE #1] KONFIRMASI BOOKING
    if (newDriver.phone) {
        const msg = `KONFIRMASI BOOKING BERHASIL ✅\n` +
                    `Halo ${newDriver.name},\n` +
                    `Booking Anda telah terdaftar.\n\n` +
                    `📋 Kode Booking: ${bookingCode}\n` +
                    `🚛 No. Polisi: ${newDriver.licensePlate}\n` +
                    `🏭 Perusahaan: ${newDriver.company}\n\n` +
                    `Harap datang 15 menit lebih awal dan siapkan dokumen.\n` +
                    `Terima kasih!`;
        sendWANotification(newDriver.phone, msg);
    }

    return newDriver;
};

export const confirmArrivalCheckIn = async (id: string, notes: string, editData?: Partial<DriverData>, newDoc?: string): Promise<DriverData> => {
    await delay(300);
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    const idx = drivers.findIndex(d => d.id === id);
    if (idx === -1) throw new Error("Driver not found");

    const updatedDriver = {
        ...drivers[idx],
        ...editData,
        status: QueueStatus.AT_GATE,
        arrivedAtGateTime: Date.now(),
        securityNotes: notes,
        documentFile: newDoc || drivers[idx].documentFile
    };

    drivers[idx] = updatedDriver;
    setStorage(DB_KEY_DRIVERS, drivers);
    return updatedDriver;
};

export const verifyDriver = async (id: string, verifier: string, notes: string, photos: string[]): Promise<boolean> => {
    await delay(300);
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    const idx = drivers.findIndex(d => d.id === id);
    if (idx === -1) return false;

    const verifiedCount = drivers.filter(d => d.status === QueueStatus.VERIFIED).length;
    const queueNumber = `Q-${(verifiedCount + 1).toString().padStart(3, '0')}`;

    const updatedDriver = {
        ...drivers[idx],
        status: QueueStatus.VERIFIED,
        verifiedBy: verifier,
        verifiedTime: Date.now(),
        securityNotes: notes,
        queueNumber: queueNumber,
        photoBeforeURLs: photos
    };

    drivers[idx] = updatedDriver;
    setStorage(DB_KEY_DRIVERS, drivers);

    // [TEMPLATE #2A] TIKET ANTRIAN (DRIVER)
    if (updatedDriver.phone) {
        const msg = `TIKET ANTRIAN ANDA 🎫\n` +
                    `Halo ${updatedDriver.name},\n` +
                    `Check-in Disetujui!\n\n` +
                    `🔢 Nomor Antrian: #${queueNumber}\n` +
                    `📍 Silakan tunggu panggilan via WhatsApp.\n` +
                    `Sociolla Warehouse Management`;
        sendWANotification(updatedDriver.phone, msg);
    }

    // [TEMPLATE #2B] NOTIF GROUP
    const groupID = getWAGroupID();
    const groupMsg = `NOTIFIKASI OPERASIONAL 📦\n` +
                     `STATUS: ENTRY APPROVED ✅\n\n` +
                     `🚛 Unit: ${updatedDriver.licensePlate}\n` +
                     `👤 Driver: ${updatedDriver.name}\n` +
                     `🔢 Antrian: #${queueNumber}\n` +
                     `👮 Petugas: ${verifier}`;
    sendWANotification(groupID, groupMsg);

    return true;
};

export const rejectDriver = async (id: string, reason: string, verifier: string): Promise<boolean> => {
    await delay(300);
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    const idx = drivers.findIndex(d => d.id === id);
    if (idx === -1) return false;

    drivers[idx].status = QueueStatus.REJECTED;
    drivers[idx].rejectionReason = reason;
    drivers[idx].verifiedBy = verifier;

    setStorage(DB_KEY_DRIVERS, drivers);

    // [TEMPLATE #3] REJECT NOTIFICATION
    if (drivers[idx].phone) {
        const msg = `BOOKING DITOLAK ❌\n` +
                    `Halo ${drivers[idx].name},\n` +
                    `Mohon maaf, booking Anda tidak dapat diproses.\n\n` +
                    `🛑 Alasan: ${reason}\n\n` +
                    `Silakan hubungi admin untuk info lebih lanjut.`;
        sendWANotification(drivers[idx].phone, msg);
    }
    return true;
};

export const callDriver = async (id: string, caller: string, gate: string): Promise<boolean> => {
    await delay(300);
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    const idx = drivers.findIndex(d => d.id === id);
    if (idx === -1) return false;

    drivers[idx].status = QueueStatus.CALLED;
    drivers[idx].gate = gate as Gate;
    drivers[idx].calledBy = caller;
    drivers[idx].calledTime = Date.now();

    setStorage(DB_KEY_DRIVERS, drivers);
    
    // WA Panggilan
    if (drivers[idx].phone) {
        const msg = `PANGGILAN ANTRIAN 📢\n` +
                    `Halo ${drivers[idx].name},\n` +
                    `Silakan merapat ke ${gate.replace('_', ' ')} SEKARANG.\n` +
                    `Tim bongkar muat sudah menunggu.`;
        sendWANotification(drivers[idx].phone, msg);
    }
    
    return true;
};

export const updateDriverStatus = async (id: string, status: QueueStatus): Promise<boolean> => {
    await delay(300);
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    const idx = drivers.findIndex(d => d.id === id);
    if (idx === -1) return false;

    drivers[idx].status = status;
    if (status === QueueStatus.LOADING) drivers[idx].loadingStartTime = Date.now();

    setStorage(DB_KEY_DRIVERS, drivers);
    return true;
};

export const checkoutDriver = async (id: string, verifier: string, notes: string, photos: string[]): Promise<boolean> => {
    await delay(300);
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    const idx = drivers.findIndex(d => d.id === id);
    if (idx === -1) return false;

    const startTime = drivers[idx].checkInTime || Date.now();
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 60000);

    drivers[idx].status = QueueStatus.EXITED;
    drivers[idx].exitVerifiedBy = verifier;
    drivers[idx].exitTime = endTime;
    drivers[idx].notes = notes;
    drivers[idx].photoAfterURLs = photos;

    setStorage(DB_KEY_DRIVERS, drivers);

    // [TEMPLATE #4] CHECKOUT NOTIFICATION
    if (drivers[idx].phone) {
        const msg = `CHECKOUT BERHASIL ✅\n` +
                    `Terima kasih ${drivers[idx].name}!\n` +
                    `Kunjungan Anda telah selesai.\n\n` +
                    `⏱️ Durasi Total: ${duration} Menit\n` +
                    `Hati-hati di jalan! 🚚💨`;
        sendWANotification(drivers[idx].phone, msg);
    }
    return true;
};

// --- LOOKUP UTILS ---
export const findBookingByCode = async (code: string): Promise<DriverData | null> => {
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    return drivers.find(d => d.bookingCode === code) || null;
};

export const findBookingByPlateOrPhone = async (query: string): Promise<DriverData | null> => {
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    const q = query.toLowerCase();
    return drivers.find(d =>
        (d.licensePlate.toLowerCase().includes(q) || d.phone === q) &&
        [QueueStatus.BOOKED].includes(d.status)
    ) || null;
};

export const scanDriverQR = async (id: string): Promise<DriverData | null> => {
    let driver = await getDriverById(id);
    if (!driver) driver = await findBookingByCode(id);
    return driver;
};

// --- UPDATED: GET AVAILABLE SLOTS (1 Hour Intervals & Break Logic) ---
export const getAvailableSlots = async (date: string): Promise<SlotInfo[]> => {
    // 1. Cek Hari (0 = Minggu, 1 = Senin, ... 5 = Jumat, 6 = Sabtu)
    // Menggunakan 'T00:00:00' agar tanggal dibaca sesuai waktu lokal
    const dayOfWeek = new Date(date + 'T00:00:00').getDay(); 

    // 2. LOGIC MINGGU LIBUR
    if (dayOfWeek === 0) {
        return []; // Array kosong = Tidak ada slot (Libur)
    }

    // 3. Daftar Slot Dasar (Per 1 Jam, Mulai 08:00 sampai 17:00)
    const baseSlots = [
        "08:00 - 09:00",
        "09:00 - 10:00",
        "10:00 - 11:00",
        "11:00 - 12:00", // Slot ini rawan istirahat Jumat
        "12:00 - 13:00", // Slot ini rawan istirahat Umum
        "13:00 - 14:00",
        "14:00 - 15:00",
        "15:00 - 16:00",
        "16:00 - 17:00"
    ];

    let activeSlots: string[] = [];

    // 4. Filter Berdasarkan Hari
    if (dayOfWeek === 5) {
        // --- JUMAT (Istirahat 11:00 - 13:00) ---
        // Kita hapus slot yang mulai jam 11 dan jam 12
        activeSlots = baseSlots.filter(t => !t.startsWith("11:00") && !t.startsWith("12:00"));
    } else {
        // --- SENIN - KAMIS & SABTU (Istirahat 12:00 - 13:00) ---
        // Kita hapus slot yang mulai jam 12 saja
        activeSlots = baseSlots.filter(t => !t.startsWith("12:00"));
    }

    // 5. Hitung Sisa Kapasitas (Kapasitas = 3)
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    return activeSlots.map(t => {
        const booked = drivers.filter(d => d.slotDate === date && d.slotTime === t && d.status !== QueueStatus.CANCELLED).length;
        // KAPASITAS DIUBAH JADI 3
        return { id: t, timeLabel: t, capacity: 3, booked, isAvailable: booked < 3 };
    });
};

// --- MASTER DATA MANAGEMENT ---
export const getGateConfigs = async (): Promise<GateConfig[]> => { await delay(100); return getStorage<GateConfig[]>(DB_KEY_GATES, []); };
export const saveGateConfig = async (gate: GateConfig): Promise<boolean> => {
    const gates = getStorage<GateConfig[]>(DB_KEY_GATES, []);
    const idx = gates.findIndex(g => g.id === gate.id);
    if (idx >= 0) gates[idx] = gate; else gates.push(gate);
    setStorage(DB_KEY_GATES, gates);
    return true;
};
export const deleteSystemSetting = async (id: string): Promise<boolean> => {
    let gates = getStorage<GateConfig[]>(DB_KEY_GATES, []);
    gates = gates.filter(g => g.id !== id);
    setStorage(DB_KEY_GATES, gates);
    return true;
};
export const getProfiles = async (): Promise<UserProfile[]> => { await delay(100); return getStorage<UserProfile[]>(DB_KEY_USERS, []); };
export const addProfile = async (user: UserProfile): Promise<boolean> => {
    const users = getStorage<UserProfile[]>(DB_KEY_USERS, []);
    if (users.find(u => u.id === user.id)) return false;
    users.push(user);
    setStorage(DB_KEY_USERS, users);
    return true;
};
export const updateProfile = async (user: Partial<UserProfile>): Promise<boolean> => {
    const users = getStorage<UserProfile[]>(DB_KEY_USERS, []);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return false;
    users[idx] = { ...users[idx], ...user };
    setStorage(DB_KEY_USERS, users);
    return true;
};
export const deleteProfile = async (id: string): Promise<boolean> => {
    let users = getStorage<UserProfile[]>(DB_KEY_USERS, []);
    users = users.filter(u => u.id !== id);
    setStorage(DB_KEY_USERS, users);
    return true;
};
export const getDivisions = async (): Promise<DivisionConfig[]> => { await delay(100); return getStorage<DivisionConfig[]>(DB_KEY_DIVISIONS, []); };
export const saveDivision = async (div: DivisionConfig): Promise<boolean> => {
    const divs = getStorage<DivisionConfig[]>(DB_KEY_DIVISIONS, []);
    const idx = divs.findIndex(d => d.id === div.id);
    if (idx >= 0) divs[idx] = div; else divs.push(div);
    setStorage(DB_KEY_DIVISIONS, divs);
    return true;
};
export const deleteDivision = async (id: string): Promise<boolean> => {
    let divs = getStorage<DivisionConfig[]>(DB_KEY_DIVISIONS, []);
    divs = divs.filter(d => d.id !== id);
    setStorage(DB_KEY_DIVISIONS, divs);
    return true;
};

// --- LOGIN SYSTEMS (IMPROVED) ---

export const loginSystem = async (id: string, pass: string): Promise<UserProfile> => {
    await delay(500);
    const users = getStorage<UserProfile[]>(DB_KEY_USERS, []);
    
    // 1. Normalisasi Input (Bersihkan spasi & uppercase)
    const cleanId = id.trim().toUpperCase(); 
    const cleanPass = pass.trim();

    // 2. Cari User dulu (Case Insensitive)
    const user = users.find(u => u.id.toUpperCase() === cleanId || u.name.toUpperCase() === cleanId);

    if (!user) {
        throw new Error("Username/ID tidak ditemukan.");
    }

    // 3. Cek Password/PIN
    if (user.pin_code !== cleanPass) {
        throw new Error("PIN/Password salah.");
    }

    return user;
};

export const verifyDivisionCredential = async (id: string, pass: string): Promise<DivisionConfig | null> => {
    await delay(500);
    const divs = getStorage<DivisionConfig[]>(DB_KEY_DIVISIONS, []);
    
    const cleanId = id.trim().toUpperCase();
    const cleanPass = pass.trim();

    // 1. Cari Divisi dulu (Case Insensitive)
    const div = divs.find(d => d.id.toUpperCase() === cleanId);

    if (!div) {
        throw new Error("ID Divisi tidak terdaftar.");
    }

    // 2. Cek Password Divisi
    if (div.password !== cleanPass) {
        throw new Error("Password Divisi salah.");
    }

    return div;
};

export const getActivityLogs = async (): Promise<ActivityLog[]> => { return getStorage<ActivityLog[]>(DB_KEY_LOGS, []); };

// --- SYSTEM UTILS ---
export interface DevConfig { enableGpsBypass: boolean; enableMockOCR: boolean; }
export const getDevConfig = (): DevConfig => { return getStorage<DevConfig>(DB_KEY_CONFIG, { enableGpsBypass: false, enableMockOCR: false }); };
export const saveDevConfig = (cfg: DevConfig) => { setStorage(DB_KEY_CONFIG, cfg); };
export const wipeDatabase = async () => { localStorage.clear(); seedLocalData(); };
export const seedDummyData = async (force?: boolean) => {
    const drivers = getStorage<DriverData[]>(DB_KEY_DRIVERS, []);
    drivers.push({
        id: `DUMMY-${Date.now()}`, name: "Budi Santoso (Dummy)", licensePlate: "B 1234 TES", company: "PT Logistik Test",
        status: QueueStatus.BOOKED, bookingCode: "TEST01", checkInTime: Date.now(), doNumber: "DO-TEST-001", phone: "08123456789",
        entryType: EntryType.BOOKING, purpose: 'LOADING', priority: Priority.NORMAL, gate: Gate.NONE
    });
    setStorage(DB_KEY_DRIVERS, drivers);
};
export const checkDatabaseConnection = async (): Promise<boolean> => true;
export const exportDatabase = (): string => JSON.stringify({
    drivers: getStorage(DB_KEY_DRIVERS, []), users: getStorage(DB_KEY_USERS, []),
    gates: getStorage(DB_KEY_GATES, []), config: getStorage(DB_KEY_CONFIG, {})
}, null, 2);
export const importDatabase = (json: string): boolean => {
    try {
        const data = JSON.parse(json);
        if (data.drivers) setStorage(DB_KEY_DRIVERS, data.drivers);
        if (data.users) setStorage(DB_KEY_USERS, data.users);
        if (data.gates) setStorage(DB_KEY_GATES, data.gates);
        if (data.config) setStorage(DB_KEY_CONFIG, data.config);
        return true;
    } catch (e) { console.error("Import failed", e); return false; }
};
// --- LEGACY EXPORTS ---
export const fetchWAGroups = async () => [];
export const sendPersonalNotification = async (target: string, msg: string) => sendWANotification(target, msg);
export const sendGroupNotification = async (msg: string) => sendWANotification('GROUP', msg);
export const sendDailyReportToGroup = async () => true;
