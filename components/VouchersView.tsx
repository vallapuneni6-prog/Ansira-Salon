import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { dataService, ReferralVoucher } from '../services/mockData';
import html2canvas from 'html2canvas';

// Using a stable logo source
const LOGO_URL = "https://i.imgur.com/pYxRj8p.png";

export const VouchersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'alerts'>('vouchers');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [generatedVoucher, setGeneratedVoucher] = useState<ReferralVoucher | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [recentReferrals, setRecentReferrals] = useState<ReferralVoucher[]>([]);
  const [expiringVouchers, setExpiringVouchers] = useState<ReferralVoucher[]>([]);
  
  const currentSalon = dataService.getActiveSalon();

  const [referralForm, setReferralForm] = useState({
    referringName: '',
    friendName: '',
    friendMobile: '',
    billNo: ''
  });

  useEffect(() => {
    const allVouchers = dataService.getReferralVouchers();
    setRecentReferrals(allVouchers);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const expiring = allVouchers.filter(v => {
      if (v.status !== 'Active') return false;
      
      const [day, month, year] = v.validTill.split('/').map(Number);
      const expiryDate = new Date(year, month - 1, day);
      expiryDate.setHours(0, 0, 0, 0);

      return expiryDate >= today && expiryDate <= threeDaysFromNow;
    });

    setExpiringVouchers(expiring);
  }, [isIssueModalOpen, generatedVoucher, activeTab]);

  useEffect(() => {
    if (referralForm.friendMobile.length >= 10) {
      const customer = dataService.findCustomer(referralForm.friendMobile);
      if (customer) {
        setReferralForm(prev => ({ ...prev, friendName: customer.name }));
      }
    }
  }, [referralForm.friendMobile]);

  const handleClear = () => {
    setReferralForm({
      referringName: '',
      friendName: '',
      friendMobile: '',
      billNo: ''
    });
  };

  const handleIssueVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralForm.referringName || !referralForm.friendName || !referralForm.friendMobile || !referralForm.billNo) {
      alert("Please fill all required fields");
      return;
    }
    
    dataService.saveCustomer({
      mobile: referralForm.friendMobile,
      name: referralForm.friendName
    });

    const today = new Date();
    const validFrom = new Date(today);
    validFrom.setDate(today.getDate() + 1);
    
    const validTill = new Date(today);
    validTill.setDate(today.getDate() + 15);

    const newVoucher: ReferralVoucher = {
      id: Math.random().toString(36).substring(2, 7).toUpperCase(),
      guestName: referralForm.friendName,
      guestMobile: referralForm.friendMobile,
      referringName: referralForm.referringName,
      billNo: referralForm.billNo,
      validFrom: validFrom.toLocaleDateString('en-GB'),
      validTill: validTill.toLocaleDateString('en-GB'),
      discount: "35% OFF",
      status: 'Active',
      dateIssued: new Date().toISOString()
    };

    dataService.addReferralVoucher(newVoucher);
    setGeneratedVoucher(newVoucher);
    setIsIssueModalOpen(false);
  };

  const handleShareVoucher = async () => {
    const element = document.getElementById('referral-voucher-graphic');
    if (!element) return;

    setIsCapturing(true);
    try {
      const images = element.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        scale: 3,
        backgroundColor: null,
        logging: false
      });

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
        } catch (clipErr) {
          console.error("Clipboard fail", clipErr);
        }
        
        const outletName = currentSalon?.name || 'Naturals Salon';
        const template = `Hi ${generatedVoucher?.guestName},

Your friend ${generatedVoucher?.referringName} recently visited ${outletName} and thought you'd love the experience too!

We've reserved a special voucher just for you — make sure to use it before ${generatedVoucher?.validTill} and enjoy an exclusive pampering session at ${outletName}.

Voucher ID: ${generatedVoucher?.id}
Special Discount: 35% OFF

Book your slot soon and treat yourself to the care you deserve!

— Team Naturals Salon`.trim();

        const text = encodeURIComponent(template);
        window.open(`https://web.whatsapp.com/send?phone=91${generatedVoucher?.guestMobile}&text=${text}`, '_blank');
      }
    } catch (err) {
      console.error("Voucher capture failed", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRemindVoucher = (v: ReferralVoucher) => {
    const outletName = currentSalon?.name || 'Naturals Salon';
    const message = `Hi ${v.guestName}, just a friendly reminder from ${outletName}! 🌟

Your special 35% OFF family & friends voucher (ID: ${v.id}) is expiring on ${v.validTill}. 

We'd love to see you soon for your pampering session! You can book your slot by replying to this message or calling us at ${currentSalon?.contact || 'our outlet'}.

See you soon!
— Team Naturals Salon`;

    window.open(`https://web.whatsapp.com/send?phone=91${v.guestMobile}&text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Promotions & Alerts</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Manage referral vouchers and client notifications</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-3xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setActiveTab('vouchers')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'vouchers' ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-100' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Vouchers
          </button>
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'alerts' ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-100' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Alerts
          </button>
        </div>
      </div>

      {activeTab === 'vouchers' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button 
              onClick={() => setIsIssueModalOpen(true)}
              className="bg-[#7C3AED] text-white flex flex-col items-center justify-center p-8 gap-4 rounded-[2rem] hover:scale-[1.02] transition-transform shadow-xl shadow-purple-100 group"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-white/30 transition-colors">🎫</div>
              <div className="text-center">
                <h3 className="font-black uppercase tracking-widest text-sm">Issue Voucher</h3>
                <p className="text-[10px] text-white/60 font-bold uppercase mt-1">New Referral Entry</p>
              </div>
            </button>
            
            <Card className="border-none bg-white p-8 flex flex-col justify-between shadow-xl shadow-slate-200/50 rounded-[2rem]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Vouchers</p>
              <h2 className="text-4xl font-black text-slate-900 mt-2">{recentReferrals.filter(v => v.status === 'Active').length}</h2>
              <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold text-xs">
                <span>↑ Referral Program</span>
              </div>
            </Card>

            <Card className="border-none bg-white p-8 flex flex-col justify-between shadow-xl shadow-slate-200/50 rounded-[2rem]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Redeemed</p>
              <h2 className="text-4xl font-black text-slate-900 mt-2">{recentReferrals.filter(v => v.status === 'Redeemed').length}</h2>
              <p className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-tighter">Lifetime Referral Use</p>
            </Card>

            <Card className="border-none bg-white p-8 flex flex-col justify-between shadow-xl shadow-slate-200/50 rounded-[2rem]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Issued</p>
              <h2 className="text-4xl font-black text-indigo-600 mt-2">{recentReferrals.length}</h2>
              <p className="mt-4 text-slate-300 font-bold text-xs uppercase tracking-tighter">Unique Codes Generated</p>
            </Card>
          </div>

          <Card title="Recent Referral Vouchers" className="border-none shadow-xl rounded-[2rem]">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest Name</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Issue Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReferrals.length > 0 ? recentReferrals.map((v) => (
                      <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="px-6 py-5 text-sm font-black text-slate-900">{v.guestName}</td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-600">{v.guestMobile}</td>
                        <td className="px-6 py-5 text-center text-xs font-bold text-slate-400">
                          {new Date(v.dateIssued).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                            v.status === 'Active' ? 'bg-amber-100 text-amber-700' :
                            v.status === 'Redeemed' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-400'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right text-xs font-bold text-rose-500 italic">{v.validTill}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-300">No referrals found for this outlet</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card title="Expiring Vouchers Alert (Next 3 Days)" className="border-none shadow-xl rounded-[2rem]">
            <div className="divide-y divide-slate-50">
              {expiringVouchers.length > 0 ? expiringVouchers.map((v, i) => (
                <div key={i} className="py-8 flex flex-col md:flex-row justify-between items-start md:items-center group hover:bg-slate-50/50 px-8 -mx-8 transition-colors rounded-[2rem]">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl shadow-sm animate-pulse">
                      🔥
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-slate-900">{v.guestName}</span>
                        <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest">Expires {v.validTill}</span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                        <span>📲 {v.guestMobile}</span>
                        <span className="text-slate-300">•</span>
                        <span>Referral ID: <span className="font-mono font-bold text-indigo-600">{v.id}</span></span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 md:mt-0 flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Referral by</p>
                      <p className="text-xs font-bold text-slate-600">{v.referringName}</p>
                    </div>
                    <button 
                      onClick={() => handleRemindVoucher(v)}
                      className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] rounded-[1.5rem] transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group/btn"
                    >
                      <span className="text-lg group-hover/btn:rotate-12 transition-transform">📲</span>
                      Remind via WhatsApp
                    </button>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl grayscale opacity-50">🔔</div>
                  <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight">No Urgent Alerts</h3>
                  <p className="text-sm text-slate-400 font-bold mt-2 uppercase tracking-widest opacity-60">All referral vouchers have more than 3 days of validity left.</p>
                </div>
              )}
            </div>
          </Card>

          {expiringVouchers.length > 0 && (
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div>
                   <h4 className="text-xl font-black uppercase tracking-tight">Retention Strategy</h4>
                   <p className="text-white/70 text-sm font-bold mt-2">Reminding customers before expiry increases conversion rate by up to 22%.</p>
                 </div>
                 <div className="bg-white/20 px-6 py-4 rounded-2xl backdrop-blur-md">
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Impact Potential</p>
                   <p className="text-2xl font-black">₹{(expiringVouchers.length * 450).toLocaleString()} <span className="text-sm font-bold text-emerald-300">Est. Revenue</span></p>
                 </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20"></div>
            </div>
          )}
        </div>
      )}

      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[150] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 relative border border-slate-100">
            <button 
              onClick={() => setIsIssueModalOpen(false)}
              className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all rounded-full hover:bg-slate-50"
            >
              <span className="text-2xl">✕</span>
            </button>
            
            <div className="p-12">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-10">Enter Friends Details</h2>
              
              <form onSubmit={handleIssueVoucher} className="space-y-7">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Friends Mobile No *</label>
                  <input 
                    required
                    type="tel"
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-50 focus:border-[#7C3AED] outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="Enter friend's mobile number"
                    value={referralForm.friendMobile}
                    onChange={e => setReferralForm({...referralForm, friendMobile: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Friend's Name *</label>
                  <input 
                    required
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-50 focus:border-[#7C3AED] outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="Auto-populated if existing..."
                    value={referralForm.friendName}
                    onChange={e => setReferralForm({...referralForm, friendName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer Name (Referring) *</label>
                  <input 
                    required
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-50 focus:border-[#7C3AED] outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="Enter customer name who is referring"
                    value={referralForm.referringName}
                    onChange={e => setReferralForm({...referralForm, referringName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Bill No *</label>
                  <input 
                    required
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-50 focus:border-[#7C3AED] outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="Enter bill number"
                    value={referralForm.billNo}
                    onChange={e => setReferralForm({...referralForm, billNo: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button" 
                    onClick={handleClear}
                    className="flex-1 py-5 bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Clear
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 bg-[#7C3AED] text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#6D28D9] transition-all shadow-xl shadow-purple-200 active:scale-95"
                  >
                    Issue Voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {generatedVoucher && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-[900px] mb-8 relative">
            <div id="referral-voucher-graphic" className="w-full aspect-[2.1/1] bg-white rounded-3xl overflow-hidden shadow-2xl flex border-4 border-white">
              <div className="w-[45%] bg-[#FFF5F8] flex flex-col items-center justify-between p-10 text-center border-r-2 border-dashed border-slate-200">
                <div className="space-y-2">
                   <img 
                    src={LOGO_URL} 
                    alt="Naturals Logo" 
                    className="h-14 object-contain mx-auto"
                    crossOrigin="anonymous"
                    loading="eager"
                  />
                  <p className="text-[11px] font-bold text-[#712E8B] uppercase tracking-widest">India's No.1 hair and beauty salon</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-2xl font-black text-[#1E293B] uppercase tracking-tighter">{currentSalon?.name || 'Naturals Salon'}</h4>
                  <div className="flex flex-col items-center">
                    <span className="text-[80px] font-black text-[#E67E22] leading-none">35%</span>
                    <span className="text-5xl font-black text-[#1E293B] tracking-[0.2em] -mt-2">OFF</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-500">• Voucher not applicable on Hair Treatments & Bridal makeup.</p>
                  <p className="text-[9px] font-bold text-slate-500">Voucher Valid only at Store issued, please take prior appointment for service</p>
                </div>
              </div>

              <div className="w-[55%] bg-[#FFD700] p-12 flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Family & Friends Voucher</h2>
                  <p className="text-sm font-bold text-slate-700 italic tracking-tight opacity-90 leading-snug max-w-[320px]">This exclusive treat awaits you — courtesy of someone who cares.</p>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-end border-b-2 border-slate-900/10 pb-1.5">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Guest Name:</span>
                    <span className="text-lg font-black text-slate-900 tracking-tight">{generatedVoucher.guestName}</span>
                  </div>
                  <div className="flex justify-between items-end border-b-2 border-slate-900/10 pb-1.5">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Voucher ID:</span>
                    <span className="text-lg font-mono font-black text-slate-900">{generatedVoucher.id}</span>
                  </div>
                  <div className="flex justify-between items-end border-b-2 border-slate-900/10 pb-1.5">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Valid From:</span>
                    <span className="text-lg font-black text-slate-900">{generatedVoucher.validFrom}</span>
                  </div>
                  <div className="flex justify-between items-end border-b-2 border-slate-900/10 pb-1.5">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Valid Till:</span>
                    <span className="text-lg font-black text-slate-900">{generatedVoucher.validTill}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setGeneratedVoucher(null)}
              className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all border border-white/20"
            >
              Close
            </button>
            <button 
              onClick={handleShareVoucher}
              disabled={isCapturing}
              className="px-12 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-2xl shadow-emerald-500/20 flex items-center gap-3 active:scale-95 disabled:opacity-50"
            >
              <span>{isCapturing ? '⌛' : '📲'}</span>
              {isCapturing ? 'Generating...' : 'Copy & Share on WhatsApp'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
