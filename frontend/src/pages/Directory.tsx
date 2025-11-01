import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { ArrowUpDown, Search, Phone } from 'lucide-react';

interface Prescription {
  drug: string;
  count: number;
}

interface Pharmacy {
  id: string | number;
  name: string;
  phone: string;
  email: string | null;
  city?: string;
  state?: string;
  address?: string;
  contactPerson?: string;
  rxVolume?: number;
  prescriptions?: Prescription[];
  avg_monthly_prescriptions?: any[];
}

type SortField = 'name' | 'phone' | 'email' | 'city' | 'state' | 'rxVolume';
type SortDirection = 'asc' | 'desc';

export const Directory: React.FC = () => {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'https://67e14fb758cc6bf785254550.mockapi.io/pharmacies'
      );
      setPharmacies(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load pharmacies');
      console.error('Error fetching pharmacies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getTotalPrescriptions = (pharmacy: Pharmacy): number => {
    if (pharmacy.rxVolume) return pharmacy.rxVolume;
    if (pharmacy.prescriptions && pharmacy.prescriptions.length > 0) {
      return pharmacy.prescriptions.reduce((sum, rx) => sum + rx.count, 0);
    }
    return 0;
  };

  const handleSimulateCall = (phoneNumber: string) => {
    navigate(`/chat?phone=${encodeURIComponent(phoneNumber)}`);
  };

  const filteredAndSortedPharmacies = useMemo(() => {
    let filtered = pharmacies.filter((pharmacy) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        pharmacy.name?.toLowerCase().includes(searchLower) ||
        pharmacy.phone?.toLowerCase().includes(searchLower) ||
        pharmacy.email?.toLowerCase().includes(searchLower) ||
        pharmacy.city?.toLowerCase().includes(searchLower) ||
        pharmacy.state?.toLowerCase().includes(searchLower) ||
        pharmacy.contactPerson?.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'rxVolume') {
        aVal = getTotalPrescriptions(a);
        bVal = getTotalPrescriptions(b);
      }

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [pharmacies, searchTerm, sortField, sortDirection]);

  const SortableHeader: React.FC<{
    field: SortField;
    label: string;
  }> = ({ field, label }) => (
    <TableHead
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-lg">Loading pharmacies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pharmacy Directory
        </h1>
        <p className="text-gray-600">
          Browse and search our pharmacy database
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search pharmacies by name, phone, email, city, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Showing {filteredAndSortedPharmacies.length} of {pharmacies.length}{' '}
          pharmacies
        </p>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="name" label="Name" />
              <SortableHeader field="phone" label="Phone" />
              <SortableHeader field="email" label="Email" />
              <SortableHeader field="city" label="City" />
              <SortableHeader field="state" label="State" />
              <TableHead>Contact Person</TableHead>
              <TableHead>Address</TableHead>
              <SortableHeader field="rxVolume" label="Rx Volume" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedPharmacies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No pharmacies found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedPharmacies.map((pharmacy) => (
                <TableRow key={pharmacy.id}>
                  <TableCell className="font-medium">{pharmacy.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{pharmacy.phone}</TableCell>
                  <TableCell>{pharmacy.email || 'N/A'}</TableCell>
                  <TableCell>{pharmacy.city || 'N/A'}</TableCell>
                  <TableCell>{pharmacy.state || 'N/A'}</TableCell>
                  <TableCell>{pharmacy.contactPerson || 'N/A'}</TableCell>
                  <TableCell>{pharmacy.address || 'N/A'}</TableCell>
                  <TableCell>
                    {getTotalPrescriptions(pharmacy) || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => handleSimulateCall(pharmacy.phone)}
                      className="bg-[#fb923c] hover:bg-[#f97316] text-white"
                      size="sm"
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Simulate Call
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
