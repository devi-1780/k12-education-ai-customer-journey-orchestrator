import { z } from 'zod';
import Configuration from '../models/Configuration.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { logAudit } from '../services/audit.service.js';

export const configSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  category: z.enum(['ai_settings', 'workflow_rules', 'thresholds', 'integrations', 'notification_rules', 'master_data']).optional(),
});

export const listConfig = asyncHandler(async (req, res) => {
  const filter = { organisationId: req.user.organisationId };
  if (req.query.category) filter.category = req.query.category;
  const items = await Configuration.find(filter).sort({ category: 1, key: 1 });
  return ApiResponse.ok(res, 'Configuration fetched', items);
});

export const upsertConfig = asyncHandler(async (req, res) => {
  const { key, value, category } = req.body;
  const previous = await Configuration.findOne({ organisationId: req.user.organisationId, key });
  const config = await Configuration.findOneAndUpdate(
    { organisationId: req.user.organisationId, key },
    { $set: { value, category, updatedBy: req.user.id } },
    { upsert: true, new: true }
  );
  await logAudit({ req, action: 'config.update', entityType: 'Configuration', entityId: config._id, previousValue: previous, newValue: config });
  return ApiResponse.ok(res, 'Configuration saved', config);
});
