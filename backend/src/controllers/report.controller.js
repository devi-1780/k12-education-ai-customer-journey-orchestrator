import { z } from 'zod';
import Report from '../models/Report.js';
import Ticket from '../models/Ticket.js';
import Campaign from '../models/Campaign.js';
import Recommendation from '../models/Recommendation.js';
import Outcome from '../models/Outcome.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildMeta } from '../utils/pagination.js';
import { logAudit } from '../services/audit.service.js';

export const reportSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['journey', 'campaign', 'service', 'conversion', 'retention']),
  filters: z.record(z.any()).optional(),
  format: z.enum(['csv', 'pdf']).optional(),
});

export const listReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { organisationId: req.user.organisationId };
  const [items, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Report.countDocuments(filter),
  ]);
  return ApiResponse.ok(res, 'Reports fetched', items, buildMeta(page, limit, total));
});

export const generateReport = asyncHandler(async (req, res) => {
  const report = await Report.create({ ...req.body, organisationId: req.user.organisationId, generatedBy: req.user.id, status: 'pending' });

  // Synchronous "background job" pattern kept simple for demo purposes.
  try {
    const data = await buildReportData(req.user.organisationId, req.body.type, req.body.filters);
    report.status = 'completed';
    report.fileUrl = `/api/v1/reports/${report._id}/download`;
    report._data = data;
    await report.save();
  } catch (err) {
    report.status = 'failed';
    await report.save();
  }

  await logAudit({ req, action: 'report.generate', entityType: 'Report', entityId: report._id, newValue: { type: report.type, status: report.status } });
  return ApiResponse.created(res, 'Report generation started', report);
});

export const downloadReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, organisationId: req.user.organisationId });
  if (!report) throw ApiError.notFound('Report not found');
  const data = await buildReportData(req.user.organisationId, report.type, report.filters);

  await logAudit({ req, action: 'report.export', entityType: 'Report', entityId: report._id });

  if (report.format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.name}.pdf"`);
    return res.send(Buffer.from(`%PDF-1.4\n% Simplified placeholder PDF for report: ${report.name}\n${JSON.stringify(data).slice(0, 500)}`));
  }

  const rows = [Object.keys(data[0] || { info: 'no data' }).join(','), ...data.map((r) => Object.values(r).join(','))];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${report.name}.csv"`);
  return res.send(rows.join('\n'));
});

async function buildReportData(organisationId, type, filters = {}) {
  switch (type) {
    case 'service': {
      const tickets = await Ticket.find({ organisationId }).limit(200).lean();
      return tickets.map((t) => ({ id: t._id, subject: t.subject, status: t.status, priority: t.priority, createdAt: t.createdAt }));
    }
    case 'campaign': {
      const campaigns = await Campaign.find({ organisationId }).limit(200).lean();
      return campaigns.map((c) => ({ id: c._id, name: c.name, status: c.status, sent: c.stats?.sent, converted: c.stats?.converted }));
    }
    case 'conversion':
    case 'retention': {
      const outcomes = await Outcome.find({ organisationId, type }).limit(200).lean();
      return outcomes.map((o) => ({ id: o._id, type: o.type, value: JSON.stringify(o.value), measuredAt: o.measuredAt }));
    }
    case 'journey':
    default: {
      const recs = await Recommendation.find({ organisationId }).limit(200).lean();
      return recs.map((r) => ({ id: r._id, kind: r.kind, confidence: r.confidence, reviewState: r.reviewState }));
    }
  }
}
