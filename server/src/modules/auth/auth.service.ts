import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

type AdminUser = { id: string; email: string; passwordHash: string; role: string };

@Injectable()
export class AuthService {
  private readonly users: AdminUser[] = [
    {
      id: "admin-1",
      email: "admin@pluvio.br",
      // bcrypt hash of "pluvio2026"
      passwordHash: "$2b$10$XKfznY8JnlDLWNsD3r5X6OZmJXEcb7EEAJPdmEXkS3a/Z3bvFMpNK",
      role: "ADMIN",
    },
  ];

  constructor(private readonly jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<AdminUser> {
    const user = this.users.find((u) => u.email === email);
    if (!user) throw new UnauthorizedException("Credenciais inválidas");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Credenciais inválidas");

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      email: user.email,
    };
  }

  validateJwtPayload(payload: { sub: string; email: string; role: string }) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
