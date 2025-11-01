import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Pharmacy, PharmacyApiResponse } from './pharmacy.interface';

interface CacheEntry {
  data: Pharmacy;
  expiresAt: Date;
}

@Injectable()
export class PharmacyService {
  private readonly logger = new Logger(PharmacyService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clear expired cache entries every minute
    setInterval(() => this.clearExpiredCache(), 60 * 1000);
  }

  async findByPhone(phoneNumber: string): Promise<Pharmacy | null> {
    const normalized = this.normalizePhone(phoneNumber);

    // Check cache first
    const cached = this.cache.get(normalized);
    if (cached && cached.expiresAt > new Date()) {
      this.logger.log(`Cache hit for phone: ${this.maskPhone(normalized)}`);
      return cached.data;
    }

    try {
      const apiUrl = process.env.PHARMACY_API_URL;
      const response = await axios.get<PharmacyApiResponse[]>(apiUrl);

      const pharmacy = response.data.find(
        (p) => this.normalizePhone(p.phone) === normalized
      );

      if (pharmacy) {
        const transformedPharmacy = this.transformApiResponse(pharmacy);

        // Cache the result
        this.cache.set(normalized, {
          data: transformedPharmacy,
          expiresAt: new Date(Date.now() + this.CACHE_TTL),
        });

        this.logger.log(`Found pharmacy: ${pharmacy.name}`);
        return transformedPharmacy;
      }

      this.logger.log(`No pharmacy found for phone: ${this.maskPhone(normalized)}`);
      return null;
    } catch (error) {
      this.logger.error(`Error fetching pharmacy data: ${error.message}`);
      throw error;
    }
  }

  async getAllPharmacies(): Promise<Pharmacy[]> {
    try {
      const apiUrl = process.env.PHARMACY_API_URL;
      const response = await axios.get<PharmacyApiResponse[]>(apiUrl);

      return response.data.map((p) => this.transformApiResponse(p));
    } catch (error) {
      this.logger.error(`Error fetching all pharmacies: ${error.message}`);
      throw error;
    }
  }

  normalizePhone(phone: string): string {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  }

  calculateRxVolume(prescriptions?: Array<{ drug: string; count: number }>): number {
    if (!prescriptions || prescriptions.length === 0) {
      return 0;
    }

    const dailyTotal = prescriptions.reduce((sum, p) => sum + (p.count || 0), 0);
    return dailyTotal * 30; // Monthly estimate
  }


  private transformApiResponse(apiResponse: PharmacyApiResponse): Pharmacy {
    const rxVolume = this.calculateRxVolume(apiResponse.prescriptions);

    return {
      id: apiResponse.id,
      name: apiResponse.name,
      phone: apiResponse.phone,
      address: apiResponse.address,
      city: apiResponse.city,
      state: apiResponse.state,
      rxVolume,
      contactPerson: apiResponse.contactPerson,
      email: apiResponse.email || null,
      lastContact: apiResponse.lastContact,
      prescriptions: apiResponse.prescriptions,
    };
  }

  private maskPhone(phone: string): string {
    if (phone.length < 4) return '***';
    return `***-${phone.slice(-4)}`;
  }

  private clearExpiredCache(): void {
    const now = new Date();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.logger.log(`Cleared ${cleared} expired cache entries`);
    }
  }
}
