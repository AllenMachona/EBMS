import React, { useState } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';

const STAGES = ['COMPLIANCE', 'TECHNICAL', 'FINANCIAL'];

export default function EvaluationPanel({ procurement }) {
  const { user } = useAuth();
  const [stage, setStage] = useState('COMPLIANCE');
  const [bidderId, setBidderId] = useState('');
  const [score, setScore] = useState('');
  const [passed, setPassed] = useState(true);
  const [comments, setComments] = useState('');
  const [consensus, setConsensus] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const showableStages = {
    COMPLIANCE: ['CLOSED', 'TECHNICAL_OPENING', 'COMPLIANCE_EVALUATION'],
    TECHNICAL: ['COMPLIANCE_EVALUATION', 'TECHNICAL_EVALUATION'],
    FINANCIAL: ['FINANCIAL_OPENING', 'FINANCIAL_EVALUATION'],
  };
  if (!Object.values(showableStages).some((arr) => arr.includes(procurement.status))) return null;

  const canScore = ['COMMITTEE_MEMBER', 'COMMITTEE_CHAIR'].includes(user.role);

  async function submitScore(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await client.post('/evaluations/score', {
        procurementId: procurement.id, bidderId, stage, score: score || null, passed, comments,
      });
      setOk('Score recorded.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit score.');
    }
  }

  async function loadConsensus() {
    const { data } = await client.get(`/evaluations/consensus/${procurement.id}/${stage}`);
    setConsensus(data);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy-900">Evaluation</h2>
      <div className="mb-4 flex gap-2">
        {STAGES.map((s) => (
          <button key={s} onClick={() => { setStage(s); setConsensus(null); }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${stage === s ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {s}
          </button>
        ))}
      </div>

      {canScore && (
        <form onSubmit={submitScore} className="mb-6 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-4">
          <div>
            <label className="block text-xs font-medium text-slate-600">Bidder ID</label>
            <input value={bidderId} onChange={(e) => setBidderId(e.target.value)} required
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" placeholder="paste bidder id" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Score (0–100)</label>
            <input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Result</label>
            <select value={passed} onChange={(e) => setPassed(e.target.value === 'true')}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="true">Pass</option>
              <option value="false">Fail</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600">Comments</label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" rows={2} />
          </div>
          <button type="submit" className="col-span-2 rounded-md bg-navy-800 py-2 text-sm font-semibold text-white hover:bg-navy-700">
            Submit Independent Score
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-700">{ok}</p>}

      <button onClick={loadConsensus} className="text-sm font-medium text-navy-700 underline">
        View consensus status for {stage}
      </button>

      {consensus && (
        <div className="mt-4 rounded-md border border-slate-200 p-4 text-sm">
          <p className="font-medium">
            {consensus.distinctEvaluatorsSoFar} / {consensus.votingMembersExpected} committee members have scored
            {consensus.allMembersScored && <span className="ml-2 text-emerald-700">— all scores in</span>}
          </p>
          {Object.entries(consensus.byBidder).map(([bidderName, scores]) => (
            <div key={bidderName} className="mt-3">
              <p className="font-semibold text-navy-900">{bidderName}</p>
              <ul className="ml-4 list-disc text-slate-600">
                {scores.map((s, i) => <li key={i}>{s.evaluator}: {s.score ?? '—'} ({s.passed ? 'Pass' : 'Fail'})</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
