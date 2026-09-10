import React, { useState } from 'react';
import { emailService } from '../services/emailService';
import { useToast } from '../context/ToastContext';
import { Mail, Send, X, CheckCircle2 } from 'lucide-react';

interface EmailPayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  employeeEmail: string;
  periodLabel: string;
}

export const EmailPayslipModal: React.FC<EmailPayslipModalProps> = ({
  isOpen,
  onClose,
  employeeName,
  employeeEmail,
  periodLabel,
}) => {
  const [toEmail, setToEmail] = useState(employeeEmail || 'employee@centraldispatch.bm');
  const [subject, setSubject] = useState(`Your Payroll Payslip - ${periodLabel}`);
  const [message, setMessage] = useState(
    `Hello ${employeeName},\n\nPlease find your payslip for the payroll period (${periodLabel}) attached.\n\nRegards,\nCentral Dispatch Payroll`
  );
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await emailService.sendPayslipEmail({
        toEmail,
        employeeName,
        periodLabel,
        subject,
        messageBody: message,
      });
      setIsSending(false);
      showToast(res.message, 'success');
      onClose();
    } catch {
      setIsSending(false);
      showToast('Failed to send email payslip.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-lg w-full p-6 shadow-cdModal space-y-4">
        <div className="flex items-center justify-between border-b border-[#e1e8ef] pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#2f6fb3]" />
            <h3 className="text-lg font-black text-[#12345b]">
              Email Payslip
            </h3>
          </div>
          <button onClick={onClose} className="text-[#607286] hover:text-[#12345b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#38516b] uppercase tracking-wider mb-1">
              To:
            </label>
            <input
              type="email"
              required
              value={toEmail}
              onChange={e => setToEmail(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#38516b] uppercase tracking-wider mb-1">
              Subject:
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#38516b] uppercase tracking-wider mb-1">
              Message:
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full p-3 border border-[#bdcbd9] rounded-xl text-sm font-medium focus:outline-none focus:border-[#2f6fb3]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#aebfd1] text-[#173a60] font-bold text-xs rounded-xl hover:bg-[#edf5fb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2 bg-[#2f6fb3] hover:bg-[#245a96] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send Email'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
