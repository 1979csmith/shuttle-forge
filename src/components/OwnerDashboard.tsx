import React, { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';

/**
 * Owner Dashboard - Shuttle owner's request management interface
 * 
 * Features:
 * - List of all shuttle requests with status
 * - Click to view request details
 * - Accept/reject requests
 * - Real-time updates with Supabase
 */

interface ShuttleRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  parkingLocation: {
    name: string;
    lat: number;
    lng: number;
  };
  dropoffLocation: {
    name: string;
    lat: number;
    lng: number;
  };
  vehicleCount: number;
  vehicles: Array<{
    make: string;
    model: string;
    year: string;
    transmission: 'manual' | 'auto';
  }>;
  dropoffDay: string;
  arrivalTime: string;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
  notes?: string;
}

interface OwnerDashboardProps {
  onBack?: () => void;
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onBack }) => {
  const { isConnected, error } = useSupabase();
  const [requests, setRequests] = useState<ShuttleRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ShuttleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  // Mock data for development
  const mockRequests: ShuttleRequest[] = [
    {
      id: '1',
      customerName: 'John Smith',
      customerPhone: '+1 (555) 123-4567',
      customerEmail: 'john@example.com',
      parkingLocation: {
        name: 'Downtown Parking Garage',
        lat: 40.7128,
        lng: -74.0060
      },
      dropoffLocation: {
        name: 'Mountain Resort',
        lat: 40.7589,
        lng: -73.9851
      },
      vehicleCount: 1,
      vehicles: [{
        make: 'Toyota',
        model: '4Runner',
        year: '2020',
        transmission: 'auto'
      }],
      dropoffDay: '2024-01-15',
      arrivalTime: '08:00',
      status: 'pending',
      createdAt: '2024-01-10T10:30:00Z',
      notes: 'Customer prefers early morning pickup'
    },
    {
      id: '2',
      customerName: 'Sarah Johnson',
      customerPhone: '+1 (555) 987-6543',
      customerEmail: 'sarah@example.com',
      parkingLocation: {
        name: 'Airport Terminal A',
        lat: 40.6892,
        lng: -74.1745
      },
      dropoffLocation: {
        name: 'River Access Point',
        lat: 40.7505,
        lng: -73.9934
      },
      vehicleCount: 2,
      vehicles: [
        {
          make: 'Ford',
          model: 'F-150',
          year: '2022',
          transmission: 'auto'
        },
        {
          make: 'Chevrolet',
          model: 'Silverado',
          year: '2021',
          transmission: 'manual'
        }
      ],
      dropoffDay: '2024-01-18',
      arrivalTime: '09:30',
      status: 'active',
      createdAt: '2024-01-09T14:20:00Z',
      notes: 'Group of 4 people, need extra space'
    },
    {
      id: '3',
      customerName: 'Mike Wilson',
      customerPhone: '+1 (555) 456-7890',
      customerEmail: 'mike@example.com',
      parkingLocation: {
        name: 'Hotel Plaza',
        lat: 40.7614,
        lng: -73.9776
      },
      dropoffLocation: {
        name: 'Canyon Viewpoint',
        lat: 40.7505,
        lng: -73.9934
      },
      vehicleCount: 1,
      vehicles: [{
        make: 'Honda',
        model: 'CR-V',
        year: '2019',
        transmission: 'auto'
      }],
      dropoffDay: '2024-01-12',
      arrivalTime: '07:00',
      status: 'completed',
      createdAt: '2024-01-08T16:45:00Z',
      notes: 'Successfully completed shuttle service'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setRequests(mockRequests);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredRequests = requests.filter(request => 
    filter === 'all' || request.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'active' as const } : req
    ));
    setSelectedRequest(null);
  };

  const handleCompleteRequest = (requestId: string) => {
    // TODO: In production, this could be automatic based on dropoffDay + 1 day
    // or manual completion by the owner
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'completed' as const } : req
    ));
    setSelectedRequest(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shuttle Requests</h1>
              <p className="mt-2 text-gray-600">Manage and respond to shuttle service requests</p>
              
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
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Connected to database
                  </div>
                )}
                {isConnected === false && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    Database connection failed
                    {error && <span className="text-xs">({error})</span>}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Customer View
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Shuttle Forge</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Requests', count: requests.length },
                { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
                { key: 'active', label: 'Active', count: requests.filter(r => r.status === 'active').length },
                { key: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    filter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {filter === 'all' ? 'All Requests' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Requests`}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' ? 'No shuttle requests have been submitted yet.' : `No ${filter} requests found.`}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium text-gray-900">{request.customerName}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <span>{request.customerPhone}</span>
                        <span>{request.customerEmail}</span>
                        <span>{request.vehicleCount} vehicle{request.vehicleCount > 1 ? 's' : ''}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span>Drop-off: {request.dropoffDay} at {request.arrivalTime}</span>
                        <span>From: {request.parkingLocation.name}</span>
                        <span>To: {request.dropoffLocation.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.customerName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.customerPhone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.customerEmail}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Trip Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Drop-off Day</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.dropoffDay}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Arrival Time</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.arrivalTime}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.parkingLocation.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Drop-off Location</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.dropoffLocation.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicles */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Vehicles ({selectedRequest.vehicleCount})</h4>
                    <div className="space-y-3">
                      {selectedRequest.vehicles.map((vehicle, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Make</label>
                              <p className="mt-1 text-sm text-gray-900">{vehicle.make}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Model</label>
                              <p className="mt-1 text-sm text-gray-900">{vehicle.model}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Year</label>
                              <p className="mt-1 text-sm text-gray-900">{vehicle.year}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Transmission</label>
                              <p className="mt-1 text-sm text-gray-900 capitalize">{vehicle.transmission}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedRequest.notes && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Notes</h4>
                      <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{selectedRequest.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedRequest.status === 'pending' && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleAcceptRequest(selectedRequest.id)}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Accept Request
                      </button>
                    </div>
                  )}
                  
                  {selectedRequest.status === 'active' && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleCompleteRequest(selectedRequest.id)}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
