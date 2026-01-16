
import { QueueStatus } from '../types';

export const formatTime = (timestamp?: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const getStatusLabel = (status: QueueStatus) => {
  switch (status) {
    case QueueStatus.BOOKED: return 'Booked';
    case QueueStatus.CHECKED_IN: return 'Checked In';
    case QueueStatus.AT_GATE: return 'Di Gerbang';
    case QueueStatus.VERIFIED: return 'Menunggu';
    case QueueStatus.REJECTED: return 'Ditolak';
    case QueueStatus.CALLED: return 'Dipanggil';
    case QueueStatus.LOADING: return 'Loading';
    case QueueStatus.COMPLETED: return 'Selesai';
    case QueueStatus.EXITED: return 'Keluar';
    case QueueStatus.CANCELLED: return 'Batal';
    default: return status;
  }
};

export const getStatusColor = (status: QueueStatus) => {
  switch (status) {
    case QueueStatus.CALLED: return 'bg-blue-100 text-blue-700 border-blue-200';
    case QueueStatus.LOADING: return 'bg-purple-100 text-purple-700 border-purple-200';
    case QueueStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case QueueStatus.VERIFIED: return 'bg-amber-100 text-amber-700 border-amber-200';
    case QueueStatus.REJECTED: return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};
