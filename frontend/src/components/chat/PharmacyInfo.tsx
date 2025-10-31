import React from 'react';
import { Pharmacy } from '../../types';
import './PharmacyInfo.css';

interface PharmacyInfoProps {
  pharmacy: Pharmacy | null;
}

export const PharmacyInfo: React.FC<PharmacyInfoProps> = ({ pharmacy }) => {
  if (!pharmacy) {
    return (
      <div className="pharmacy-info empty">
        <h3>New Lead</h3>
        <p>Collecting pharmacy information...</p>
      </div>
    );
  }

  const formatRxVolume = (volume: number) => {
    return volume.toLocaleString();
  };

  const getVolumeTier = (volume: number) => {
    if (volume >= 10000) return { tier: 'High Volume', color: '#28a745' };
    if (volume >= 5000) return { tier: 'Medium Volume', color: '#ffc107' };
    if (volume >= 1000) return { tier: 'Low Volume', color: '#17a2b8' };
    return { tier: 'Unknown', color: '#6c757d' };
  };

  const volumeInfo = getVolumeTier(pharmacy.rxVolume);

  return (
    <div className="pharmacy-info">
      <h3>Pharmacy Information</h3>

      <div className="info-section">
        <div className="info-label">Name</div>
        <div className="info-value">{pharmacy.name}</div>
      </div>

      {pharmacy.contactPerson && (
        <div className="info-section">
          <div className="info-label">Contact Person</div>
          <div className="info-value">{pharmacy.contactPerson}</div>
        </div>
      )}

      {pharmacy.address && (
        <div className="info-section">
          <div className="info-label">Address</div>
          <div className="info-value">
            {pharmacy.address}
            {pharmacy.city && pharmacy.state && (
              <>
                <br />
                {pharmacy.city}, {pharmacy.state}
              </>
            )}
          </div>
        </div>
      )}

      <div className="info-section">
        <div className="info-label">Phone</div>
        <div className="info-value">{pharmacy.phone}</div>
      </div>

      {pharmacy.email && (
        <div className="info-section">
          <div className="info-label">Email</div>
          <div className="info-value">{pharmacy.email}</div>
        </div>
      )}

      <div className="info-section">
        <div className="info-label">Monthly Rx Volume</div>
        <div className="info-value">
          ~{formatRxVolume(pharmacy.rxVolume)} prescriptions
          <span className="volume-badge" style={{ background: volumeInfo.color }}>
            {volumeInfo.tier}
          </span>
        </div>
      </div>
    </div>
  );
};
