import { User as UserModel } from '../database/models/user.model.js';
import { User } from '../../domain/entities/user.entity.js';

export class UserRepository {
  async create(userData) {
    const user = await UserModel.create(userData);
    return new User(user.toJSON());
  }

  async findByEmail(email) {
    const user = await UserModel.findOne({ where: { email } });
    return user ? new User(user.toJSON()) : null;
  }

  async findById(id) {
    const user = await UserModel.findByPk(id);
    return user ? new User(user.toJSON()) : null;
  }
}