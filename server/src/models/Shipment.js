import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/sequelize.js';

export class Shipment extends Model {}

Shipment.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tracking_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    sender_name: { type: DataTypes.STRING(100), allowNull: false },
    receiver_name: { type: DataTypes.STRING(100), allowNull: false },
    destination: { type: DataTypes.STRING(255), allowNull: false },
    shipment_date: { type: DataTypes.DATEONLY, allowNull: false },
    delivery_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Pending' },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'shipments', timestamps: true, createdAt: 'created_at', updatedAt: false }
);
