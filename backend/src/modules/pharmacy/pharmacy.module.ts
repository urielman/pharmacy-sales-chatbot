import { Module } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';

@Module({
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
