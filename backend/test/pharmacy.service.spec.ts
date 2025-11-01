import { Test, TestingModule } from '@nestjs/testing';
import { PharmacyService } from '../src/modules/pharmacy/pharmacy.service';

describe('PharmacyService', () => {
  let service: PharmacyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PharmacyService],
    }).compile();

    service = module.get<PharmacyService>(PharmacyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizePhone', () => {
    it('should remove all non-digit characters', () => {
      expect(service.normalizePhone('+1-555-123-4567')).toBe('15551234567');
      expect(service.normalizePhone('(555) 123-4567')).toBe('5551234567');
      expect(service.normalizePhone('555.123.4567')).toBe('5551234567');
    });

    it('should handle phone numbers with spaces', () => {
      expect(service.normalizePhone('+1 555 123 4567')).toBe('15551234567');
    });

    it('should handle already normalized numbers', () => {
      expect(service.normalizePhone('5551234567')).toBe('5551234567');
    });
  });

  describe('calculateRxVolume', () => {
    it('should calculate monthly volume from daily prescriptions', () => {
      const prescriptions = [
        { drug: 'Drug A', count: 10 },
        { drug: 'Drug B', count: 20 },
      ];
      const volume = service.calculateRxVolume(prescriptions);
      expect(volume).toBe(900); // (10 + 20) * 30
    });

    it('should return 0 for empty prescriptions', () => {
      expect(service.calculateRxVolume([])).toBe(0);
      expect(service.calculateRxVolume(undefined)).toBe(0);
    });

    it('should handle prescriptions with missing counts', () => {
      const prescriptions = [
        { drug: 'Drug A', count: 10 },
        { drug: 'Drug B', count: 0 },
      ];
      const volume = service.calculateRxVolume(prescriptions);
      expect(volume).toBe(300); // (10 + 0) * 30
    });
  });
});
