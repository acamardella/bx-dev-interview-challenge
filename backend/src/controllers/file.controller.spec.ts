import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { S3Client, CreateMultipartUploadCommand, ListPartsCommand, CompleteMultipartUploadCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { FileController } from './file.controller';
import { FileService } from '../services/file/file.service';


describe('FileController + FileService (multipart upload + list)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const s3Mock = mockClient(S3Client);

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [FileService, JwtService, { provide: S3Client, useValue: new S3Client({}) }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    jwtService = moduleRef.get(JwtService);
  });

  afterEach(() => {
    s3Mock.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  const getValidToken = async () =>
    jwtService.signAsync({ email: 'test@example.com' }, { secret: 'secret_key' });

  // -----------------------------------
  it('POST /files/init → should start multipart upload', async () => {
    s3Mock.on(CreateMultipartUploadCommand).resolves({
      UploadId: 'mock-upload-id',
      Key: 'video.mp4',
    });

    const token = await getValidToken();

    const res = await request(app.getHttpServer())
      .post('/files/init')
      .set('Authorization', `Bearer ${token}`)
      .send({ fileName: 'video.mp4', contentType: 'video/mp4' })
      .expect(201);

    expect(res.body).toEqual({
      uploadId: 'mock-upload-id',
      key: 'video.mp4',
    });
  });

  // -----------------------------------
  it('GET /files/url → should return presigned URL for part upload', async () => {
    // Non serve mockare UploadPartCommand, presigned URL viene generato localmente

    const res = await request(app.getHttpServer())
      .get('/files/url?key=video.mp4&uploadId=mock-upload-id&partNumber=1')
      .expect(200);

    expect(res.text).toContain('https://'); // presigned URL simulata
    expect(res.text).toContain('partNumber=1');
  });

  // -----------------------------------
  it('POST /files/complete → should complete multipart upload', async () => {

    s3Mock.on(ListPartsCommand).resolves({
        Parts: [
        { ETag: '"etag12345"', PartNumber: 1 }
        ],
    });

     // Mock della risposta di CompleteMultipartUploadCommand
    s3Mock.on(CompleteMultipartUploadCommand).resolves({
        Location: 'https://fake-s3/my-bucket/video.mp4',
        Bucket: 'my-bucket',
        Key: 'video.mp4',
        ETag: '"etag12345"',
    });

    const res = await request(app.getHttpServer())
        .post('/files/complete')
        .send({
        key: 'video.mp4',
        uploadId: 'mock-upload-id',
        })
        .expect(201);

    expect(res.body).toEqual({
        Location: 'https://fake-s3/my-bucket/video.mp4',
        Bucket: 'my-bucket',
        Key: 'video.mp4',
        ETag: '"etag12345"',
    });


  });

  // -----------------------------------
  it('GET /files/list → should return list of files with presigned URLs', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [{ Key: 'video.mp4' }],
    });

    const res = await request(app.getHttpServer())
      .get('/files/list')
      .expect(200);

    expect(res.body[0].key).toBe('video.mp4');
    expect(res.body[0].url).toContain('https://');
  });
});