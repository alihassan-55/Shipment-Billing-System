import { Sequelize } from 'sequelize';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://cms:cms@localhost:5432/cms';

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
});

export async function assertDatabaseConnection() {
  await sequelize.authenticate();
}
