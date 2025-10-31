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

  describe('getRxVolumeTier', () => {
    it('should return HIGH for volume >= 10000', () => {
      expect(service.getRxVolumeTier(10000)).toBe('HIGH');
      expect(service.getRxVolumeTier(15000)).toBe('HIGH');
    });

    it('should return MEDIUM for volume >= 5000 and < 10000', () => {
      expect(service.getRxVolumeTier(5000)).toBe('MEDIUM');
      expect(service.getRxVolumeTier(7500)).toBe('MEDIUM');
      expect(service.getRxVolumeTier(9999)).toBe('MEDIUM');
    });

    it('should return LOW for volume >= 1000 and < 5000', () => {
      expect(service.getRxVolumeTier(1000)).toBe('LOW');
      expect(service.getRxVolumeTier(2500)).toBe('LOW');
      expect(service.getRxVolumeTier(4999)).toBe('LOW');
    });

    it('should return UNKNOWN for volume < 1000', () => {
      expect(service.getRxVolumeTier(0)).toBe('UNKNOWN');
      expect(service.getRxVolumeTier(500)).toBe('UNKNOWN');
      expect(service.getRxVolumeTier(999)).toBe('UNKNOWN');
    });
  });

  describe('getVolumeMessage', () => {
    it('should return appropriate message for each tier', () => {
      const highMessage = service.getVolumeMessage('HIGH' as any);
      expect(highMessage).toContain('high prescription volume');

      const mediumMessage = service.getVolumeMessage('MEDIUM' as any);
      expect(mediumMessage).toContain('excellent position');

      const lowMessage = service.getVolumeMessage('LOW' as any);
      expect(lowMessage).toContain('streamline');

      const unknownMessage = service.getVolumeMessage('UNKNOWN' as any);
      expect(unknownMessage).toContain('pharmacies of all sizes');
    });
  });
});
