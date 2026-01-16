import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';

// --- CONFIGURATION ---
// SECURITY UPDATE: Menggunakan Environment Variables Server-Side
// Tidak ada lagi hardcoded key di sini.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validasi Keamanan: Pastikan server punya kunci sebelum lanjut
if (!supabaseUrl || !supabaseKey) {
  throw new Error("FATAL: Supabase URL atau Key belum dikonfigurasi di Environment Variables Vercel.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // Serverless mode
  }
});

// Mapping CamelCase (Frontend) <-> Snake_case (Database)
const mapToDb = (data: any) => ({
  id: data.id,
  name: data.name,
  phone: data.phone,
  license_plate: data.licensePlate,
  company: data.company,
  pic: data.pic,
  purpose: data.purpose,
  do_number: data.doNumber,
  item_type: data.itemType,
  status: data.status,
  gate: data.gate,
  queue_number: data.queueNumber,
  priority: data.priority,
  entry_type: data.entryType,
  check_in_time: data.checkInTime,
  arrived_at_gate_time: data.arrivedAtGateTime,
  verified_time: data.verifiedTime,
  called_time: data.calledTime,
  loading_start_time: data.loadingStartTime,
  end_time: data.endTime,
  exit_time: data.exitTime,
  notes: data.notes,
  document_file: data.documentFile,
  rejection_reason: data.rejectionReason,
  security_notes: data.securityNotes,
  verified_by: data.verifiedBy,
  called_by: data.calledBy,
  exit_verified_by: data.exitVerifiedBy
});

const mapToFrontend = (row: any) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  licensePlate: row.license_plate,
  company: row.company,
  pic: row.pic,
  purpose: row.purpose,
  doNumber: row.do_number,
  itemType: row.item_type,
  status: row.status,
  gate: row.gate,
  queueNumber: row.queue_number,
  priority: row.priority,
  entryType: row.entry_type,
  checkInTime: Number(row.check_in_time), // Ensure number
  arrivedAtGateTime: row.arrived_at_gate_time ? Number(row.arrived_at_gate_time) : undefined,
  verifiedTime: row.verified_time ? Number(row.verified_time) : undefined,
  calledTime: row.called_time ? Number(row.called_time) : undefined,
  loadingStartTime: row.loading_start_time ? Number(row.loading_start_time) : undefined,
  endTime: row.end_time ? Number(row.end_time) : undefined,
  exitTime: row.exit_time ? Number(row.exit_time) : undefined,
  notes: row.notes,
  documentFile: row.document_file,
  rejectionReason: row.rejection_reason,
  securityNotes: row.security_notes,
  verifiedBy: row.verified_by,
  calledBy: row.called_by,
  exitVerifiedBy: row.exit_verified_by
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Handling
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, data } = req.body;

  try {
    // --- READ (GET ALL) ---
    if (action === 'GET') {
      // Ambil 500 data terakhir, urutkan dari yang terbaru (check_in_time)
      const { data: rows, error } = await supabase
        .from('drivers')
        .select('*')
        .order('check_in_time', { ascending: false })
        .limit(500);

      if (error) throw error;

      const formatted = rows.map(mapToFrontend);
      return res.status(200).json(formatted);
    }

    // --- CREATE ---
    if (action === 'CREATE') {
      let documentUrl = data.documentFile;

      // 1. Upload Base64 Image to Supabase Storage
      if (data.documentFile && data.documentFile.startsWith('data:')) {
        try {
           const base64Data = data.documentFile.split(',')[1];
           const buffer = Buffer.from(base64Data, 'base64');

           // Generate unique filename
           const fileName = `SJ_${data.id}_${Date.now()}.jpg`;

           const { data: uploadData, error: uploadError } = await supabase
             .storage
             .from('documents')
             .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true
             });

           if (uploadError) throw uploadError;

           // Get Public URL
           const { data: publicUrlData } = supabase
             .storage
             .from('documents')
             .getPublicUrl(fileName);

           documentUrl = publicUrlData.publicUrl;

        } catch (err) {
           console.error("Storage Upload Error:", err);
           documentUrl = "Upload Failed";
        }
      }

      // 2. Insert to DB
      const dbPayload = mapToDb({ ...data, documentFile: documentUrl });

      const { error } = await supabase
        .from('drivers')
        .insert([dbPayload]);

      if (error) throw error;

      return res.status(200).json({ success: true, fileUrl: documentUrl });
    }

    // --- UPDATE ---
    if (action === 'UPDATE') {
      const dbPayload = mapToDb(data);
      // Remove ID from payload body to avoid trying to update PK
      const { id, ...updateFields } = dbPayload;

      const { error } = await supabase
        .from('drivers')
        .update(updateFields)
        .eq('id', data.id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid Action' });

  } catch (error: any) {
    console.error('Supabase API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
