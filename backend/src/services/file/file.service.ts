import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  S3Client,
  ListPartsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Request } from 'express';

import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileService {
  private readonly s3: S3Client;
  constructor(private readonly jwtService: JwtService) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  validateToken(req: Request) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('Token mancante');

    const token = authHeader.split(' ')[1] || '';
    console.log('Validating token:', token);
    try {
      this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'secret_key',
      });
    } catch {
      throw new UnauthorizedException('Token non valido o scaduto');
    }
  }

  async createMultipartUpload(fileName: string, contentType: string) {
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileName,
      ContentType: contentType,
    });

    const response = await this.s3.send(command);
    return { uploadId: response.UploadId, key: response.Key };
  }

  async getPresignedPartUrl(key: string, uploadId: string, partNumber: number) {
    const command = new UploadPartCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    const signUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return signUrl;
  }

  async completeMultipartUpload(key: string, uploadId: string) {
    // Recupera parti caricate da S3
    const listed = await this.s3.send(
      new ListPartsCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        UploadId: uploadId,
      }),
    );

    const parts = (listed.Parts || []).map((p) => ({
      ETag: p.ETag,
      PartNumber: p.PartNumber!,
    }));

    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });

    return this.s3.send(command);
  }

  async getDownloadUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });
    const signUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    console.log('Generated presigned URL DOWNLOAD:', signUrl);
    return signUrl;
  }

  async getFileMeta(key: string) {
    const head = await this.s3.send(
      new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
      }),
    );

    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key }),
      { expiresIn: 3600 },
    );

    return {
      key,
      size: head.ContentLength,
      lastModified: head.LastModified,
      url,
    };
  }

  async listFiles() {
    const bucket = process.env.S3_BUCKET_NAME!;
    const command = new ListObjectsV2Command({
      Bucket: bucket,
    });

    const res = await this.s3.send(command);
    const contents = res.Contents || [];

    // Genera un presigned URL per ogni file
    const files = await Promise.all(
      contents.map(async (item) => {
        const getCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: item.Key!,
        });

        const url = await getSignedUrl(this.s3, getCommand, {
          expiresIn: 3600,
        });

        return {
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          url,
        };
      }),
    );
    console.log('List of files with presigned URLs:', files);
    return files;
  }
}
