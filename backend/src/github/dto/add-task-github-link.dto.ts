import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, MaxLength } from 'class-validator';

export class AddTaskGitHubLinkDto {
  @ApiProperty({ maxLength: 512 })
  @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(512)
  url!: string;
}
