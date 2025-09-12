import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import getCommonConfig from './configs/common';

import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_key',
      signOptions: { expiresIn: '1h' },
    }),
    ConfigModule.forRoot({ isGlobal: true, load: [getCommonConfig] }),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
