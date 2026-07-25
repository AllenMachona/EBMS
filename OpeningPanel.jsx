import React, { useEffect, useState } from 'react';
import client from '../../api/client';

export default function OpeningPanel({ procurement, onChanged }) {
  const envelopeType = procurement.envelopeType === 'SINGLE' ? 'SINGLE' : 'TECHNICAL';
  const [quorum, setQuorum] = useState(null);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');

  async function loadQuorum() {
    const { data } = await client.get(`/opening/quorum/${procurement.id}/${envelopeType}`);
    setQuorum(data);
  }

  useEffect(() => {
    if (['CLOSED', 'TECHNICAL_OPENING', 'FINANCIAL_OPENING'].includes(procurement.status)) {
      loadQuorum();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procurement.status]);

  async function confirmPresence() {
    setError('');
    try {
      await client.post('/opening/confirm', { procurementId: procurement.id, envelopeType });
      loadQuorum();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not confirm presence.');
    }
  }

  async function openEnvelope() {
    setError('');
    try {
      const { data } = await client.post('/opening/open', { procurementId: procurement.id, envelopeType });
      setRecord(data);
      onChanged && onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Envelope could not be opened.');
    }
  }

  if (!['CLOSED', 'TECHNICAL_OPENING', 'FINANCIAL_OPENING'].includes(procurement.status)) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy-900">Bid Opening — {envelopeType} envelope</h2>
      <p className="mb-4 text-sm text-slate-500">
        No single person can decrypt a sealed bid. {quorum?.required ?? '…'} distinct panel members must confirm
        attendance before opening is permitted.
      </p>

      {quorum && (
        <div className="mb-4 rounded-md bg-slate-50 p-4 text-sm">
          <p className="font-medium">{quorum.confirmed} / {quorum.required} panel members confirmed
            {quorum.met && <span className="ml-2 text-emerald-700">— quorum met</span>}
          </p>
          <ul className="mt-1 text-slate-600">
            {quorum.confirmedBy.map((c, i) => <li key={i}>{c.name} — {new Date(c.at).toLocaleTimeString()}</li>)}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={confirmPresence} className="rounded-md border border-navy-700 px-4 py-2 text-sm font-medium text-navy-800 hover:bg-navy-50">
          Confirm My Presence
        </button>
        <button
          onClick={openEnvelope}
          disabled={!quorum?.met}
          className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-40"
        >
          Open Envelope
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {record && (
        <div className="mt-4 rounded-md border border-navy-200 bg-navy-50 p-4 text-sm">
          <p className="font-semibold text-navy-900">Opening record — {new Date(record.openedAt).toLocaleString()}</p>
          <table className="mt-2 w-full text-left">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-1">Bidder</th><th>Receipt</th><th>Integrity</th></tr>
            </thead>
            <tbody>
              {record.record.map((r) => (
                <tr key={r.submissionId} className="border-t border-navy-100">
                  <td className="py-1.5">{r.bidder}</td>
                  <td className="font-mono text-xs">{r.receiptCode}</td>
                  <td className="text-emerald-700">Verified ({r.integrityVerifiedBytes} bytes)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
