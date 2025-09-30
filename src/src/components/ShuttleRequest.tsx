import React, { useState } from 'react';
// Leaflet map components
// Note: Leaflet CSS must be imported at app entry (main.tsx)
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useSupabase } from '../hooks/useSupabase';

// Mock data types
interface TripData {
  startDateTime: string;
  endDateTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  desiredDropBy: string;
}

interface RentalCarData {
  enabled: boolean;
  provider: string;
  confirmation: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  dropoffDateTime: string;
}

interface EmergencyContacts {
  mobile: string;
  satPhone: string;
  radio: string;
}

interface TippingData {
  carDelivered: boolean;
  amount: number;
  customAmount: string;
}

// New shuttle request types (Uber-like flow)
type TransmissionType = 'automatic' | 'manual';

interface VehicleRequest {
  id: number;
  transmission: TransmissionType;
  make: string;
  model: string;
  year: string; // keep as string for flexible input and easy formatting
}

interface GeoPoint {
  name: string; // human-readable label entered by user or reverse geocoded
  lat?: number; // optional until map is integrated
  lng?: number;
}

// Simple marker icon fix for Leaflet in bundlers
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon as any;

function ClickToSetMarker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

// Sample vehicle data for dropdowns (can be fetched later)
const SAMPLE_MAKES_TO_MODELS: Record<string, string[]> = {
  Toyota: ['4Runner', 'Tacoma', 'RAV4', 'Camry'],
  Ford: ['F-150', 'Explorer', 'Bronco', 'Escape'],
  Subaru: ['Outback', 'Forester', 'Crosstrek', 'Ascent'],
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

const ShuttleRequest: React.FC<ShuttleRequestProps> = ({ onBack }) => {
  // Supabase connection status
  const { isConnected, error } = useSupabase();
  
  // Shuttle Request (Uber-like) State
  const [parkingLocation, setParkingLocation] = useState<GeoPoint>({ name: '' });
  const [dropoffLocation, setDropoffLocation] = useState<GeoPoint>({ name: '' });
  const [vehicleCount, setVehicleCount] = useState<number>(1);
  const [vehicles, setVehicles] = useState<VehicleRequest[]>([{ id: 1, transmission: 'automatic', make: '', model: '', year: '' }]);
  const [dropoffDay, setDropoffDay] = useState<string>(''); // date only (YYYY-MM-DD)
  const [arrivalTime, setArrivalTime] = useState<string>(''); // time only (HH:MM)

  // Trip Summary State
  const [tripData, setTripData] = useState<TripData>({
    startDateTime: '2024-01-15T08:00',
    endDateTime: '2024-01-20T18:00',
    pickupLocation: 'Downtown Terminal',
    dropoffLocation: 'Mountain Resort',
    desiredDropBy: '2024-01-19T18:00' // Default: end - 24h
  });

  // Rental Car State
  const [rentalCar, setRentalCar] = useState<RentalCarData>({
    enabled: false,
    provider: '',
    confirmation: '',
    pickupLocation: '',
    dropoffLocation: '',
    pickupDateTime: '',
    dropoffDateTime: ''
  });

  // Emergency Contacts State
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContacts>({
    mobile: '',
    satPhone: '',
    radio: ''
  });

  // Tipping State
  const [tipping, setTipping] = useState<TippingData>({
    carDelivered: false,
    amount: 0,
    customAmount: ''
  });

  // Utility Functions
  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const snapTo15Min = (dateTime: string) => {
    const date = new Date(dateTime);
    const minutes = date.getMinutes();
    const snappedMinutes = Math.round(minutes / 15) * 15;
    date.setMinutes(snappedMinutes);
    return date.toISOString().slice(0, 16);
  };

  const validateRentalPickup = (pickupDateTime: string) => {
    const pickup = new Date(pickupDateTime);
    const dropBy = new Date(tripData.desiredDropBy);
    const endMinus24h = new Date(new Date(tripData.endDateTime).getTime() - 24 * 60 * 60 * 1000);
    
    return pickup <= dropBy && pickup <= endMinus24h;
  };

  // Event Handlers
  const handleTripDataChange = (field: keyof TripData, value: string) => {
    setTripData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-update desired drop-by when end time changes
      if (field === 'endDateTime') {
        const endTime = new Date(value);
        const dropBy = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
        updated.desiredDropBy = dropBy.toISOString().slice(0, 16);
      }
      
      return updated;
    });
  };

  const handleRentalCarChange = (field: keyof RentalCarData, value: string | boolean) => {
    setRentalCar(prev => {
      const updated = { ...prev, [field]: value };
      
      // Snap datetime inputs to 15-min increments
      if (field === 'pickupDateTime' && typeof value === 'string') {
        updated.pickupDateTime = snapTo15Min(value);
      }
      if (field === 'dropoffDateTime' && typeof value === 'string') {
        updated.dropoffDateTime = snapTo15Min(value);
      }
      
      return updated;
    });
  };

  const handleEmergencyContactChange = (field: keyof EmergencyContacts, value: string) => {
    setEmergencyContacts(prev => ({ ...prev, [field]: value }));
    
    // TODO: Store locally in localStorage
    localStorage.setItem('emergencyContacts', JSON.stringify({
      ...emergencyContacts,
      [field]: value
    }));
  };

  const handleTipAmount = (amount: number) => {
    setTipping(prev => ({ ...prev, amount, customAmount: '' }));
  };

  const handleCustomTip = (amount: string) => {
    setTipping(prev => ({ 
      ...prev, 
      customAmount: amount, 
      amount: amount ? parseInt(amount) : 0 
    }));
  };

  const handleCarDelivered = () => {
    setTipping(prev => ({ ...prev, carDelivered: !prev.carDelivered }));
  };

  const handleAddToCalendar = () => {
    // TODO: Implement ICS file generation and download
    console.log('Generate ICS file for calendar integration');
  };

  const handleSaveTrip = () => {
    // TODO: API call to save trip data
    console.log('Save trip data:', { tripData, rentalCar, emergencyContacts });
  };

  const handleSubmitTip = () => {
    // TODO: API call to process tip payment
    console.log('Submit tip:', tipping);
  };

  // Shuttle Request Handlers
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

  const setVehicleTransmission = (id: number, transmission: TransmissionType) => {
    setVehicles((prev) => prev.map(v => v.id === id ? { ...v, transmission } : v));
  };

  const setVehicleField = (id: number, field: keyof VehicleRequest, value: string) => {
    setVehicles((prev) => prev.map(v => v.id === id ? { ...v, [field]: value } as VehicleRequest : v));
  };

  const handlePlacePick = (kind: 'parking' | 'dropoff') => {
    // TODO: Integrate map picker (e.g., Mapbox/Google). For now, stub a map modal.
    console.log('Open map picker for', kind);
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

        {/* Shuttle Request (Uber-like) */}
        <section className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request a Shuttle</h2>
            <p className="text-gray-600 mb-6">Ultra‑modern, Uber‑style flow to move your vehicle(s) from parking to your take‑out.</p>

            {/* Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="parkingLocation" className="block text-sm font-medium text-gray-700 mb-2">Parking Location (where you parked)</label>
                <div className="flex gap-2">
                  <input
                    id="parkingLocation"
                    type="text"
                    value={parkingLocation.name}
                    onChange={(e) => setParkingLocation({ ...parkingLocation, name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search or type an address / point"
                    aria-describedby="parkingLocation-help"
                  />
                  <button
                    type="button"
                    onClick={() => handlePlacePick('parking')}
                    className="px-3 py-2 rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700"
                  >
                    Use Map
                  </button>
                </div>
                <p id="parkingLocation-help" className="mt-1 text-xs text-gray-500">Exact coordinates optional for now. Map picker coming soon.</p>

                {/* Map picker */}
                <div className="mt-3 aspect-[3/2] w-full overflow-hidden rounded-lg border border-gray-200">
                  <MapContainer
                    center={[39.5, -98.35]} // USA approx
                    zoom={4}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {typeof parkingLocation.lat === 'number' && typeof parkingLocation.lng === 'number' && (
                      <Marker position={[parkingLocation.lat, parkingLocation.lng]} />
                    )}
                    <ClickToSetMarker onPick={(lat, lng) => setParkingLocation({ ...parkingLocation, lat, lng })} />
                  </MapContainer>
                </div>
              </div>

              <div>
                <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700 mb-2">Drop‑off Location (where shuttle meets you)</label>
                <div className="flex gap-2">
                  <input
                    id="dropoffLocation"
                    type="text"
                    value={dropoffLocation.name}
                    onChange={(e) => setDropoffLocation({ ...dropoffLocation, name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search or type an address / landmark"
                    aria-describedby="dropoffLocation-help"
                  />
                  <button
                    type="button"
                    onClick={() => handlePlacePick('dropoff')}
                    className="px-3 py-2 rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700"
                  >
                    Use Map
                  </button>
                </div>
                <p id="dropoffLocation-help" className="mt-1 text-xs text-gray-500">This is usually your river put‑in or meeting point.</p>

                {/* Map picker */}
                <div className="mt-3 aspect-[3/2] w-full overflow-hidden rounded-lg border border-gray-200">
                  <MapContainer
                    center={[39.5, -98.35]}
                    zoom={4}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {typeof dropoffLocation.lat === 'number' && typeof dropoffLocation.lng === 'number' && (
                      <Marker position={[dropoffLocation.lat, dropoffLocation.lng]} />
                    )}
                    <ClickToSetMarker onPick={(lat, lng) => setDropoffLocation({ ...dropoffLocation, lat, lng })} />
                  </MapContainer>
                </div>
              </div>
            </div>

            {/* Vehicles */}
            <div className="mt-8">
              <label htmlFor="vehicleCount" className="block text-sm font-medium text-gray-700 mb-2">How many vehicles need to be transported?</label>
              <div className="flex items-center gap-3">
                <input
                  id="vehicleCount"
                  type="number"
                  min={1}
                  max={10}
                  value={vehicleCount}
                  onChange={(e) => handleVehicleCountChange(parseInt(e.target.value || '1', 10))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500">Transport drivers will shuttle each vehicle from parking to your take‑out.</p>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div key={v.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Vehicle {v.id}</h4>
                      <div className="flex items-center gap-2" role="group" aria-label={`Vehicle ${v.id} transmission`}>
                        <button
                          type="button"
                          onClick={() => setVehicleTransmission(v.id, 'automatic')}
                          className={`px-3 py-1 rounded-md text-sm border ${v.transmission === 'automatic' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          aria-pressed={v.transmission === 'automatic'}
                        >
                          Automatic
                        </button>
                        <button
                          type="button"
                          onClick={() => setVehicleTransmission(v.id, 'manual')}
                          className={`px-3 py-1 rounded-md text-sm border ${v.transmission === 'manual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          aria-pressed={v.transmission === 'manual'}
                        >
                          Manual
                        </button>
                      </div>
                    </div>

                    {/* Make/Model/Year - dropdowns */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor={`make-${v.id}`} className="block text-xs font-medium text-gray-700 mb-1">Make</label>
                        <select
                          id={`make-${v.id}`}
                          value={v.make}
                          onChange={(e) => {
                            const nextMake = e.target.value;
                            const firstModel = nextMake ? (SAMPLE_MAKES_TO_MODELS[nextMake]?.[0] || '') : '';
                            setVehicleField(v.id, 'make', nextMake);
                            setVehicleField(v.id, 'model', firstModel);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select make</option>
                          {Object.keys(SAMPLE_MAKES_TO_MODELS).map((make) => (
                            <option key={make} value={make}>{make}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`model-${v.id}`} className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                        <select
                          id={`model-${v.id}`}
                          value={v.model}
                          onChange={(e) => setVehicleField(v.id, 'model', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={!v.make}
                        >
                          <option value="">{v.make ? 'Select model' : 'Select make first'}</option>
                          {(SAMPLE_MAKES_TO_MODELS[v.make] || []).map((model) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`year-${v.id}`} className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                        <select
                          id={`year-${v.id}`}
                          value={v.year}
                          onChange={(e) => setVehicleField(v.id, 'year', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select year</option>
                          {SAMPLE_YEARS.map((yr) => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dates & Times */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dropoffDay" className="block text-sm font-medium text-gray-700 mb-2">What day will you drop off the car(s)?</label>
                <input
                  id="dropoffDay"
                  type="date"
                  value={dropoffDay}
                  onChange={(e) => setDropoffDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Time not required. This is for shuttle owner planning.</p>
              </div>

              <div>
                <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700 mb-2">What time will you arrive at the pickup (meeting) location?</label>
                <input
                  id="arrivalTime"
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Shuttle owner uses this to ensure vehicles arrive on time.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  // TODO: Submit shuttle request to backend
                  console.log('Submit shuttle request', { parkingLocation, dropoffLocation, vehicles, dropoffDay, arrivalTime });
                }}
                className="inline-flex justify-center items-center px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Request Shuttle
              </button>
              <button
                type="button"
                onClick={() => {
                  // TODO: Save draft to backend or localStorage
                  console.log('Save draft', { parkingLocation, dropoffLocation, vehicles, dropoffDay, arrivalTime });
                }}
                className="inline-flex justify-center items-center px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Save Draft
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ShuttleRequest;
