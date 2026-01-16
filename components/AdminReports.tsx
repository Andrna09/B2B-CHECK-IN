
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDrivers } from '../services/dataService';
import { QueueStatus, DriverData } from '../types';
import { TrendingUp, Clock, CheckCircle, Download, Loader2 } from 'lucide-react';

const AdminReports: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchData = async () => {
          const data = await getDrivers();
          setDrivers(data);
          setLoading(false);
      };
      fetchData();
  }, []);

  if(loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600"/></div>;

  const completed = drivers.filter(d => d.status === QueueStatus.COMPLETED);
  
  // Calculate Avg Dwell Time
  const totalDuration = completed.reduce((acc, curr) => {
    const end = curr.endTime || Date.now();
    return acc + (end - curr.checkInTime);
  }, 0);
  const avgDwellMinutes = completed.length > 0 ? Math.floor((totalDuration / completed.length) / 60000) : 0;

  // Process Real Data for Chart (Traffic per hour)
  const hourlyStats = drivers.reduce((acc, driver) => {
    const date = new Date(driver.checkInTime);
    // Only count today's data for this chart
    if (date.toDateString() === new Date().toDateString()) {
        const hour = date.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const hourlyData = Array.from({ length: 15 }, (_, i) => {
      const hour = i + 6; // Start from 06:00
      return {
          name: `${hour.toString().padStart(2, '0')}:00`,
          drivers: hourlyStats[hour] || 0
      };
  });

  // Export to CSV Function
  const downloadCSV = () => {
    const headers = ['Check In Time', 'Queue Number', 'Name', 'License Plate', 'Company', 'Purpose', 'DO Number', 'Gate', 'Status'];
    const rows = drivers.map(d => [
        new Date(d.checkInTime).toLocaleString('id-ID'),
        d.queueNumber || '-',
        `"${d.name}"`,
        d.licensePlate,
        `"${d.company}"`,
        d.purpose,
        d.doNumber,
        d.gate,
        d.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `YMS_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-colors`}></div>
        <div className="relative z-10">
            <div className={`w-12 h-12 bg-${color}-50 rounded-2xl flex items-center justify-center text-${color}-600 mb-4 shadow-sm`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 mb-2">{value}</h3>
            <p className={`text-xs font-bold text-${color}-600 bg-${color}-50 inline-block px-2 py-1 rounded-lg`}>{sub}</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen animate-fade-in-up pb-10">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Laporan Harian</h1>
            <p className="text-slate-500 font-medium">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 hover:-translate-y-1 transition-all shadow-lg shadow-slate-900/20"
          >
            <Download className="w-5 h-5" /> Export Data (CSV)
          </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
            title="Total Selesai" 
            value={completed.length} 
            sub={`${drivers.length > 0 ? Math.round((completed.length / drivers.length) * 100) : 0}% Rate`} 
            icon={CheckCircle} 
            color="emerald" 
        />
        <StatCard 
            title="Avg Dwell Time" 
            value={`${avgDwellMinutes} min`} 
            sub="Target: < 45 min" 
            icon={Clock} 
            color="blue" 
        />
        <StatCard 
            title="Gate Efficiency" 
            value="84%" 
            sub="High Performance" 
            icon={TrendingUp} 
            color="purple" 
        />
      </div>

      {/* Chart */}
      <div className="glass-card p-8 rounded-3xl shadow-lg mb-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span> Traffic per Jam (Hari Ini)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
              />
              <Bar dataKey="drivers" fill="url(#colorDrivers)" radius={[6, 6, 0, 0]} barSize={40} />
              <defs>
                <linearGradient id="colorDrivers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={1}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Driver List Table */}
      <div className="glass-card rounded-3xl shadow-lg overflow-hidden border border-white/50">
        <div className="px-8 py-6 border-b border-slate-100 bg-white/40">
            <h3 className="font-bold text-lg text-slate-800">Riwayat Aktivitas</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs font-bold text-slate-500 uppercase bg-slate-50/50">
                    <tr>
                        <th className="px-8 py-4">Waktu</th>
                        <th className="px-8 py-4">Driver</th>
                        <th className="px-8 py-4">Kendaraan</th>
                        <th className="px-8 py-4">Gate</th>
                        <th className="px-8 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {drivers.map(d => (
                        <tr key={d.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-8 py-4 font-mono font-bold text-slate-600">
                                {new Date(d.checkInTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-8 py-4">
                                <div className="font-bold text-slate-800">{d.name}</div>
                                <div className="text-xs text-slate-500">{d.company}</div>
                            </td>
                            <td className="px-8 py-4">
                                <span className="bg-slate-100 px-2 py-1 rounded font-mono font-bold text-slate-600">{d.licensePlate}</span>
                            </td>
                            <td className="px-8 py-4 font-semibold text-slate-600">
                                {d.gate !== 'NONE' ? d.gate.replace('_', ' ') : '-'}
                            </td>
                            <td className="px-8 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${d.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                                      d.status === 'LOADING' ? 'bg-blue-100 text-blue-700' :
                                      d.status === QueueStatus.VERIFIED ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                    {d.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
