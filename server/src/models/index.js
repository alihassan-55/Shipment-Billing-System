import { sequelize } from '../db/sequelize.js';
import { User } from './User.js';
import { Shipment } from './Shipment.js';
import { Invoice } from './Invoice.js';

// Associations (basic)
Invoice.belongsTo(Shipment, { foreignKey: 'shipment_id' });
Shipment.hasMany(Invoice, { foreignKey: 'shipment_id' });

export async function syncModels() {
  await sequelize.sync();
}

export { sequelize, User, Shipment, Invoice };
