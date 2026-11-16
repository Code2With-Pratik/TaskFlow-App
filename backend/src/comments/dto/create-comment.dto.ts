import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

const MAX_IMAGE_BYTES = 1_048_576;
const MAX_IMAGE_DATA_LENGTH = 1_398_200;
const IMAGE_DATA_URL_PATTERN =
  /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

@ValidatorConstraint({ name: 'isSafeImageDataUrl', async: false })
class IsSafeImageDataUrl implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const match = IMAGE_DATA_URL_PATTERN.exec(value);
    if (!match) return false;

    const [, type, encoded] = match;
    if (encoded.length % 4 !== 0) return false;
    const bytes = Buffer.from(encoded, 'base64');
    if (
      bytes.length === 0 ||
      bytes.length > MAX_IMAGE_BYTES ||
      bytes.toString('base64') !== encoded
    ) {
      return false;
    }

    if (type === 'png') {
      return bytes.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
    }
    if (type === 'jpeg') {
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    }
    return (
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'
    );
  }

  defaultMessage(): string {
    return 'imageData must be a valid PNG, JPEG, or WebP data URL no larger than 1 MiB';
  }
}

export class CreateCommentDto {
  @ApiProperty({ minLength: 1, maxLength: 5000 })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({
    maxLength: MAX_IMAGE_DATA_LENGTH,
    description: 'Optional PNG, JPEG, or WebP image data URL (up to 1 MiB).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_IMAGE_DATA_LENGTH)
  @Validate(IsSafeImageDataUrl)
  imageData?: string | null;
}
