import { Controller, Post, Req } from '@nestjs/common';
import { FileService } from '../services/file/file.service';
import { Get, Body, Query } from '@nestjs/common';
import { Request } from 'express';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('init')
  async initUpload(
    @Body() body: { fileName: string; contentType: string },
    @Req() req: Request,
  ) {
    this.fileService.validateToken(req);

    return this.fileService.createMultipartUpload(
      body.fileName,
      body.contentType,
    );
  }

  @Get('url')
  async getUploadUrl(
    @Query('key') key: string,
    @Query('uploadId') uploadId: string,
    @Query('partNumber') partNumber: string,
  ) {
    return this.fileService.getPresignedPartUrl(
      key,
      uploadId,
      Number(partNumber),
    );
  }

  @Post('complete')
  async completeUpload(
    @Body()
    body: {
      key: string;
      uploadId: string;
      parts: { ETag: string; PartNumber: number }[];
    },
  ) {
    return this.fileService.completeMultipartUpload(body.key, body.uploadId);
  }

  @Get('download')
  async getDownloadUrl(@Query('key') key: string) {
    return this.fileService.getDownloadUrl(key);
  }

  @Get('meta')
  async getMeta(@Query('key') key: string) {
    return this.fileService.getFileMeta(key);
  }

  @Get('list')
  async listFiles() {
    return this.fileService.listFiles();
  }
}
