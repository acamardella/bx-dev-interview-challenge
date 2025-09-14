import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { S3Client, ListPartsCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { FileController } from './file.controller';
import { FileService } from '../services/file/file.service';



describe('FileController - error cases', () => {
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
    s3Mock.reset();  // resettare il mock dopo ogni test
  });

  afterAll(async () => {
    await app.close();
  });


  // --- Test: token scaduto ---
  it('POST /files/init → should reject if token is expired', async () => {
    // Creiamo un token con durata molto corta, poi attendiamo per farlo scadere
    const token = await jwtService.signAsync({ email: 'test@example.com' }, { secret: process.env.JWT_SECRET || 'secret_key', expiresIn: '1s' });

    // Aspettiamo 2 secondi perché il token scada
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const res = await request(app.getHttpServer())
      .post('/files/init')
      .set('Authorization', `Bearer ${token}`)
      .send({ fileName: 'video.mp4', contentType: 'video/mp4' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Token non valido o scaduto/i);
  });

  // --- Test: S3 non raggiungibile → errore in Listing parti ---
  it('POST /files/complete → should return 503 ServiceUnavailableException if S3 ListPartsCommand fails', async () => {

    s3Mock.on(ListPartsCommand).rejects(new ServiceUnavailableException('Errore completamento caricamento S3'));

    // anche mock CompleteMultipartUploadCommand, ma non verrà chiamato (fallisce prima)
    s3Mock.on(CompleteMultipartUploadCommand).resolves({
      Location: 'https://fake-s3/.../video.mp4',
      Bucket: 'my-bucket',
      Key: 'video.mp4',
      ETag: '"etag123"',
    });


    const res = await request(app.getHttpServer())
      .post('/files/complete')
      .send({ key: 'video.mp4', uploadId: 'mock-upload-id' });

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Errore completamento caricamento S3/);
  });

  // --- Test: S3 non raggiungibile durante il completamento ---
  it('POST /files/complete → should return 503 ServiceUnavailableException if CompleteMultipartUploadCommand fails', async () => {

    s3Mock.on(ListPartsCommand).resolves({
      Parts: [
        { ETag: '"etag123"', PartNumber: 1 },
      ],
    });

    s3Mock.on(CompleteMultipartUploadCommand).rejects(new ServiceUnavailableException('Errore completamento caricamento S3'));
    const res = await request(app.getHttpServer())
      .post('/files/complete')
      .send({ key: 'video.mp4', uploadId: 'mock-upload-id' });

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Errore completamento caricamento S3/);
  });
});
