import React, { useState } from 'react';
// Leaflet map components
// Note: Leaflet CSS must be imported at app entry (main.tsx)
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

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
 * Owner Portal - Shuttle Scheduling App
 * 
 * Features:
 * - Trip Summary with datetime and location management
 * - Rental car flow with validation and 15-min increments
 * - Emergency contacts (mobile, sat phone, radio)
 * - Post-trip tipping system
 */
interface OwnerPortalProps {
  onBack?: () => void;
}

const OwnerPortal: React.FC<OwnerPortalProps> = ({ onBack }) => {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Owner Portal</h1>
              <p className="mt-2 text-gray-600">Manage your shuttle trip details and preferences</p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </button>
            )}
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

        {/* How It Works Section */}
        <section className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Add Trip Dates</h3>
              <p className="text-gray-600 text-sm">
                Enter your trip start date and end date. This helps us coordinate the perfect shuttle schedule for your journey.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Add Pickup & Dropoff Locations</h3>
              <p className="text-gray-600 text-sm">
                Specify where you'll pick up and drop off your car. We'll coordinate with shuttle services to get you there seamlessly.
              </p>
            </div>
          </div>
        </section>

        {/* Personal Information Section */}
        <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
          <p className="text-sm text-gray-600 mb-6">Required for insurance, emergency contacts, and trip coordination.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">What's your full name?</p>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone Number */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">What's your primary phone number?</p>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Email */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">What's your email address?</p>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Who should we contact in an emergency?</p>
              <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Name
              </label>
              <input
                id="emergencyContact"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Emergency contact name"
              />
            </div>

            {/* Emergency Contact Phone */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">What's their phone number?</p>
              <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Phone
              </label>
              <input
                id="emergencyContactPhone"
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 987-6543"
              />
            </div>

            {/* Insurance Provider */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">What's your auto insurance provider?</p>
              <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 mb-2">
                Insurance Provider
              </label>
              <input
                id="insuranceProvider"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., State Farm, Geico, Allstate"
              />
            </div>

            {/* Insurance Policy Number */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">What's your insurance policy number?</p>
              <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Policy Number
              </label>
              <input
                id="policyNumber"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter policy number"
              />
            </div>

            {/* Driver's License */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">What's your driver's license number?</p>
              <label htmlFor="driversLicense" className="block text-sm font-medium text-gray-700 mb-2">
                Driver's License Number
              </label>
              <input
                id="driversLicense"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter driver's license number"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">What's your date of birth?</p>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* Trip Summary Section */}
        <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trip Start */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">When does your shuttle trip begin?</p>
              <label htmlFor="startDateTime" className="block text-sm font-medium text-gray-700 mb-2">
                Trip Start Date & Time
              </label>
              <input
                id="startDateTime"
                type="datetime-local"
                value={tripData.startDateTime}
                onChange={(e) => handleTripDataChange('startDateTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="startDateTime-help"
              />
              <p id="startDateTime-help" className="mt-1 text-sm text-gray-500">
                Select the date and time when your shuttle trip starts
              </p>
            </div>

            {/* Trip End */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">When does your shuttle trip end?</p>
              <label htmlFor="endDateTime" className="block text-sm font-medium text-gray-700 mb-2">
                Trip End Date & Time
              </label>
              <input
                id="endDateTime"
                type="datetime-local"
                value={tripData.endDateTime}
                onChange={(e) => handleTripDataChange('endDateTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="endDateTime-help"
              />
              <p id="endDateTime-help" className="mt-1 text-sm text-gray-500">
                Select the date and time when your shuttle trip ends
              </p>
            </div>

            {/* Pickup Location */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Where will you pick up your car?</p>
              <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700 mb-2">
                Car Pickup Location
              </label>
              <input
                id="pickupLocation"
                type="text"
                value={tripData.pickupLocation}
                onChange={(e) => handleTripDataChange('pickupLocation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Downtown Terminal, Airport"
              />
            </div>

            {/* Dropoff Location */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Where will you drop off your car?</p>
              <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700 mb-2">
                Car Dropoff Location
              </label>
              <input
                id="dropoffLocation"
                type="text"
                value={tripData.dropoffLocation}
                onChange={(e) => handleTripDataChange('dropoffLocation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mountain Resort, Hotel"
              />
            </div>

            {/* Desired Drop-by */}
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-2 font-medium">When do you want to drop off your car? (Must be at least 24 hours before trip end)</p>
              <label htmlFor="desiredDropBy" className="block text-sm font-medium text-gray-700 mb-2">
                Desired Drop-by Time
              </label>
              <input
                id="desiredDropBy"
                type="datetime-local"
                value={tripData.desiredDropBy}
                onChange={(e) => handleTripDataChange('desiredDropBy', e.target.value)}
                max={new Date(new Date(tripData.endDateTime).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="desiredDropBy-help"
              />
              <p id="desiredDropBy-help" className="mt-1 text-sm text-gray-500">
                This time is automatically set to 24 hours before your trip ends, but you can adjust it
              </p>
            </div>
          </div>
        </section>

        {/* Rental Car Section */}
        <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Rental Car</h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rentalCar.enabled}
                onChange={(e) => handleRentalCarChange('enabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Enable rental car</span>
            </label>
          </div>

          {rentalCar.enabled && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Provider */}
                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                    Rental Provider
                  </label>
                  <input
                    id="provider"
                    type="text"
                    value={rentalCar.provider}
                    onChange={(e) => handleRentalCarChange('provider', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Enterprise, Hertz"
                  />
                </div>

                {/* Confirmation */}
                <div>
                  <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmation Number (Optional)
                  </label>
                  <input
                    id="confirmation"
                    type="text"
                    value={rentalCar.confirmation}
                    onChange={(e) => handleRentalCarChange('confirmation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter confirmation number"
                  />
                </div>

                {/* Pickup Location */}
                <div>
                  <label htmlFor="rentalPickupLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location
                  </label>
                  <input
                    id="rentalPickupLocation"
                    type="text"
                    value={rentalCar.pickupLocation}
                    onChange={(e) => handleRentalCarChange('pickupLocation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rental pickup location"
                  />
                </div>

                {/* Dropoff Location */}
                <div>
                  <label htmlFor="rentalDropoffLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    Dropoff Location
                  </label>
                  <input
                    id="rentalDropoffLocation"
                    type="text"
                    value={rentalCar.dropoffLocation}
                    onChange={(e) => handleRentalCarChange('dropoffLocation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rental dropoff location"
                  />
                </div>

                {/* Pickup DateTime */}
                <div>
                  <label htmlFor="rentalPickupDateTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Date & Time
                  </label>
                  <input
                    id="rentalPickupDateTime"
                    type="datetime-local"
                    value={rentalCar.pickupDateTime}
                    onChange={(e) => handleRentalCarChange('pickupDateTime', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      rentalCar.pickupDateTime && !validateRentalPickup(rentalCar.pickupDateTime)
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    aria-describedby="rentalPickupDateTime-help"
                  />
                  <p id="rentalPickupDateTime-help" className="mt-1 text-sm text-gray-500">
                    Must be ≤ desired drop-by and ≤ end - 24h
                  </p>
                  {rentalCar.pickupDateTime && !validateRentalPickup(rentalCar.pickupDateTime) && (
                    <p className="mt-1 text-sm text-red-600">
                      Pickup time is too late. Must be before desired drop-by time.
                    </p>
                  )}
                </div>

                {/* Dropoff DateTime */}
                <div>
                  <label htmlFor="rentalDropoffDateTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Dropoff Date & Time
                  </label>
                  <input
                    id="rentalDropoffDateTime"
                    type="datetime-local"
                    value={rentalCar.dropoffDateTime}
                    onChange={(e) => handleRentalCarChange('dropoffDateTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Add to Calendar Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleAddToCalendar}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add to Calendar (ICS)
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Emergency Contacts Section */}
        <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Emergency Contacts</h2>
          <p className="text-sm text-gray-600 mb-6">
            Contact information stored locally. Mark dispatch-only in UI copy.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mobile */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Phone
              </label>
              <input
                id="mobile"
                type="tel"
                value={emergencyContacts.mobile}
                onChange={(e) => handleEmergencyContactChange('mobile', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Satellite Phone */}
            <div>
              <label htmlFor="satPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Satellite Phone
              </label>
              <input
                id="satPhone"
                type="tel"
                value={emergencyContacts.satPhone}
                onChange={(e) => handleEmergencyContactChange('satPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 987-6543"
              />
            </div>

            {/* Radio */}
            <div>
              <label htmlFor="radio" className="block text-sm font-medium text-gray-700 mb-2">
                Radio Channel
              </label>
              <input
                id="radio"
                type="text"
                value={emergencyContacts.radio}
                onChange={(e) => handleEmergencyContactChange('radio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Channel 16"
              />
            </div>
          </div>
        </section>

        {/* Post-Trip Tipping Section */}
        <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Post-Trip Tipping</h2>
          
          {/* Car Delivered Toggle */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={tipping.carDelivered}
                onChange={handleCarDelivered}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Car delivered</span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Tip Driver panel will be unlocked once car is delivered
            </p>
          </div>

          {/* Tip Driver Panel - Only visible when car is delivered */}
          {tipping.carDelivered && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-green-900 mb-4">Tip Driver</h3>
              
              {/* Quick Tip Buttons */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Quick tip amounts:</p>
                <div className="flex flex-wrap gap-3">
                  {[10, 20, 40].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleTipAmount(amount)}
                      className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                        tipping.amount === amount
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mb-6">
                <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Amount
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    id="customAmount"
                    type="number"
                    value={tipping.customAmount}
                    onChange={(e) => handleCustomTip(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter custom amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Payout Routing Note */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Payout routing depends on shuttle company setting. 
                  Tips will be processed according to your company's payment configuration.
                </p>
              </div>

              {/* Submit Tip Button */}
              <button
                onClick={handleSubmitTip}
                disabled={tipping.amount === 0}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit ${tipping.amount || tipping.customAmount} Tip
              </button>
            </div>
          )}
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveTrip}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Trip Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerPortal;
