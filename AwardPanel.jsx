import React, { useState } from 'react';
import client from '../../api/client';

export default function AwardPanel({ procurement, onChanged }) {
  const [winningBidderId, setWinningBidderId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  if (!['AWARD_PENDING_APPROVAL', 'AWARD_PUBLISHED', 'COOLING_OFF', 'COMPLAINT_HOLD', 'READY_FOR_CONTRACT'].includes(procurement.status)) {
    return null;
  }

  async function publishAward(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await client.post('/awards', { procurementId: procurement.id, winningBidderId });
      setOk('Award published. Cooling-off period has started.');
      onChanged && onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not publish award.');
    }
  }

  async function conclude() {
    setError(''); setOk('');
    try {
      await client.post(`/awards/${procurement.id}/conclude`);
      setOk('Contract conclusion recorded.');
      onChanged && onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not conclude contract.');
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy-900">Award &amp; Cooling-Off</h2>

      {procurement.status === 'AWARD_PENDING_APPROVAL' && (
        <form onSubmit={publishAward} className="mt-3 flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600">Winning bidder ID</label>
            <input value={winningBidderId} onChange={(e) => setWinningBidderId(e.target.value)} required
              className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" placeholder="paste bidder id" />
          </div>
          <button type="submit" className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
            Publish Award
          </button>
        </form>
      )}

      {procurement.coolingOffExpiry && (
        <p className="mt-3 text-sm text-slate-600">
          Cooling-off expires: <span className="font-medium">{new Date(procurement.coolingOffExpiry).toLocaleString()}</span>
        </p>
      )}

      {['COOLING_OFF', 'COMPLAINT_HOLD'].includes(procurement.status) && (
        <button onClick={conclude} className="mt-4 rounded-md bg-gold-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gold-500">
          Attempt Contract Conclusion
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {ok && <p className="mt-3 text-sm text-emerald-700">{ok}</p>}
    </div>
  );
}
