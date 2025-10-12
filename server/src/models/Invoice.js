import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/sequelize.js';

export class Invoice extends Model {}

Invoice.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoice_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    shipment_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    payment_status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Unpaid' },
    issued_date: { type: DataTypes.DATEONLY, allowNull: false },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'invoices', timestamps: true, createdAt: 'created_at', updatedAt: false }
);
