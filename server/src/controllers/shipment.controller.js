import { z } from 'zod';
import { Op } from 'sequelize';

import { Shipment } from '../models/Shipment.js';

const createSchema = z.object({
  tracking_number: z.string().min(3),
  sender_name: z.string().min(1),
  receiver_name: z.string().min(1),
  destination: z.string().min(1),
  shipment_date: z.string().date().or(z.string().min(8)),
  delivery_date: z.string().date().or(z.string().min(0)).optional(),
  status: z.enum(['Pending', 'In Transit', 'Delivered', 'Cancelled']).optional(),
});

const updateSchema = z.object({
  sender_name: z.string().min(1).optional(),
  receiver_name: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  shipment_date: z.string().min(8).optional(),
  delivery_date: z.string().min(0).optional(),
  status: z.enum(['Pending', 'In Transit', 'Delivered', 'Cancelled']).optional(),
});

export async function createShipment(req, res) {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });

  const payload = parse.data;
  try {
    const existing = await Shipment.findOne({ where: { tracking_number: payload.tracking_number } });
    if (existing) return res.status(409).json({ error: 'Duplicate tracking_number' });

    const created = await Shipment.create({
      ...payload,
      created_by: req.user?.id || null,
    });
    res.status(201).json({ shipment: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create shipment' });
  }
}

export async function listShipments(req, res) {
  const { tracking_number, status, from, to, page = '1', limit = '20' } = req.query;

  const where = {};
  if (tracking_number) where.tracking_number = tracking_number;
  if (status) where.status = status;
  if (from || to) {
    where.shipment_date = {};
    if (from) where.shipment_date[Op.gte] = from;
    if (to) where.shipment_date[Op.lte] = to;
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  try {
    const { rows, count } = await Shipment.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset,
      limit: limitNum,
    });
    res.json({ items: rows, total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list shipments' });
  }
}

export async function getShipment(req, res) {
  const { id } = req.params;
  const shipment = await Shipment.findByPk(id);
  if (!shipment) return res.status(404).json({ error: 'Not found' });
  res.json({ shipment });
}

export async function updateShipment(req, res) {
  const { id } = req.params;
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });

  const shipment = await Shipment.findByPk(id);
  if (!shipment) return res.status(404).json({ error: 'Not found' });

  try {
    await shipment.update(parse.data);
    res.json({ shipment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update shipment' });
  }
}
