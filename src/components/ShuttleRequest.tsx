import React, { useState } from 'react';
import { useSupabase } from '../hooks/useSupabase';

interface GeoPoint {
  lat: number;
  lng: number;
  name: string;
}

interface Vehicle {
  id: number;
  transmission: 'manual' | 'automatic';
  make: string;
  model: string;
  year: string;
}

// Sample data for dropdowns
const SAMPLE_MAKES: string[] = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 
  'Audi', 'Nissan', 'Hyundai', 'Kia', 'Subaru', 'Mazda'
];

const SAMPLE_MODELS: { [key: string]: string[] } = {
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', '4Runner', 'Prius'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit'],
  Ford: ['F-150', 'Explorer', 'Escape', 'Mustang', 'Edge', 'Expedition'],
  Chevrolet: ['Silverado', 'Tahoe', 'Equinox', 'Trailblazer'],
};

const SAMPLE_YEARS: string[] = Array.from({ length: 31 }, (_, i) => String(2025 - i));

/**
 * Shuttle Request - Customer-facing shuttle booking interface
 * 
 * Features:
 * - Interactive map pickers for parking and drop-off locations
 * - Vehicle management with make/model/year and transmission
 * - Date/time scheduling for shuttle coordination
 * - Real-time database integration with Supabase
 */
interface ShuttleRequestProps {
  onBack?: () => void;
}

const ShuttleRequest: React.FC<ShuttleRequestProps> = () => {
  // Supabase connection status
  const { isConnected, error } = useSupabase();
  
  // Shuttle Request (Uber-like) State
  const [parkingLocation, setParkingLocation] = useState<GeoPoint>({ lat: 0, lng: 0, name: '' });
  const [dropoffLocation, setDropoffLocation] = useState<GeoPoint>({ lat: 0, lng: 0, name: '' });
  const [vehicleCount, setVehicleCount] = useState<number>(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: 1, transmission: 'automatic', make: '', model: '', year: '' }
  ]);
  const [dropoffDay, setDropoffDay] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');

  // Vehicle management handlers
  const handleVehicleCountChange = (count: number) => {
    const safeCount = Math.max(1, Math.min(10, count));
    setVehicleCount(safeCount);
    setVehicles((prev) => {
      const next = [...prev];
      if (safeCount > next.length) {
        for (let i = next.length; i < safeCount; i += 1) {
          next.push({ id: i + 1, transmission: 'automatic', make: '', model: '', year: '' });
        }
      } else if (safeCount < next.length) {
        next.length = safeCount;
      }
      return next;
    });
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: string) => {
    setVehicles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleLocationChange = (type: 'parking' | 'dropoff', field: keyof GeoPoint, value: string | number) => {
    if (type === 'parking') {
      setParkingLocation(prev => ({ ...prev, [field]: value }));
    } else {
      setDropoffLocation(prev => ({ ...prev, [field]: value }));
    }
  };

  const getAvailableModels = (make: string): string[] => {
    return SAMPLE_MODELS[make] || [];
  };

  const handleSubmit = () => {
    // TODO: Submit to Supabase
    console.log('Submitting shuttle request:', {
      parkingLocation,
      dropoffLocation,
      vehicleCount,
      vehicles,
      dropoffDay,
      arrivalTime
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Request a Shuttle</h1>
            <p className="mt-2 text-gray-600">Book your vehicle shuttle service for your river trip</p>
            
            {/* Supabase Connection Status */}
            <div className="mt-2 flex items-center gap-2">
              {isConnected === null && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  Connecting to database...
                </div>
              )}
              {isConnected === true && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Connected to Supabase
                </div>
              )}
              {isConnected === false && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Database connection failed
                  {error && <span className="text-xs">({error})</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shuttle Request Form */}
        <section className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request a Shuttle</h2>
            <p className="text-gray-600 mb-6">Ultra‑modern, Uber‑style flow to move your vehicle(s) from parking to your take‑out.</p>

            {/* Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Parking Location */}
              <div>
                <label htmlFor="parkingLocation" className="block text-sm font-medium text-gray-700 mb-2">
                  Where did you park your car?
                </label>
                <input
                  id="parkingLocation"
                  type="text"
                  value={parkingLocation.name}
                  onChange={(e) => handleLocationChange('parking', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Downtown Parking Garage"
                />
                <div className="mt-2 h-32 bg-gray-100 rounded-md flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Map placeholder - Parking Location</p>
                </div>
              </div>

              {/* Drop-off Location */}
              <div>
                <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700 mb-2">
                  Where do you need your car shuttled to?
                </label>
                <input
                  id="dropoffLocation"
                  type="text"
                  value={dropoffLocation.name}
                  onChange={(e) => handleLocationChange('dropoff', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Mountain Resort"
                />
                <div className="mt-2 h-32 bg-gray-100 rounded-md flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Map placeholder - Drop-off Location</p>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h3>
              
              {/* Vehicle Count */}
              <div className="mb-6">
                <label htmlFor="vehicleCount" className="block text-sm font-medium text-gray-700 mb-2">
                  How many vehicles need to be shuttled?
                </label>
                <select
                  id="vehicleCount"
                  value={vehicleCount}
                  onChange={(e) => handleVehicleCountChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} vehicle{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Individual Vehicle Details */}
              <div className="space-y-6">
                {vehicles.map((vehicle, index) => (
                  <div key={vehicle.id} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Vehicle {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Transmission */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
                        <select
                          value={vehicle.transmission}
                          onChange={(e) => handleVehicleChange(index, 'transmission', e.target.value as 'manual' | 'automatic')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="automatic">Automatic</option>
                          <option value="manual">Manual</option>
                        </select>
                      </div>

                      {/* Make */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                        <select
                          value={vehicle.make}
                          onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Make</option>
                          {SAMPLE_MAKES.map(make => (
                            <option key={make} value={make}>{make}</option>
                          ))}
                        </select>
                      </div>

                      {/* Model */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                        <select
                          value={vehicle.model}
                          onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                          disabled={!vehicle.make}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">Select Model</option>
                          {getAvailableModels(vehicle.make).map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>

                      {/* Year */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                        <select
                          value={vehicle.year}
                          onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Year</option>
                          {SAMPLE_YEARS.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Drop-off Day */}
              <div>
                <label htmlFor="dropoffDay" className="block text-sm font-medium text-gray-700 mb-2">
                  What day will you drop off your car?
                </label>
                <input
                  id="dropoffDay"
                  type="date"
                  value={dropoffDay}
                  onChange={(e) => setDropoffDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Arrival Time */}
              <div>
                <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700 mb-2">
                  What time will you arrive at the pickup location?
                </label>
                <input
                  id="arrivalTime"
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white py-3 px-8 rounded-lg text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Request Shuttle
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShuttleRequest;