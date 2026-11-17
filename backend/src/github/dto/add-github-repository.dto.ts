import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AddGitHubRepositoryDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fullName!: string;
}
