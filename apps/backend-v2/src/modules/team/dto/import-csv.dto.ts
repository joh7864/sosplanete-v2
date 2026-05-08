import { IsString } from 'class-validator';

export class ImportCsvDto {
  @IsString()
  csvContent: string;
}
