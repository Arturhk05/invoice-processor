export interface User {
  id: string;
  email: string;
  passwordHash: string;
}

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}
