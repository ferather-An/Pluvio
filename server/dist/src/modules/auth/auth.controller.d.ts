import { AuthService } from "./auth.service";
declare class LoginDto {
    email: string;
    password: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        role: string;
        email: string;
    }>;
}
export {};
