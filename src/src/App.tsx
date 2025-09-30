import { useState } from 'react'
import ShuttleRequest from './components/ShuttleRequest'
import OwnerDashboard from './components/OwnerDashboard'

function App() {
  const [currentView, setCurrentView] = useState<'customer' | 'owner'>('customer')

  if (currentView === 'owner') {
    return <OwnerDashboard onBack={() => setCurrentView('customer')} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Shuttle Forge</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('customer')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'customer'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Customer View
              </button>
              <button
                onClick={() => setCurrentView('owner')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'owner'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Owner Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <ShuttleRequest />
    </div>
  )
}

export default App
