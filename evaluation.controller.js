const prisma = require('../config/db');
const { logAudit } = require('../middleware/audit');

// FR-EVAL-004: independent scoring before consensus. Each evaluator's
// score is a distinct row; there is no endpoint that lets an evaluator
// see another evaluator's score before submitting their own.
async function submitScore(req, res, next) {
  try {
    const { procurementId, bidderId, stage, score, passed, comments } = req.body;

    const existingOwnScore = await prisma.evaluation.findFirst({
      where: { procurementId, bidderId, stage, evaluatorId: req.user.id },
    });
    if (existingOwnScore) {
      return res.status(409).json({ error: 'You have already submitted a score for this bidder at this stage.' });
    }

    const evaluation = await prisma.evaluation.create({
      data: { procurementId, bidderId, evaluatorId: req.user.id, stage, score, passed, comments },
    });

    await logAudit({
      req, action: 'EVALUATION_SCORE_SUBMITTED', entityType: 'Evaluation', entityId: evaluation.id,
      newValue: { stage, bidderId, score, passed },
    });

    res.status(201).json(evaluation);
  } catch (err) {
    next(err);
  }
}

// Committee secretary / chair view: all scores, revealed only once every
// appointed member has scored (simple consensus-readiness check).
async function consensusView(req, res, next) {
  try {
    const { procurementId, stage } = req.params;

    const committee = await prisma.evaluationCommittee.findUnique({
      where: { procurementId },
      include: { members: true },
    });
    const votingMembers = committee ? committee.members.filter((m) => m.role !== 'SECRETARY') : [];

    const evaluations = await prisma.evaluation.findMany({
      where: { procurementId, stage },
      include: { bidder: { select: { companyName: true } }, evaluator: { select: { name: true } } },
    });

    const byBidder = {};
    for (const e of evaluations) {
      byBidder[e.bidder.companyName] = byBidder[e.bidder.companyName] || [];
      byBidder[e.bidder.companyName].push({ evaluator: e.evaluator.name, score: e.score, passed: e.passed });
    }

    const distinctEvaluatorsSoFar = new Set(evaluations.map((e) => e.evaluatorId)).size;

    res.json({
      votingMembersExpected: votingMembers.length,
      distinctEvaluatorsSoFar,
      allMembersScored: votingMembers.length > 0 && distinctEvaluatorsSoFar >= votingMembers.length,
      byBidder,
    });
  } catch (err) {
    next(err);
  }
}

async function createCommittee(req, res, next) {
  try {
    const { procurementId, members } = req.body; // members: [{userId, role}]
    const committee = await prisma.evaluationCommittee.create({
      data: {
        procurementId,
        members: { create: members },
      },
      include: { members: true },
    });
    await logAudit({ req, action: 'COMMITTEE_CREATED', entityType: 'EvaluationCommittee', entityId: committee.id, newValue: committee });
    res.status(201).json(committee);
  } catch (err) {
    next(err);
  }
}

module.exports = { submitScore, consensusView, createCommittee };
