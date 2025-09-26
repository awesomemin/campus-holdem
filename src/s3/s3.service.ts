import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import sharp from 'sharp';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client | null = null;
  private bucketName: string | null = null;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';

    if (accessKeyId && secretAccessKey && bucketName) {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.bucketName = bucketName;
      this.logger.log('S3 Service initialized successfully');
    } else {
      this.logger.warn(
        'S3 Service not initialized: Missing AWS credentials or bucket name',
      );
    }
  }

  private async processImage(
    file: Express.Multer.File,
    maxSizeInBytes: number = 5 * 1024 * 1024, // 5MB default
    maxWidth: number = 1920,
    maxHeight: number = 1920,
  ): Promise<Buffer> {
    let processedBuffer = file.buffer;

    // Check if the file needs processing
    if (file.buffer.length > maxSizeInBytes) {
      this.logger.log(
        `Image size (${(file.buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds limit. Resizing...`,
      );

      try {
        // Resize the image while maintaining aspect ratio
        processedBuffer = await sharp(file.buffer)
          .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 85, // Adjust quality to reduce file size
            progressive: true,
          })
          .toBuffer();

        this.logger.log(
          `Image resized successfully to ${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB`,
        );
      } catch (error) {
        this.logger.error(`Failed to resize image: ${error}`);
        // If resizing fails, use the original buffer
        processedBuffer = file.buffer;
      }
    }

    return processedBuffer;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'profile-images',
  ): Promise<string> {
    if (!this.s3Client || !this.bucketName) {
      this.logger.error('S3 Service not configured. Cannot upload file.');
      throw new Error('S3 Service is not configured');
    }

    // Process the image to ensure it's under 5MB
    const processedBuffer = await this.processImage(file);

    // Determine file extension - use .jpg for processed images
    const originalExtension = file.originalname.split('.').pop()?.toLowerCase();
    const fileExtension =
      file.buffer.length > 5 * 1024 * 1024 ? 'jpg' : originalExtension;
    const fileName = `${folder}/${crypto.randomUUID()}.${fileExtension}`;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: processedBuffer,
      ContentType:
        file.buffer.length > 5 * 1024 * 1024 ? 'image/jpeg' : file.mimetype,
    };

    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      const region =
        this.configService.get<string>('AWS_REGION') || 'us-east-1';
      const fileUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileName}`;
      this.logger.log(`File uploaded successfully: ${fileName}`);
      return fileUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error}`);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.s3Client || !this.bucketName) {
      this.logger.warn('S3 Service not configured. Cannot delete file.');
      return;
    }

    try {
      const key = this.extractKeyFromUrl(fileUrl);
      if (!key) return;

      const deleteParams = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${error}`);
    }
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      // Handle both regional and non-regional S3 URL formats
      const s3Pattern = /\.s3[.-]([a-z0-9-]+)?\.?amazonaws\.com\//;
      const match = url.match(s3Pattern);
      if (match) {
        const parts = url.split(match[0]);
        if (parts.length === 2) {
          return parts[1];
        }
      }
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }
}
