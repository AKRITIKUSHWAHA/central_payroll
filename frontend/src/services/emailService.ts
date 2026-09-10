import { apiFetch } from './api';

export interface SendEmailPayload {
  toEmail: string;
  employeeName: string;
  periodLabel: string;
  subject: string;
  messageBody: string;
}

class EmailService {
  public async sendPayslipEmail(payload: SendEmailPayload): Promise<{ success: boolean; message: string }> {
    // Send email dispatch request to backend
    const apiRes = await apiFetch<{ success: boolean; message: string }>('/email/payslip', {
      method: 'POST',
      body: JSON.stringify({
        recipientEmail: payload.toEmail,
        employeeName: payload.employeeName,
        periodDates: payload.periodLabel,
        customMessage: payload.messageBody
      })
    });
    
    // Store simulated outbox item in localStorage
    const outbox = JSON.parse(localStorage.getItem('cdl_email_outbox') || '[]');
    outbox.unshift({
      id: `email-${Date.now()}`,
      ...payload,
      sentAt: new Date().toISOString(),
      status: 'Delivered'
    });
    localStorage.setItem('cdl_email_outbox', JSON.stringify(outbox));

    return {
      success: true,
      message: apiRes?.message || `Payslip emailed successfully to ${payload.toEmail}`
    };
  }

  public getOutboxHistory() {
    return JSON.parse(localStorage.getItem('cdl_email_outbox') || '[]');
  }
}

export const emailService = new EmailService();
