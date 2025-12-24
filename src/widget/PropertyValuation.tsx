import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Home, DollarSign, MapPin, Search, TrendingUp } from 'lucide-react';
import { FloatingInput } from '../ui/floating-input';
import { FloatingSelect, FloatingSelectItem } from '../ui/floating-select';
import { PageHeader } from './PageHeader';

type ValuationType = 'sale' | 'rent';
type AppState = 'search' | 'results';

interface PropertySearchData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
}

interface RentcastComparable {
  id: string;
  address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  distance: number;
  price: number;
  pricePerSquareFoot: number;
  lastSaleDate: string;
}

interface RentcastRentalComparable {
  id: string;
  address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  distance: number;
  monthlyRent: number;
  rentPerSquareFoot: number;
  listedDate: string;
}

interface RentcastValueEstimate {
  price: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  priceRangeExtended: {
    lower: number;
    upper: number;
  };
  confidence: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  yearBuilt: number;
  latitude: number;
  longitude: number;
  comparables: RentcastComparable[];
}

interface RentcastRentEstimate {
  rent: number;
  rentRangeLow: number;
  rentRangeHigh: number;
  rentRange75: {
    lower: number;
    upper: number;
  };
  rentRange95: {
    lower: number;
    upper: number;
  };
  confidence: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  latitude: number;
  longitude: number;
  comparables: RentcastRentalComparable[];
}

declare global {
  interface Window {
    frsPropertyValuation?: {
      apiUrl: string;
      restNonce?: string;
    };
  }
}

export function PropertyValuation() {
  const [valuationType, setValuationType] = useState<ValuationType>('sale');
  const [appState, setAppState] = useState<AppState>('search');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<PropertySearchData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'Single Family',
    bedrooms: undefined,
    bathrooms: undefined,
    squareFootage: undefined,
  });

  const [valueResult, setValueResult] = useState<RentcastValueEstimate | null>(null);
  const [rentResult, setRentResult] = useState<RentcastRentEstimate | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address) {
      alert('Please enter a property address');
      return;
    }

    setIsLoading(true);
    setValueResult(null);
    setRentResult(null);

    try {
      const config = window.frsPropertyValuation;
      const apiUrl = config?.apiUrl || '/wp-json/frs-property-valuation/v1';

      const endpoint = valuationType === 'rent' ? '/rent-estimate' : '/valuation';
      const params = new URLSearchParams({
        address: formData.address,
        city: formData.city || '',
        state: formData.state || '',
        zipCode: formData.zipCode || '',
      });

      const response = await fetch(`${apiUrl}${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to get property valuation');
      }

      const result = await response.json();

      if (valuationType === 'rent') {
        setRentResult(result as RentcastRentEstimate);
      } else {
        setValueResult(result as RentcastValueEstimate);
      }

      setAppState('results');
    } catch (error) {
      console.error('Valuation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to get property valuation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSearch = () => {
    setAppState('search');
    setValueResult(null);
    setRentResult(null);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6">
      <main className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          icon={MapPin}
          title="Property Valuation Tool"
          iconBgColor="linear-gradient(135deg, #3b82f6 0%, #2DD4DA 100%)"
        />

        {appState === 'search' && (
          <div>
            {/* Search Form Card */}
            <Card className="w-full shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="mb-6">
                  {/* Valuation Type Toggle */}
                  <Tabs value={valuationType} onValueChange={(v) => setValuationType(v as ValuationType)} className="w-full max-w-md mb-6">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="sale" className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Sale Value</span>
                      </TabsTrigger>
                      <TabsTrigger value="rent" className="flex items-center space-x-2">
                        <Home className="w-4 h-4" />
                        <span>Rent Estimate</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <FloatingInput
                      label="Property Address"
                      type="text"
                      icon={<MapPin className="h-4 w-4" />}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder=" "
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FloatingInput
                        label="City"
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder=" "
                      />

                      <FloatingSelect
                        label="State"
                        value={formData.state}
                        onValueChange={(val) => setFormData({ ...formData, state: val })}
                        placeholder="Select State"
                      >
                        <FloatingSelectItem value="CA">California</FloatingSelectItem>
                        <FloatingSelectItem value="TX">Texas</FloatingSelectItem>
                        <FloatingSelectItem value="FL">Florida</FloatingSelectItem>
                        <FloatingSelectItem value="NY">New York</FloatingSelectItem>
                        <FloatingSelectItem value="PA">Pennsylvania</FloatingSelectItem>
                        <FloatingSelectItem value="IL">Illinois</FloatingSelectItem>
                        <FloatingSelectItem value="OH">Ohio</FloatingSelectItem>
                        <FloatingSelectItem value="GA">Georgia</FloatingSelectItem>
                        <FloatingSelectItem value="NC">North Carolina</FloatingSelectItem>
                        <FloatingSelectItem value="MI">Michigan</FloatingSelectItem>
                      </FloatingSelect>

                      <FloatingInput
                        label="ZIP Code"
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        placeholder=" "
                      />
                    </div>

                    <FloatingSelect
                      label="Property Type"
                      value={formData.propertyType}
                      onValueChange={(val) => setFormData({ ...formData, propertyType: val })}
                      placeholder="Select Property Type"
                    >
                      <FloatingSelectItem value="Single Family">Single Family Home</FloatingSelectItem>
                      <FloatingSelectItem value="Condo">Condominium</FloatingSelectItem>
                      <FloatingSelectItem value="Townhouse">Townhouse</FloatingSelectItem>
                      <FloatingSelectItem value="Multi-Family">Multi-Family</FloatingSelectItem>
                    </FloatingSelect>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FloatingInput
                        label="Bedrooms"
                        type="number"
                        value={formData.bedrooms?.toString() || ''}
                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder=" "
                      />

                      <FloatingInput
                        label="Bathrooms"
                        type="number"
                        value={formData.bathrooms?.toString() || ''}
                        onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder=" "
                      />

                      <FloatingInput
                        label="Square Feet"
                        type="number"
                        value={formData.squareFootage?.toString() || ''}
                        onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder=" "
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-[#2DD4DA] hover:from-blue-700 hover:to-[#28C5D0] text-white py-6 text-lg font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Search className="w-5 h-5 mr-2 animate-spin" />
                        Getting Valuation...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Get Free Valuation
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-[#444B57] text-center">
                    Powered by Rentcast API - 140M+ properties nationwide
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {appState === 'results' && (valueResult || rentResult) && (
          <div>
            <div className="mb-6">
              <button
                onClick={handleBackToSearch}
                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
              >
                ← Back to Search
              </button>
            </div>

            {/* Value Results */}
            {valueResult && (
              <div className="max-w-6xl mx-auto">
                <Card className="mb-6">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-[#2DD4DA] text-white">
                    <CardTitle className="flex items-center gap-2" style={{ color: '#ffffff' }}>
                      <TrendingUp className="h-6 w-6" />
                      Property Value Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center">
                        <div className="text-sm text-[#444B57] mb-2">Estimated Value</div>
                        <div className="text-3xl font-bold text-[#263042]">
                          {formatCurrency(valueResult.price)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-[#444B57] mb-2">Value Range (Standard)</div>
                        <div className="text-lg font-semibold text-[#263042]">
                          {formatCurrency(valueResult.priceRangeLow)} - {formatCurrency(valueResult.priceRangeHigh)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-[#444B57] mb-2">Extended Range</div>
                        <div className="text-lg font-semibold text-[#444B57]">
                          {valueResult.priceRangeExtended ? `${formatCurrency(valueResult.priceRangeExtended.lower)} - ${formatCurrency(valueResult.priceRangeExtended.upper)}` : 'N/A'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-[#444B57] mb-2">Confidence Score</div>
                        <div className="text-xl font-semibold text-blue-600">
                          {valueResult.confidence ? `${Math.round(valueResult.confidence * 100)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-[#263042] mb-4">Property Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-sm text-[#444B57]">Property Type</div>
                          <div className="text-lg font-semibold capitalize">{valueResult.propertyType || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Bedrooms</div>
                          <div className="text-lg font-semibold">{valueResult.bedrooms || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Bathrooms</div>
                          <div className="text-lg font-semibold">{valueResult.bathrooms || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Square Feet</div>
                          <div className="text-lg font-semibold">{valueResult.squareFootage?.toLocaleString() || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Year Built</div>
                          <div className="text-lg font-semibold">{valueResult.yearBuilt || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <div className="text-sm text-[#444B57]">Latitude</div>
                          <div className="text-sm font-mono">{valueResult.latitude?.toFixed(6) || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Longitude</div>
                          <div className="text-sm font-mono">{valueResult.longitude?.toFixed(6) || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Price/SqFt</div>
                          <div className="text-sm font-semibold">{valueResult.squareFootage ? formatCurrency(valueResult.price / valueResult.squareFootage) : 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {valueResult.comparables && valueResult.comparables.length > 0 && (
                      <div className="border-t mt-6 pt-6">
                        <h3 className="text-lg font-semibold text-[#263042] mb-4">
                          Comparable Sales ({valueResult.comparables.length} properties)
                        </h3>
                        <div className="space-y-4">
                          {valueResult.comparables.map((comp) => (
                            <div key={comp.id} className="bg-[#F8F7F9] rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold text-[#263042]">{comp.address?.address || comp.id}</div>
                                  <div className="text-sm text-[#444B57]">
                                    {comp.bedrooms} bd • {comp.bathrooms} ba • {comp.squareFootage?.toLocaleString()} sqft
                                  </div>
                                  <div className="text-sm text-[#444B57]">
                                    {comp.distance?.toFixed(2)} mi away
                                    {comp.lastSaleDate && ` • Sold ${new Date(comp.lastSaleDate).toLocaleDateString()}`}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">{formatCurrency(comp.price)}</div>
                                  <div className="text-sm text-[#444B57]">{comp.pricePerSquareFoot ? `${formatCurrency(comp.pricePerSquareFoot)}/sqft` : ''}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Rent Results */}
            {rentResult && (
              <div className="max-w-6xl mx-auto">
                <Card className="mb-6">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-[#2DD4DA] text-white">
                    <CardTitle className="flex items-center gap-2" style={{ color: '#ffffff' }}>
                      <Home className="h-6 w-6" />
                      Rent Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center">
                        <div className="text-sm text-[#444B57] mb-2">Monthly Rent</div>
                        <div className="text-3xl font-bold text-[#263042]">
                          {formatCurrency(rentResult.rent)}/mo
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-[#444B57] mb-2">Rent Range (Standard)</div>
                        <div className="text-lg font-semibold text-[#263042]">
                          {formatCurrency(rentResult.rentRangeLow)} - {formatCurrency(rentResult.rentRangeHigh)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-[#444B57] mb-2">Extended Range (75%)</div>
                        <div className="text-lg font-semibold text-[#444B57]">
                          {rentResult.rentRange75 ? `${formatCurrency(rentResult.rentRange75.lower)} - ${formatCurrency(rentResult.rentRange75.upper)}` : 'N/A'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-[#444B57] mb-2">Confidence Score</div>
                        <div className="text-xl font-semibold text-blue-600">
                          {rentResult.confidence ? `${Math.round(rentResult.confidence * 100)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-[#263042] mb-4">Property Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-sm text-[#444B57]">Property Type</div>
                          <div className="text-lg font-semibold capitalize">{rentResult.propertyType || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Bedrooms</div>
                          <div className="text-lg font-semibold">{rentResult.bedrooms || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Bathrooms</div>
                          <div className="text-lg font-semibold">{rentResult.bathrooms || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Square Feet</div>
                          <div className="text-lg font-semibold">{rentResult.squareFootage?.toLocaleString() || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Rent/SqFt</div>
                          <div className="text-lg font-semibold">{rentResult.squareFootage ? formatCurrency(rentResult.rent / rentResult.squareFootage) : 'N/A'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <div className="text-sm text-[#444B57]">Latitude</div>
                          <div className="text-sm font-mono">{rentResult.latitude?.toFixed(6) || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">Longitude</div>
                          <div className="text-sm font-mono">{rentResult.longitude?.toFixed(6) || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#444B57]">95% Range</div>
                          <div className="text-sm font-semibold">{rentResult.rentRange95 ? `${formatCurrency(rentResult.rentRange95.lower)} - ${formatCurrency(rentResult.rentRange95.upper)}` : 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {rentResult.comparables && rentResult.comparables.length > 0 && (
                      <div className="border-t mt-6 pt-6">
                        <h3 className="text-lg font-semibold text-[#263042] mb-4">
                          Comparable Rentals ({rentResult.comparables.length} properties)
                        </h3>
                        <div className="space-y-4">
                          {rentResult.comparables.map((comp) => (
                            <div key={comp.id} className="bg-[#F8F7F9] rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold text-[#263042]">{comp.address?.address || comp.id}</div>
                                  <div className="text-sm text-[#444B57]">
                                    {comp.bedrooms} bd • {comp.bathrooms} ba • {comp.squareFootage?.toLocaleString()} sqft
                                  </div>
                                  <div className="text-sm text-[#444B57]">
                                    {comp.distance?.toFixed(2)} mi away
                                    {comp.listedDate && ` • Listed ${new Date(comp.listedDate).toLocaleDateString()}`}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">{formatCurrency(comp.monthlyRent)}/mo</div>
                                  <div className="text-sm text-[#444B57]">{comp.rentPerSquareFoot ? `${formatCurrency(comp.rentPerSquareFoot)}/sqft` : ''}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
