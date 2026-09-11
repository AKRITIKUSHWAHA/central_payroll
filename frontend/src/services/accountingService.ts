import { Customer, Invoice, Payment, GeneralLedgerEntry, AgingSummary, AccountingKPIs } from '../types';
import importedData from '../mock/importedAccountingData.json';

const STORAGE_KEY = 'cdlAccountingV1';

interface AccountingState {
  version: number;
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  customLedger: GeneralLedgerEntry[];
  selectedCustomerId: string;
  asOf: string;
}

class AccountingService {
  private state: AccountingState;

  constructor() {
    this.state = this.loadState();
  }

  private getTodayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private generateUid(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  private loadState(): AccountingState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          version: parsed.version || 1,
          customers: parsed.customers?.length ? parsed.customers : (importedData.customers as Customer[]) || [],
          invoices: parsed.invoices || [],
          payments: parsed.payments || [],
          customLedger: parsed.customLedger || [],
          selectedCustomerId: parsed.selectedCustomerId || '',
          asOf: parsed.asOf || this.getTodayStr(),
        };
      }
    } catch (_) {
      // Fallback
    }

    const initial: AccountingState = {
      version: 1,
      customers: (importedData.customers as Customer[]) || [],
      invoices: [],
      payments: [],
      customLedger: [],
      selectedCustomerId: '',
      asOf: this.getTodayStr(),
    };
    this.saveState(initial);
    return initial;
  }

  private saveState(stateToSave?: AccountingState) {
    if (stateToSave) {
      this.state = stateToSave;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist accounting state in localStorage', e);
    }
  }

  // ----------------------------------------------------------------
  // Customer Methods
  // ----------------------------------------------------------------

  public getCustomers(): Customer[] {
    return [...this.state.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.state.customers.find(c => c.id === id);
  }

  public getSelectedCustomerId(): string {
    return this.state.selectedCustomerId || (this.state.customers[0]?.id || '');
  }

  public setSelectedCustomerId(id: string) {
    this.state.selectedCustomerId = id;
    this.saveState();
  }

  public searchCustomers(query: string, statusFilter?: string): Customer[] {
    const q = query.trim().toLowerCase();
    return this.state.customers.filter(c => {
      const matchesStatus = !statusFilter || (c.status || 'Active') === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      const haystack = [
        c.name,
        c.customerName,
        c.phone,
        c.email,
        c.billingAddress,
        c.shippingAddress,
        c.notes,
        ...(c.aliases || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  public saveCustomer(customerData: Partial<Customer> & { name: string }): Customer {
    const id = customerData.id || this.generateUid('cust');
    const existingIndex = this.state.customers.findIndex(c => c.id === id);

    const record: Customer = {
      id,
      name: customerData.name.trim(),
      customerName: customerData.customerName?.trim() || customerData.name.trim(),
      phone: customerData.phone?.trim() || '',
      email: customerData.email?.trim() || '',
      billingAddress: customerData.billingAddress?.trim() || '',
      shippingAddress: customerData.shippingAddress?.trim() || '',
      status: customerData.status || 'Active',
      notes: customerData.notes?.trim() || '',
      aliases: customerData.aliases || [],
      createdAt: customerData.createdAt || this.getTodayStr(),
    };

    if (existingIndex >= 0) {
      this.state.customers[existingIndex] = { ...this.state.customers[existingIndex], ...record };
    } else {
      this.state.customers.push(record);
      this.state.customers.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.state.selectedCustomerId = record.id;
    this.saveState();
    return record;
  }

  public deleteCustomer(id: string): { success: boolean; message?: string } {
    const hasInvoices = this.state.invoices.some(i => i.customerId === id);
    const hasPayments = this.state.payments.some(p => p.customerId === id);
    if (hasInvoices || hasPayments) {
      return {
        success: false,
        message: 'This customer has invoices or payments on record. Mark the customer Inactive instead of deleting.',
      };
    }

    this.state.customers = this.state.customers.filter(c => c.id !== id);
    if (this.state.selectedCustomerId === id) {
      this.state.selectedCustomerId = this.state.customers[0]?.id || '';
    }
    this.saveState();
    return { success: true };
  }

  // ----------------------------------------------------------------
  // Balance & Calculation Methods
  // ----------------------------------------------------------------

  public getInvoicePaidAmount(invoiceId: string): number {
    return this.state.payments
      .filter(p => p.invoiceId === invoiceId)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }

  public getInvoiceBalance(invoice: Invoice): number {
    const paid = this.getInvoicePaidAmount(invoice.id);
    return Math.max(0, Number(invoice.amount || 0) - paid);
  }

  public getInvoiceStatus(invoice: Invoice): 'Paid' | 'Owing' {
    return this.getInvoiceBalance(invoice) <= 0.004 ? 'Paid' : 'Owing';
  }

  public getCustomerBalance(customerId: string): number {
    const totalInvoiced = this.state.invoices
      .filter(i => i.customerId === customerId)
      .reduce((sum, i) => sum + this.getInvoiceBalance(i), 0);

    const unappliedPayments = this.state.payments
      .filter(p => p.customerId === customerId && !p.invoiceId)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return totalInvoiced - unappliedPayments;
  }

  public getCustomerOpenInvoices(customerId: string): Invoice[] {
    return this.state.invoices.filter(i => i.customerId === customerId && this.getInvoiceBalance(i) > 0.004);
  }

  public getCustomerLedgerEntries(customerId: string) {
    const customer = this.getCustomerById(customerId);

    const invoices = this.state.invoices
      .filter(i => i.customerId === customerId)
      .map(i => ({
        id: i.id,
        date: i.date,
        type: 'Invoice' as const,
        number: i.number,
        memo: i.memo || 'Customer Invoice',
        charge: Number(i.amount || 0),
        payment: 0,
        source: 'System Invoice',
      }));

    const payments = this.state.payments
      .filter(p => p.customerId === customerId)
      .map(p => ({
        id: p.id,
        date: p.date,
        type: 'Payment' as const,
        number: p.reference || '',
        memo: `${p.method || 'Payment'}${p.invoiceId ? ' • Applied to invoice' : ''}`,
        charge: 0,
        payment: Number(p.amount || 0),
        source: 'System Payment',
      }));

    // Match historical General Ledger transactions by customer name / aliases
    let glEntries: any[] = [];
    if (customer) {
      const namesToMatch = [
        customer.name, 
        customer.customerName, 
        ...(customer.aliases || [])
      ]
        .filter(Boolean)
        .map(n => n!.toLowerCase().trim());

      const rawGL = (importedData.generalLedger as GeneralLedgerEntry[]) || [];
      glEntries = rawGL
        .filter((g: GeneralLedgerEntry) => {
          if (!g.name) return false;
          const gName = g.name.toLowerCase().trim();
          return namesToMatch.some(n => gName === n || gName.includes(n) || (n.length > 5 && n.includes(gName)));
        })
        .map((g: GeneralLedgerEntry) => ({
          id: g.id || `gl-${g.date}-${g.number || Math.random()}`,
          date: g.date,
          type: (g.type || 'General') as any,
          number: g.number || '',
          memo: g.memo || g.account || 'Historical Ledger Record',
          charge: Number(g.debit || 0),
          payment: Number(g.credit || 0),
          source: g.source || 'Imported GL',
        }));
    }

    return [...invoices, ...payments, ...glEntries].sort((a, b) => b.date.localeCompare(a.date));
  }

  // ----------------------------------------------------------------
  // Invoices & Payments Methods
  // ----------------------------------------------------------------

  public getInvoices(): Invoice[] {
    return [...this.state.invoices].sort((a, b) => b.date.localeCompare(a.date));
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.state.invoices.find(i => i.id === id);
  }

  public saveInvoice(invoiceData: Omit<Invoice, 'id' | 'status'> & { id?: string }): Invoice {
    const id = invoiceData.id || this.generateUid('inv');
    const customer = this.getCustomerById(invoiceData.customerId);
    const existingIndex = this.state.invoices.findIndex(i => i.id === id);

    const totalAmount = invoiceData.items?.reduce((sum, item) => sum + Number(item.quantity || 1) * Number(item.rate || 0), 0) || Number(invoiceData.amount || 0);

    const record: Invoice = {
      id,
      customerId: invoiceData.customerId,
      customerName: customer?.name || invoiceData.customerName || 'Unknown Customer',
      customerEmail: customer?.email || invoiceData.customerEmail || '',
      number: invoiceData.number?.trim() || `INV-${Date.now().toString().slice(-6)}`,
      terms: invoiceData.terms || 'Net 30',
      date: invoiceData.date || this.getTodayStr(),
      dueDate: invoiceData.dueDate || this.getTodayStr(),
      items: invoiceData.items || [],
      memo: invoiceData.memo?.trim() || '',
      amount: totalAmount,
      paidAmount: this.getInvoicePaidAmount(id),
      balance: Math.max(0, totalAmount - this.getInvoicePaidAmount(id)),
      status: totalAmount - this.getInvoicePaidAmount(id) <= 0.004 ? 'Paid' : 'Owing',
      createdAt: this.getTodayStr(),
    };

    if (existingIndex >= 0) {
      this.state.invoices[existingIndex] = record;
    } else {
      this.state.invoices.push(record);
    }

    this.saveState();
    return record;
  }

  public deleteInvoice(id: string): { success: boolean; message?: string } {
    if (this.state.payments.some(p => p.invoiceId === id)) {
      return { success: false, message: 'This invoice has payments recorded against it and cannot be deleted.' };
    }
    this.state.invoices = this.state.invoices.filter(i => i.id !== id);
    this.saveState();
    return { success: true };
  }

  public getPayments(): Payment[] {
    return [...this.state.payments].sort((a, b) => b.date.localeCompare(a.date));
  }

  public savePayment(paymentData: Omit<Payment, 'id'> & { id?: string }): Payment {
    const id = paymentData.id || this.generateUid('pmt');
    const customer = this.getCustomerById(paymentData.customerId);

    const record: Payment = {
      id,
      customerId: paymentData.customerId,
      customerName: customer?.name || paymentData.customerName || '',
      invoiceId: paymentData.invoiceId || '',
      amount: Number(paymentData.amount || 0),
      date: paymentData.date || this.getTodayStr(),
      method: paymentData.method || 'Bank Transfer',
      reference: paymentData.reference?.trim() || '',
      note: paymentData.note?.trim() || '',
      createdAt: this.getTodayStr(),
    };

    const existingIndex = this.state.payments.findIndex(p => p.id === id);
    if (existingIndex >= 0) {
      this.state.payments[existingIndex] = record;
    } else {
      this.state.payments.push(record);
    }

    this.saveState();
    return record;
  }

  public deletePayment(id: string) {
    this.state.payments = this.state.payments.filter(p => p.id !== id);
    this.saveState();
  }

  // ----------------------------------------------------------------
  // Aging Report & General Ledger
  // ----------------------------------------------------------------

  private calculateDaysLate(dueDate: string, asOfDate: string): number {
    const diff = new Date(`${asOfDate}T12:00:00`).getTime() - new Date(`${dueDate}T12:00:00`).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  public getAgingForCustomer(customerId: string, asOfDate: string = this.getTodayStr()) {
    const result = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0, total: 0 };
    const openInvoices = this.getCustomerOpenInvoices(customerId);

    openInvoices.forEach(inv => {
      if (inv.date > asOfDate) return;
      const bal = this.getInvoiceBalance(inv);
      const days = this.calculateDaysLate(inv.dueDate || inv.date, asOfDate);
      result.total += bal;

      if (days <= 0) result.current += bal;
      else if (days <= 30) result.d1_30 += bal;
      else if (days <= 60) result.d31_60 += bal;
      else if (days <= 90) result.d61_90 += bal;
      else result.d90_plus += bal;
    });

    return result;
  }

  public getAgingReport(asOfDate: string = this.getTodayStr()): { summaries: AgingSummary[]; total: AgingSummary } {
    this.state.asOf = asOfDate;
    this.saveState();

    const summaries: AgingSummary[] = this.state.customers
      .map(c => {
        const aging = this.getAgingForCustomer(c.id, asOfDate);
        return {
          customerId: c.id,
          customerName: c.name,
          current: aging.current,
          d1_30: aging.d1_30,
          d31_60: aging.d31_60,
          d61_90: aging.d61_90,
          d90_plus: aging.d90_plus,
          total: aging.total,
        };
      })
      .filter(item => item.total > 0.004)
      .sort((a, b) => b.total - a.total);

    const total: AgingSummary = summaries.reduce(
      (acc, s) => ({
        customerId: 'TOTAL',
        customerName: 'TOTAL',
        current: acc.current + s.current,
        d1_30: acc.d1_30 + s.d1_30,
        d31_60: acc.d31_60 + s.d31_60,
        d61_90: acc.d61_90 + s.d61_90,
        d90_plus: acc.d90_plus + s.d90_plus,
        total: acc.total + s.total,
      }),
      { customerId: 'TOTAL', customerName: 'TOTAL', current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0, total: 0 }
    );

    return { summaries, total };
  }

  public getAllGeneralLedger(): GeneralLedgerEntry[] {
    const liveEntries: GeneralLedgerEntry[] = [];

    // Map Invoices to AR & Service Income
    this.state.invoices.forEach(i => {
      const c = this.getCustomerById(i.customerId);
      liveEntries.push({
        id: `${i.id}_ar`,
        date: i.date,
        type: 'Invoice',
        number: i.number,
        name: c?.name || 'Unknown',
        memo: i.memo || 'Customer invoice',
        account: 'Accounts Receivable',
        debit: Number(i.amount || 0),
        credit: 0,
        source: 'Created in App',
      });
      liveEntries.push({
        id: `${i.id}_rev`,
        date: i.date,
        type: 'Invoice',
        number: i.number,
        name: c?.name || 'Unknown',
        memo: i.memo || 'Customer invoice',
        account: 'Service Income',
        debit: 0,
        credit: Number(i.amount || 0),
        source: 'Created in App',
      });
    });

    // Map Payments to Cash/Bank & AR
    this.state.payments.forEach(p => {
      const c = this.getCustomerById(p.customerId);
      liveEntries.push({
        id: `${p.id}_cash`,
        date: p.date,
        type: 'Payment',
        number: p.reference || '',
        name: c?.name || '',
        memo: `${p.method || 'Payment'} received`,
        account: 'Cash / Bank',
        debit: Number(p.amount || 0),
        credit: 0,
        source: 'Created in App',
      });
      liveEntries.push({
        id: `${p.id}_ar`,
        date: p.date,
        type: 'Payment',
        number: p.reference || '',
        name: c?.name || '',
        memo: 'Applied to customer balance',
        account: 'Accounts Receivable',
        debit: 0,
        credit: Number(p.amount || 0),
        source: 'Created in App',
      });
    });

    const historical = (importedData.generalLedger as GeneralLedgerEntry[]) || [];
    return [...historical, ...liveEntries, ...this.state.customLedger].sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );
  }

  // ----------------------------------------------------------------
  // KPIs & Backup / Restore
  // ----------------------------------------------------------------

  public getKPIs(): AccountingKPIs {
    const totalAR = this.state.customers.reduce((sum, c) => sum + Math.max(0, this.getCustomerBalance(c.id)), 0);
    const overdue = this.state.customers.reduce((sum, c) => {
      const a = this.getAgingForCustomer(c.id);
      return sum + a.d1_30 + a.d31_60 + a.d61_90 + a.d90_plus;
    }, 0);
    const received = this.state.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      customerCount: this.state.customers.length,
      openInvoices: this.state.invoices.filter(i => this.getInvoiceBalance(i) > 0.004).length,
      accountsReceivable: totalAR,
      overdue,
      paymentsReceived: received,
      importSummary: `${this.state.customers.length} customers • ${(importedData.generalLedger?.length || 0).toLocaleString()} imported ledger transactions`,
    };
  }

  public exportBackupJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public restoreBackupJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.customers)) {
        this.state = {
          version: parsed.version || 1,
          customers: parsed.customers,
          invoices: parsed.invoices || [],
          payments: parsed.payments || [],
          customLedger: parsed.customLedger || [],
          selectedCustomerId: parsed.selectedCustomerId || '',
          asOf: parsed.asOf || this.getTodayStr(),
        };
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('Failed to restore backup', e);
    }
    return false;
  }
}

export const accountingService = new AccountingService();
