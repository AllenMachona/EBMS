import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function BidderRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '', registrationNumber: '', ppraCode: '', contactEmail: '',
    contactPhone: '', adminName: '', adminPassword: '',
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/bidders/register', form);
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="font-display text-2xl font-bold text-navy-900">Bidder Registration</h1>
        <p className="mb-6 text-sm text-slate-500">Register your company once to access all published tenders.</p>
        {done ? (
          <p className="text-emerald-700">Registration successful — redirecting to sign in…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Company name" value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input required placeholder="Registration number" value={form.registrationNumber}
              onChange={(e) => update('registrationNumber', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="PPRA code (optional)" value={form.ppraCode}
              onChange={(e) => update('ppraCode', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input required type="email" placeholder="Contact email" value={form.contactEmail}
              onChange={(e) => update('contactEmail', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Contact phone" value={form.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <hr className="my-2" />
            <input required placeholder="Your name (bidder admin)" value={form.adminName}
              onChange={(e) => update('adminName', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input required type="password" placeholder="Choose a password" value={form.adminPassword}
              onChange={(e) => update('adminPassword', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full rounded-md bg-navy-800 py-2.5 text-sm font-semibold text-white hover:bg-navy-700">
              Register Company
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-xs text-slate-400">
          Already registered? <Link to="/login" className="text-navy-700 underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
