import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User, UserRepository } from '../ports/user.repository.js';

@Injectable()
export class InMemoryUserRepository extends UserRepository implements OnModuleInit {
  private readonly users = new Map<string, User>();

  async onModuleInit(): Promise<void> {
    const passwordHash = await bcrypt.hash('admin123456', 12);
    this.users.set('1', {
      id: '1',
      email: 'admin@invoice-processor.com',
      passwordHash,
    });
  }

  findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return Promise.resolve(user);
    }
    return Promise.resolve(null);
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }
}
