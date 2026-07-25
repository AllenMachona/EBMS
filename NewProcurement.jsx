import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

const METHODS = [
  'OPEN_DOMESTIC_BIDDING', 'OPEN_INTERNATIONAL_BIDDING', 'RESTRICTED_DOMESTIC_BIDDING',
  'RESTRICTED_INTERNATIONAL_BIDDING', 'REQUEST_FOR_QUOTATIONS', 'MICRO_PROCUREMENT',
  'DIRECT_PROCUREMENT', 'REQUEST_FOR_PROPOSALS_WITH_COMPETITIVE_NEGOTIATIONS',
  'COMPETITIVE_DIALOGUE', 'REVERSE_AUCTION', 'EMERGENCY_PROCUREMENT',
];

export default function NewProcurement() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', category: 'works', method: 'OPEN_DOMESTIC_BIDDING',
    envelopeType: 'SINGLE', estimatedValue: '', fundingSource: '',
  });
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await client.post('/procurements', form);
      navigate(`/procurements/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create procurement.');
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display mb-6 text-2xl font-bold text-navy-900">New Procurement</h1>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input required value={form.title} onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select value={form.category} onChange={(e) => update('category', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="works">Works</option>
              <option value="services">Services</option>
              <option value="consultancy">Consultancy Services</option>
              <option value="supplies">Supplies</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Envelope Type</label>
            <select value={form.envelopeType} onChange={(e) => update('envelopeType', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="SINGLE">Single Envelope</option>
              <option value="TECHNICAL">Dual Envelope (Technical + Financial)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Procurement Method</label>
          <select value={form.method} onChange={(e) => update('method', e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {METHODS.map((m) => <option key={m} value={m}>{m.replaceAll('_', ' ')}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Estimated Value (BWP)</label>
            <input required type="number" min="0" value={form.estimatedValue}
              onChange={(e) => update('estimatedValue', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Funding Source</label>
            <input value={form.fundingSource} onChange={(e) => update('fundingSource', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
          Create Procurement
        </button>
      </form>
    </div>
  );
}
