import React from 'react';
import { Pharmacy, PharmacyLead } from '../../types';
import './PharmacyInfo.css';

interface PharmacyInfoProps {
  pharmacy: Pharmacy | null;
  lead?: PharmacyLead | null;
}

export const PharmacyInfo: React.FC<PharmacyInfoProps> = ({ pharmacy, lead }) => {
  // For new leads, display collected information
  if (!pharmacy && lead) {
    const getVolumeTier = (volume?: number) => {
      if (!volume) return { tier: 'Unknown', color: '#6c757d' };
      if (volume >= 10000) return { tier: 'High Volume', color: '#28a745' };
      if (volume >= 5000) return { tier: 'Medium Volume', color: '#ffc107' };
      if (volume >= 1000) return { tier: 'Low Volume', color: '#17a2b8' };
      return { tier: 'Unknown', color: '#6c757d' };
    };

    const volumeInfo = getVolumeTier(lead.estimatedRxVolume);

    return (
      <div className="pharmacy-info">
        <h3>New Lead</h3>
        <p style={{ marginBottom: '12px', color: '#666' }}>Collecting pharmacy information...</p>

        <div className="info-section">
          <div className="info-label">Name</div>
          <div className="info-value">{lead.pharmacyName || 'Unknown'}</div>
        </div>

        <div className="info-section">
          <div className="info-label">Contact Person</div>
          <div className="info-value">{lead.contactPerson || 'Unknown'}</div>
        </div>

        {(lead.address || lead.city || lead.state) && (
          <div className="info-section">
            <div className="info-label">Address</div>
            <div className="info-value">
              {lead.address || 'Unknown'}
              {lead.city && lead.state && (
                <>
                  <br />
                  {lead.city}, {lead.state}
                </>
              )}
            </div>
          </div>
        )}

        <div className="info-section">
          <div className="info-label">Phone</div>
          <div className="info-value">{lead.phoneNumber}</div>
        </div>

        {lead.email && (
          <div className="info-section">
            <div className="info-label">Email</div>
            <div className="info-value">{lead.email}</div>
          </div>
        )}

        <div className="info-section">
          <div className="info-label">Monthly Rx Volume</div>
          <div className="info-value">
            {lead.estimatedRxVolume ? `~${lead.estimatedRxVolume.toLocaleString()} prescriptions` : 'Unknown'}
            <span className="volume-badge" style={{ background: volumeInfo.color }}>
              {volumeInfo.tier}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // For new leads with no data collected yet
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
