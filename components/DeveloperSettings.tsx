import React from 'react';
import { wipeDatabase, seedDummyData } from '../services/dataService';
import { Trash2, Database, AlertTriangle, ArrowLeft } from 'lucide-react';

interface Props {
    onBack?: () => void;
}

const DeveloperSettings: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
        
        {onBack && (
            <button 
                onClick={onBack}
                className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5" /> Kembali
            </button>
        )}

        <h1 className="text-3xl font-black text-red-500 mb-8 border-b border-red-900/50 pb-4">DEVELOPER ZONE</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div className="border border-red-900/50 bg-red-900/10 p-8 rounded-2xl">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Wipe Database</h3>
                <p className="text-slate-400 mb-6 text-sm">Menghapus seluruh data LocalStorage. Aplikasi akan kembali ke state awal.</p>
                <button 
                    onClick={() => { if(confirm('Yakin hapus semua data?')) wipeDatabase(); }}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <Trash2 /> RESET SYSTEM
                </button>
            </div>

            <div className="border border-blue-900/50 bg-blue-900/10 p-8 rounded-2xl">
                <Database className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Seed Dummy Data</h3>
                <p className="text-slate-400 mb-6 text-sm">Menambahkan 5 data dummy acak ke dalam antrian untuk keperluan testing.</p>
                <button 
                    onClick={() => seedDummyData()}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <Database /> INJECT DATA
                </button>
            </div>
        </div>
    </div>
  );
};

export default DeveloperSettings;