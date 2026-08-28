'use client';

import { useEffect, useMemo, useState } from 'react';

interface Offer {
  id: string;
  applicationId: string;
  employerId: string;
  status: 'issued' | 'accepted' | 'rejected';
  title: string;
  body: string;
  salary?: string;
  startDate?: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  offerId: string;
  employerId: string;
  amount: number;
  currency: string;
  status: 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: string;
  createdAt: string;
}

export default function AdminOffersInvoicesPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    try {
      setOffers(JSON.parse(localStorage.getItem('offers') || '[]'));
      setInvoices(JSON.parse(localStorage.getItem('invoices') || '[]'));
      setJobs(JSON.parse(localStorage.getItem('jobs') || '[]'));
    } catch {}
  }, []);

  const saveOffers = (data: Offer[]) => {
    setOffers(data);
    localStorage.setItem('offers', JSON.stringify(data));
  };
  const saveInvoices = (data: Invoice[]) => {
    setInvoices(data);
    localStorage.setItem('invoices', JSON.stringify(data));
  };
  const saveJobs = (data: any[]) => {
    setJobs(data);
    localStorage.setItem('jobs', JSON.stringify(data));
  };

  const issueInvoice = (offer: Offer) => {
    const amount = 1000; // demo
    const inv: Invoice = {
      id: `inv-${offer.id}`,
      offerId: offer.id,
      employerId: offer.employerId,
      amount,
      currency: 'USD',
      status: 'sent',
      createdAt: new Date().toISOString()
    };
    const updated = [inv, ...invoices.filter(i => i.offerId !== offer.id)];
    saveInvoices(updated);
  };

  const markPaid = (invoiceId: string) => {
    const updated = invoices.map(i => i.id === invoiceId ? { ...i, status: 'paid' as const } : i);
    saveInvoices(updated);
  };

  const closeJob = (applicationId: string) => {
    const updated = [...jobs.filter(j => j.applicationId !== applicationId), { applicationId, status: 'closed', closedAt: new Date().toISOString() }];
    saveJobs(updated);
  };

  const acceptedOffers = useMemo(() => offers.filter(o => o.status === 'accepted'), [offers]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Offers & Invoices</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b font-semibold">Accepted Offers</div>
          <div className="p-4 space-y-3">
            {acceptedOffers.length === 0 && <div className="text-gray-600">No accepted offers yet.</div>}
            {acceptedOffers.map(o => (
              <div key={o.id} className="p-4 border rounded-lg bg-gray-50">
                <div className="font-semibold">{o.title}</div>
                <div className="text-sm text-gray-600">Application: {o.applicationId}</div>
                <div className="text-sm text-gray-600">Salary: {o.salary ?? '-'} • Start: {o.startDate ?? '-'}</div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => issueInvoice(o)} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded">Create Invoice</button>
                  <button onClick={() => closeJob(o.applicationId)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded">Close Job</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b font-semibold">Invoices</div>
          <div className="p-4 space-y-3">
            {invoices.length === 0 && <div className="text-gray-600">No invoices yet.</div>}
            {invoices.map(i => (
              <div key={i.id} className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold">Invoice {i.id}</div>
                  <div className="text-sm text-gray-600">Offer: {i.offerId} • {i.amount} {i.currency}</div>
                  <div className="text-xs mt-1"><span className={`px-2 py-0.5 rounded-full ${i.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{i.status}</span></div>
                </div>
                <div className="flex gap-2">
                  {i.status !== 'paid' && (
                    <button onClick={() => markPaid(i.id)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded">Mark Paid</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
