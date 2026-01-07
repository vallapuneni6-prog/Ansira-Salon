import React, { useState } from 'react';
import { Invoice, PaymentMode } from '../types';
import { dataService } from '../services/mockData';
import html2canvas from 'html2canvas';

interface InvoiceReceiptProps {
  invoice: Invoice;
  onClose: () => void;
  autoShare?: boolean;
}

const LOGO_URL = "https://www.naturals.in/wp-content/uploads/2023/04/Naturals-Logo.png";

export const formatWhatsAppMessage = (invoice: Invoice, salon: any) => {
  const text = `
*Greeting from ${salon?.name}!* 

--- MANAGER INSTRUCTION ---
(Please Ctrl+V or Long Press to PASTE the invoice image here)
---------------------------
  `.trim();
  return encodeURIComponent(text);
};

export const InvoiceReceipt: React.FC<InvoiceReceiptProps> = ({ invoice, onClose, autoShare = false }) => {
  const salon = dataService.getActiveSalon();
  const [shareStatus, setShareStatus] = useState<'idle' | 'capturing' | 'copied' | 'error'>('idle');

  const handleWhatsAppShare = async () => {
    if (shareStatus === 'capturing') return;
    
    setShareStatus('capturing');
    const receiptElement = document.getElementById('receipt-content');
    if (!receiptElement) {
      setShareStatus('error');
      return;
    }

    try {
      const images = receiptElement.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const canvas = await html2canvas(receiptElement, {
        useCORS: true,
        allowTaint: false,
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      
      if (blob) {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setShareStatus('copied');
        } catch (clipboardErr) {
          console.error("Clipboard write failed", clipboardErr);
        }
      }

      const encodedText = formatWhatsAppMessage(invoice, salon);
      const whatsappUrl = `https://web.whatsapp.com/send?phone=91${invoice.customerMobile}&text=${encodedText}`;
      
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        setShareStatus('idle');
        onClose();
      }, 1200);

    } catch (err) {
      console.error("Capture failed", err);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  React.useEffect(() => {
    if (autoShare) {
      const timer = setTimeout(() => {
        handleWhatsAppShare();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoShare]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-white w-full max-w-[500px] rounded-sm shadow-2xl relative animate-in zoom-in duration-300 print:shadow-none print:w-full">
        <div className="absolute -top-16 left-0 right-0 flex justify-between px-2 items-center print:hidden">
          <button 
            onClick={onClose} 
            className="group bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
          </button>
          <div className="flex gap-3">
            <button 
              onClick={handleWhatsAppShare}
              disabled={shareStatus === 'capturing' || shareStatus === 'copied'}
              className={`${
                shareStatus === 'copied' ? 'bg-indigo-600' : 'bg-emerald-500 hover:bg-emerald-600'
              } text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-80 active:scale-95`}
            >
              <span>{shareStatus === 'capturing' ? '⌛' : shareStatus === 'copied' ? '✅' : '📲'}</span>
              {shareStatus === 'capturing' ? 'Processing...' : shareStatus === 'copied' ? 'Copied!' : 'Share Image'}
            </button>
            <button 
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95"
            >
              <span>🖨️</span> Print
            </button>
          </div>
        </div>

        {shareStatus === 'copied' && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-300 text-center p-10">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce">
              ✓
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Receipt Copied!</h3>
            <p className="text-sm text-slate-500 font-bold mt-2 leading-relaxed">
              We're opening WhatsApp Web for you.<br/>
              Just press <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-indigo-600">Ctrl + V</span> to paste the image.
            </p>
          </div>
        )}

        <div id="receipt-content" className="p-10 bg-white border-8 border-white">
          <div className="flex flex-col items-center text-center space-y-2 mb-6">
            <div className="mb-4">
              <img 
                src={LOGO_URL} 
                alt="Naturals Logo" 
                className="h-16 object-contain"
                crossOrigin="anonymous"
                loading="eager"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x120/7C3AED/white?text=NATURALS";
                }}
              />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-wide uppercase font-serif">{salon?.name || 'Luxe Salon'}</h2>
            <p className="text-[12px] leading-relaxed opacity-80 max-w-[300px] font-medium">
              {salon?.address || 'Location Details Not Configured'}
            </p>
            <div className="text-[11px] font-bold space-y-0.5 mt-2">
              <p className="uppercase tracking-widest text-slate-400">GST: <span className="text-slate-900">{salon?.gstNumber || '36GSTXXXXXXXX'}</span></p>
              <p className="uppercase tracking-widest text-slate-400">Ph: <span className="text-slate-900">{salon?.contact || 'Not Provided'}</span></p>
            </div>
          </div>

          <h3 className="text-center font-black border-y border-dashed border-slate-300 py-3 my-6 tracking-[0.4em] uppercase text-[10px] text-slate-400">Digital Transaction Invoice</h3>

          <div className="space-y-1.5 mb-6">
            <div className="flex justify-between text-[13px]">
              <span className="font-bold uppercase text-[9px] text-slate-400 tracking-[0.2em]">Invoice ID:</span>
              <span className="font-mono font-black text-slate-900">{invoice.id}</span>
            </div>
            <div className="flex justify-between text-[13px] border-b border-dashed border-slate-300 pb-4">
              <span className="font-bold uppercase text-[9px] text-slate-400 tracking-[0.2em]">Billing Date:</span>
              <span className="font-black">{new Date(invoice.date).toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-black text-[9px] text-slate-400 uppercase tracking-[0.2em] mb-2">Customer Recipient</h4>
            <p className="text-[15px] font-black text-slate-900 font-serif">{invoice.customerName}</p>
            <p className="text-[12px] font-bold text-slate-500 border-b border-dashed border-slate-300 pb-4 tracking-tighter">{invoice.customerMobile}</p>
          </div>

          <table className="w-full text-[12px] mb-6">
            <thead>
              <tr className="border-b-2 border-slate-900 text-left font-black uppercase text-[9px] tracking-[0.2em]">
                <th className="py-2">Service Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-slate-300">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 font-bold text-slate-900 leading-tight">{item.serviceName}</td>
                  <td className="py-4 text-center font-bold">{item.quantity}</td>
                  <td className="py-4 text-right font-medium">₹{item.price.toLocaleString()}</td>
                  <td className="py-4 text-right font-black">₹{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2.5 border-t border-slate-900 pt-5 mb-6">
            <div className="flex justify-between text-[12px] text-slate-500 font-bold uppercase tracking-tight">
              <span>Gross Subtotal:</span>
              <span className="text-slate-900">₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[12px] text-slate-500 font-bold uppercase tracking-tight">
              <span>Tax Component (GST 5%):</span>
              <span className="text-slate-900">₹{invoice.gst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[12px] border-b border-slate-900 pb-3 text-rose-500 font-black uppercase tracking-tight">
              <span>Promotional Discount:</span>
              <span>-₹{invoice.discount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[20px] font-black pt-3 border-b-4 border-double border-slate-900 pb-3 font-serif">
              <span className="uppercase tracking-[0.1em]">Total Payable:</span>
              <span className="text-slate-900">₹{invoice.total.toLocaleString()}</span>
            </div>
          </div>

          {invoice.paymentMode === PaymentMode.PACKAGE && invoice.packagePreviousBalance !== undefined && (
            <div className="bg-indigo-50/50 p-6 rounded-xl border border-dashed border-indigo-200 mb-8 space-y-3">
              <div className="text-center pb-2 border-b border-indigo-100 mb-4">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Wallet Transaction Ledger</span>
              </div>
              
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-indigo-100/50">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active Package</span>
                  <span className="text-xs font-black text-slate-900">{invoice.packageName}</span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Initial Paid Amount</span>
                  <span className="text-xs font-black text-indigo-600">₹{(invoice.packagePaidAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between text-[12px]">
                <span className="font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Opening Balance:</span>
                <span className="font-black text-slate-900">₹{invoice.packagePreviousBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Services Used Today:</span>
                <span className="font-black text-rose-500">-₹{invoice.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[15px] pt-3 border-t border-indigo-200">
                <span className="font-black text-indigo-600 uppercase tracking-[0.2em] text-[10px]">Current Credits:</span>
                <span className="font-black text-indigo-600">₹{(invoice.packageRemainingBalance ?? 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="mt-10 text-center space-y-6">
            <div className="inline-block px-8 py-3 border border-dashed border-slate-300 rounded-xl bg-slate-50">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Settlement Method</p>
              <p className="text-sm font-black text-indigo-600 uppercase">{invoice.packageName || invoice.paymentMode}</p>
            </div>
            <p className="text-[12px] italic text-slate-400 font-medium">"Beauty begins the moment you decide to be yourself."</p>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Thank you for visiting {salon?.name || 'us'}!</p>
          </div>
        </div>
      </div>
    </div>
  );
};