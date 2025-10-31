import { Injectable, Logger } from '@nestjs/common';
import { Pharmacy } from '../pharmacy/pharmacy.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendFollowupEmail(
    email: string,
    pharmacy: Pharmacy | null,
    includePricing: boolean = false,
  ): Promise<boolean> {
    this.logger.log(`[MOCK] Sending follow-up email to: ${email}`);

    const emailContent = this.buildEmailContent(pharmacy, includePricing);

    // In production, this would integrate with SendGrid, AWS SES, etc.
    this.logger.log(`Email Content:\n${emailContent}`);
    this.logger.log(`✓ Email successfully queued for delivery`);

    return true;
  }

  private buildEmailContent(pharmacy: Pharmacy | null, includePricing: boolean): string {
    let content = `Subject: Pharmesol Solutions for ${pharmacy?.name || 'Your Pharmacy'}\n\n`;
    content += `Dear ${pharmacy?.contactPerson || 'Pharmacy Manager'},\n\n`;
    content += `Thank you for your interest in Pharmesol's pharmacy management solutions.\n\n`;

    if (pharmacy && pharmacy.rxVolume > 0) {
      const tier = this.getVolumeTier(pharmacy.rxVolume);
      content += `Based on your monthly prescription volume of approximately ${pharmacy.rxVolume.toLocaleString()} prescriptions, `;
      content += `${this.getVolumeSpecificMessage(tier)}\n\n`;
    }

    content += `Our Comprehensive Solutions Include:\n`;
    content += `• Automated Dispensing Systems - Reduce errors and increase efficiency\n`;
    content += `• Inventory Management - Real-time tracking and automated reordering\n`;
    content += `• Prescription Workflow Automation - Streamline your daily operations\n`;
    content += `• Compliance & Regulatory Support - Stay current with all requirements\n`;
    content += `• Analytics & Reporting - Make data-driven decisions\n\n`;

    if (includePricing) {
      content += `Pricing Information:\n`;
      content += `Our solutions are tailored to your pharmacy's specific needs. `;
      content += `We offer flexible pricing models based on volume and features. `;
      content += `Contact us for a personalized quote.\n\n`;
    }

    content += `Next Steps:\n`;
    content += `Schedule a demo: https://pharmesol.example.com/demo\n`;
    content += `Call us: 1-800-PHARMA-1\n`;
    content += `Reply to this email with any questions\n\n`;
    content += `Best regards,\n`;
    content += `The Pharmesol Team\n`;

    return content;
  }

  private getVolumeTier(rxVolume: number): string {
    if (rxVolume >= 10000) return 'HIGH';
    if (rxVolume >= 5000) return 'MEDIUM';
    if (rxVolume >= 1000) return 'LOW';
    return 'UNKNOWN';
  }

  private getVolumeSpecificMessage(tier: string): string {
    switch (tier) {
      case 'HIGH':
        return 'our enterprise-level solutions are designed to handle high-volume operations with maximum efficiency.';
      case 'MEDIUM':
        return 'our mid-tier solutions offer the perfect balance of automation and flexibility for growing pharmacies.';
      case 'LOW':
        return 'our scalable solutions will grow with your pharmacy as your volume increases.';
      default:
        return 'we have solutions tailored to pharmacies of all sizes.';
    }
  }
}
