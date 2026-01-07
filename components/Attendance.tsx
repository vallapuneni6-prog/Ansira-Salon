import React, { useState, useEffect } from 'react';
import { dataService } from '../services/mockData';
import { Card } from './common/Card';
import { AttendanceStatus, AttendanceRecord } from '../types';

export const Attendance: React.FC = () => {
  const salonId = dataService.getActiveSalonId();
  const staff = dataService.getStaff(salonId);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [localAttendance, setLocalAttendance] = useState<AttendanceRecord[]>([]);

  // State to force refresh when marking attendance
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setLocalAttendance(dataService.getAttendance(selectedDate, salonId));
  }, [selectedDate, salonId, refreshTrigger]);

  const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
    const existing = localAttendance.find(a => a.staffId === staffId);
    const newRecord = {
      staffId,
      date: selectedDate,
      status,
      checkIn: existing?.checkIn || (status === AttendanceStatus.PRESENT ? "09:00" : undefined),
      checkOut: existing?.checkOut || (status === AttendanceStatus.PRESENT ? "18:00" : undefined)
    };
    dataService.updateAttendance(newRecord);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTimeChange = (staffId: string, field: 'checkIn' | 'checkOut', value: string) => {
    const existing = localAttendance.find(a => a.staffId === staffId);
    if (!existing) return;

    const updatedRecord = { ...existing, [field]: value };
    dataService.updateAttendance(updatedRecord);
    setRefreshTrigger(prev => prev + 1);
  };

  const getShiftRequired = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    return (day === 0 || day === 6) ? 10 : 9;
  };

  const getMonthName = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Shift & Attendance Terminal</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Standard Shift: <span className="text-indigo-600 font-black">{getShiftRequired(selectedDate)}h</span> ({new Date(selectedDate).toDateString()})
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="text-right mr-2">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected Period</span>
            <span className="text-sm font-black text-indigo-600 uppercase">{getMonthName(selectedDate)}</span>
          </div>
          <input 
            type="date" 
            className="flex-1 md:flex-none px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-sm shadow-inner"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timing Log</th>
                <th className="px-6 py-5 text-[10px] font-black text-emerald-600 bg-emerald-50/30 uppercase tracking-widest text-center">Paid Days</th>
                <th className="px-6 py-5 text-[10px] font-black text-rose-500 bg-rose-50/30 uppercase tracking-widest text-center">LOP Days</th>
                <th className="px-6 py-5 text-[10px] font-black text-indigo-600 bg-indigo-50/30 uppercase tracking-widest text-center">OT Hours</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {staff.map(member => {
                const record = localAttendance.find(a => a.staffId === member.id);
                const isPresent = record?.status === AttendanceStatus.PRESENT;
                
                // Get Monthly Stats for calculation
                const d = new Date(selectedDate);
                const stats = dataService.getMonthlyAttendanceStats(member.id, d.getMonth(), d.getFullYear());
                
                return (
                  <tr key={member.id} className="hover:bg-slate-50/30 transition duration-300">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${isPresent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">{member.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{member.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                        record?.status === AttendanceStatus.PRESENT ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        record?.status === AttendanceStatus.WEEKOFF ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        record?.status === AttendanceStatus.LEAVE ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-slate-100 text-slate-300'
                      }`}>
                        {record?.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <input 
                          type="time" 
                          disabled={!isPresent}
                          className={`px-3 py-2 rounded-xl text-[11px] font-black border outline-none transition w-24 ${isPresent ? 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-100' : 'bg-slate-50 border-transparent text-slate-200 opacity-50'}`}
                          value={record?.checkIn || ''}
                          onChange={(e) => handleTimeChange(member.id, 'checkIn', e.target.value)}
                        />
                        <span className="text-slate-300 text-xs">-</span>
                        <input 
                          type="time" 
                          disabled={!isPresent}
                          className={`px-3 py-2 rounded-xl text-[11px] font-black border outline-none transition w-24 ${isPresent ? 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-100' : 'bg-slate-50 border-transparent text-slate-200 opacity-50'}`}
                          value={record?.checkOut || ''}
                          onChange={(e) => handleTimeChange(member.id, 'checkOut', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center bg-emerald-50/10">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-emerald-600">{stats.present}</span>
                        <span className="text-[8px] font-black text-emerald-300 uppercase">Paid Days</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center bg-rose-50/10">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-rose-600">{stats.lopDays}</span>
                        <span className="text-[8px] font-black text-rose-300 uppercase">LOP Days</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center bg-indigo-50/10">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-indigo-600">{stats.extraHours}h</span>
                        <span className="text-[8px] font-black text-indigo-300 uppercase">Total OT</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => handleStatusChange(member.id, AttendanceStatus.PRESENT)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all font-black text-xs ${record?.status === AttendanceStatus.PRESENT ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500'}`}
                          title="Mark Present (Paid)"
                        >P</button>
                        <button 
                          onClick={() => handleStatusChange(member.id, AttendanceStatus.WEEKOFF)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all font-black text-xs ${record?.status === AttendanceStatus.WEEKOFF ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500'}`}
                          title="Mark Weekoff (Paid)"
                        >W</button>
                        <button 
                          onClick={() => handleStatusChange(member.id, AttendanceStatus.LEAVE)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all font-black text-xs ${record?.status === AttendanceStatus.LEAVE ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500'}`}
                          title="Mark Leave (LOP)"
                        >L</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Staffing Protocol</h4>
            <div className="space-y-3">
              <p className="text-xs text-slate-400 font-medium">
                <span className="text-indigo-400 mr-2">●</span> Weekend shifts (<span className="text-white font-bold">Sat/Sun</span>) require <span className="text-white font-bold">10h</span> activity.
              </p>
              <p className="text-xs text-slate-400 font-medium">
                <span className="text-indigo-400 mr-2">●</span> <span className="text-blue-400 font-black">W (Weekoff)</span> is calculated as a <span className="text-white font-bold">Paid Day</span>.
              </p>
              <p className="text-xs text-slate-400 font-medium">
                <span className="text-indigo-400 mr-2">●</span> Only <span className="text-rose-400 font-black">L (Leave)</span> results in <span className="text-white font-bold">Loss of Pay (LOP)</span>.
              </p>
              <p className="text-xs text-indigo-300 font-black uppercase italic mt-2">
                ⚠️ Weekend Policy: Leaves on Saturday/Sunday count as 2 LOP days.
              </p>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase">Monthly Reporting Status</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live accuracy for current cycle</p>
            <div className="mt-6 flex items-baseline gap-2">
               <span className="text-4xl font-black text-indigo-600">92%</span>
               <span className="text-[10px] font-black text-emerald-500 uppercase">↑ Optimal</span>
            </div>
          </div>
          <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
            📈
          </div>
        </div>
      </div>
    </div>
  );
};