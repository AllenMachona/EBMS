import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/Layout.jsx';
import BidderSubmissionPanel from '../Submission/BidderSubmissionPanel.jsx';
import SubmissionRegister from '../Submission/SubmissionRegister.jsx';
import OpeningPanel from '../Opening/OpeningPanel.jsx';
import EvaluationPanel from '../Evaluation/EvaluationPanel.jsx';
import AwardPanel from '../Award/AwardPanel.jsx';

const NEXT_STATUS = {
  DRAFT: 'INTERNAL_REVIEW',
  INTERNAL_REVIEW: 'APPROVED_FOR_PUBLICATION',
  APPROVED_FOR_PUBLICATION: 'PUBLISHED',
  PUBLISHED: 'SUBMISSION_OPEN',
  SUBMISSION_OPEN: 'CLOSED',
  CLOSED: 'TECHNICAL_OPENING',
  TECHNICAL_OPENING: 'COMPLIANCE_EVALUATION',
  COMPLIANCE_EVALUATION: 'TECHNICAL_EVALUATION',
  TECHNICAL_EVALUATION: 'TECHNICAL_OUTCOME_APPROVED',
};

export default function ProcurementDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [procurement, setProcurement] = useState(null);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    client.get(`/procurements/${id}`).then((res) => setProcurement(res.data));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  async function advanceStatus() {
    setError('');
    const to = NEXT_STATUS[procurement.status];
    if (!to) return;
    try {
      await client.patch(`/procurements/${id}/status`, { to });
      reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change status.');
    }
  }

  if (!procurement) return <p className="text-sm text-slate-500">Loading…</p>;

  const canAdvance = ['PROCUREMENT_UNIT', 'ACCOUNTING_OFFICER', 'OVERSIGHT_UNIT'].includes(user.role)
    && NEXT_STATUS[procurement.status];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-slate-500">{procurement.tenderNumber}</p>
            <h1 className="font-display text-2xl font-bold text-navy-900">{procurement.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
              <StatusBadge status={procurement.status} />
              <span>{procurement.method?.replaceAll('_', ' ')}</span>
              <span>·</span>
              <span>{procurement.envelopeType === 'SINGLE' ? 'Single envelope' : 'Dual envelope'}</span>
            </div>
          </div>
          {canAdvance && (
            <button onClick={advanceStatus} className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
              Advance → {NEXT_STATUS[procurement.status].replaceAll('_', ' ')}
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {user.role === 'BIDDER' && (
        <BidderSubmissionPanel procurement={procurement} />
      )}

      {['PROCUREMENT_UNIT', 'OPENING_PANEL', 'OVERSIGHT_UNIT', 'AUDITOR'].includes(user.role) && (
        <SubmissionRegister procurementId={id} />
      )}

      {['OPENING_PANEL', 'PROCUREMENT_UNIT'].includes(user.role) && (
        <OpeningPanel procurement={procurement} onChanged={reload} />
      )}

      {['COMMITTEE_CHAIR', 'COMMITTEE_MEMBER', 'COMMITTEE_SECRETARY', 'PROCUREMENT_UNIT'].includes(user.role) && (
        <EvaluationPanel procurement={procurement} />
      )}

      {['ACCOUNTING_OFFICER', 'PROCUREMENT_UNIT'].includes(user.role) && (
        <AwardPanel procurement={procurement} onChanged={reload} />
      )}
    </div>
  );
}
