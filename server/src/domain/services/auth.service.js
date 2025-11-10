import bcrypt from 'bcrypt';
import { signJwt } from '../../core/utils/jwt.js';
import { UserSchema } from '../entities/user.entity.js';

export class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register(userData) {
    const { password, ...rest } = UserSchema.parse(userData);
    
    const exists = await this.userRepository.findByEmail(rest.email);
    if (exists) {
      throw new Error('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create({ ...rest, password: passwordHash });
    
    return {
      user: user.toJSON(),
      token: this._generateToken(user)
    };
  }

  async login(credentials) {
    const { email, password } = credentials;
    
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return {
      user: user.toJSON(),
      token: this._generateToken(user)
    };
  }

  _generateToken(user) {
    return signJwt({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
  }
}