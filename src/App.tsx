import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🚀 Shuttle Forge
          </h1>
          <p className="text-gray-600 mb-8">
            A modern React app with Vite, TypeScript, and Tailwind CSS
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-2xl font-semibold text-gray-700 mb-4">
              Count: {count}
            </p>
            <button
              onClick={() => setCount((count) => count + 1)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
            >
              Click me!
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-green-100 p-3 rounded-lg">
              <div className="font-semibold text-green-800">✅ Vite</div>
              <div className="text-green-600">Fast build tool</div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <div className="font-semibold text-blue-800">⚛️ React</div>
              <div className="text-blue-600">UI library</div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <div className="font-semibold text-purple-800">📘 TypeScript</div>
              <div className="text-purple-600">Type safety</div>
            </div>
            <div className="bg-cyan-100 p-3 rounded-lg">
              <div className="font-semibold text-cyan-800">🎨 Tailwind</div>
              <div className="text-cyan-600">Utility CSS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
