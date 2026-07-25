import React, { useEffect, useState } from 'react';
import client from '../../api/client';

export default function BidderSubmissionPanel({ procurement }) {
  const [file, setFile] = useState(null);
  const [envelopeType, setEnvelopeType] = useState(procurement.envelopeType === 'SINGLE' ? 'SINGLE' : 'TECHNICAL');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [mySubmissions, setMySubmissions] = useState([]);

  useEffect(() => {
    client.get(`/submissions/mine/${procurement.id}`).then((res) => setMySubmissions(res.data)).catch(() => {});
  }, [procurement.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setReceipt(null);
    if (!file) { setError('Please choose a file to submit.'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('procurementId', procurement.id);
    formData.append('envelopeType', envelopeType);

    try {
      const { data } = await client.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReceipt(data);
      const refreshed = await client.get(`/submissions/mine/${procurement.id}`);
      setMySubmissions(refreshed.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    }
  }

  const submissionsOpen = procurement.status === 'SUBMISSION_OPEN';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy-900">Your Submission</h2>
      <p className="mb-4 text-sm text-slate-500">
        Files are encrypted immediately on upload. No procurement officer can view your bid before the
        authorised, multi-person-controlled opening.
      </p>

      {!submissionsOpen && (
        <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          Submissions are not currently open (status: {procurement.status.replaceAll('_', ' ')}).
        </p>
      )}

      {submissionsOpen && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          {procurement.envelopeType !== 'SINGLE' && (
            <div>
              <label className="block text-xs font-medium text-slate-600">Envelope</label>
              <select value={envelopeType} onChange={(e) => setEnvelopeType(e.target.value)}
                className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="TECHNICAL">Technical</option>
                <option value="FINANCIAL">Financial</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600">Bid document</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])}
              className="mt-1 text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
            Submit Sealed Bid
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {receipt && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Submission received.</p>
          <p>Receipt: <span className="font-mono">{receipt.receiptCode}</span></p>
          <p>Submitted at: {new Date(receipt.submittedAt).toLocaleString()}</p>
        </div>
      )}

      {mySubmissions.length > 0 && (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="py-1">Envelope</th><th>Version</th><th>Status</th><th>Receipt</th></tr>
          </thead>
          <tbody>
            {mySubmissions.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="py-1.5">{s.envelopeType}</td>
                <td>v{s.version}</td>
                <td>{s.status}</td>
                <td className="font-mono text-xs">{s.receiptCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
