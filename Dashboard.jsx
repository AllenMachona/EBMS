import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/Layout.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/procurements').then((res) => setProcurements(res.data)).finally(() => setLoading(false));
  }, []);

  const canCreate = ['PROCUREMENT_UNIT', 'USER_DEPARTMENT'].includes(user.role);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Procurements</h1>
          <p className="text-sm text-slate-500">
            {user.role === 'BIDDER' ? 'Published tenders you can view and bid on.' : 'All procurements in the system.'}
          </p>
        </div>
        {canCreate && (
          <Link to="/procurements/new" className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
            + New Procurement
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : procurements.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No procurements to show yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tender No.</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {procurements.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.tenderNumber}</td>
                  <td className="px-4 py-3">
                    <Link to={`/procurements/${p.id}`} className="font-medium text-navy-800 hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.method?.replaceAll('_', ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.closingAt ? new Date(p.closingAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
