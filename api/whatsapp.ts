import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ----------------------------------------------------------------------
  // 1. PENANGANAN CORS (WAJIB UNTUK VERCEL)
  // Tanpa ini, browser akan memblokir request dari frontend Anda
  // ----------------------------------------------------------------------
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Boleh diganti dengan domain frontend Anda agar lebih aman
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle Request "Preflight" (Browser mengecek izin sebelum kirim data)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ----------------------------------------------------------------------
  // 2. VALIDASI METHOD & TOKEN
  // ----------------------------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: false, 
      message: 'Method Not Allowed. Gunakan POST.' 
    });
  }

  const token = process.env.FONNTE_TOKEN;
  
  // Debugging: Cek apakah token terbaca di server Vercel
  if (!token) {
    console.error("❌ ERROR: FONNTE_TOKEN tidak ditemukan di Environment Variables Vercel.");
    return res.status(500).json({ 
      status: false, 
      message: 'Server Configuration Error: Token Fonnte belum disetting di Dashboard Vercel.' 
    });
  }

  // ----------------------------------------------------------------------
  // 3. PROSES PENGIRIMAN (MENGGUNAKAN FETCH)
  // ----------------------------------------------------------------------
  const { target, message } = req.body || {};

  if (!target || !message) {
    return res.status(400).json({
      status: false,
      message: 'Data tidak lengkap. Pastikan mengirim "target" dan "message".'
    });
  }

  try {
    console.log(`🚀 Mengirim WA ke: ${target}`);

    // Fonnte API Request
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        // Tips: Fonnte seringkali lebih stabil jika Content-Type dibiarkan default 
        // saat menggunakan URLSearchParams / FormData
      },
      body: new URLSearchParams({
        target: target,
        message: message,
        countryCode: '62' // Default kode negara Indonesia
      }),
    });

    const result = await response.json();
    
    // Log hasil untuk debugging di Vercel Logs
    console.log("✅ Fonnte Response:", JSON.stringify(result));

    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ Gagal menghubungi Fonnte:", error);
    return res.status(500).json({ 
      status: false, 
      message: 'Gagal menghubungi server WhatsApp',
      error: String(error)
    });
  }
}
