import { Module } from '@nestjs/common';

import { FileController } from './controllers/file.controller';
import { FileService } from './services/file/file.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [FileController],
})
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
