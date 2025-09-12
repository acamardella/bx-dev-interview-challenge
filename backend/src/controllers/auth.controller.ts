import { Controller } from '@nestjs/common';
import { Post, Body } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    console.log(email, password);

    const payload = { email };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'secret_key',
      expiresIn: '1h',
    });

    return { token };
  }
}
