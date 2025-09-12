import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { FileModule } from './file.module';

@Module({
  imports: [AuthModule, FileModule],
})
export class AppModule {}
