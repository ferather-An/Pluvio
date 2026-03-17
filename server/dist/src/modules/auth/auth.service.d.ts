import { JwtService } from "@nestjs/jwt";
type AdminUser = {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
};
export declare class AuthService {
    private readonly jwtService;
    private readonly users;
    constructor(jwtService: JwtService);
    validateUser(email: string, password: string): Promise<AdminUser>;
    login(email: string, password: string): Promise<{
        access_token: string;
        role: string;
        email: string;
    }>;
    validateJwtPayload(payload: {
        sub: string;
        email: string;
        role: string;
    }): {
        userId: string;
        email: string;
        role: string;
    };
}
export {};
