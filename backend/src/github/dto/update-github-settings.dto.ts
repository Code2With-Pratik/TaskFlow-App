import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateGitHubSettingsDto {
  @ApiProperty()
  @IsBoolean()
  autoCompleteOnMerge!: boolean;
}
