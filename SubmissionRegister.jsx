import React, { useEffect, useState } from 'react';
import client from '../../api/client';

export default function SubmissionRegister({ procurementId }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    client.get(`/submissions/register/${procurementId}`).then((res) => setRows(res.data)).catch(() => {});
  }, [procurementId]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy-900">Submission Register</h2>
      <p className="mb-4 text-sm text-slate-500">Bidder names and receipts only — bid content stays sealed until opening.</p>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No submissions yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="py-1">Bidder</th><th>Envelope</th><th>Version</th><th>Status</th><th>Submitted</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="py-1.5">{r.bidder}</td>
                <td>{r.envelopeType}</td>
                <td>v{r.version}</td>
                <td>{r.status}</td>
                <td>{new Date(r.submittedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
