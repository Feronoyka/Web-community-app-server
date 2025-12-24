import { PartialType } from '@nestjs/mapped-types';
import { CreateCommunityDto } from './create-community.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdateCommunityDto extends PartialType(CreateCommunityDto) {}
