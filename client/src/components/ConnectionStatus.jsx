import React, { useState, useEffect } from 'react'
import { AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useToast } from '../lib/use-toast'

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isServerHealthy, setIsServerHealthy] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  const checkServerHealth = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setIsServerHealthy(data.database === 'connected')
      
      if (data.database !== 'connected') {
        toast({
          title: "Database Connection Lost",
          description: "The database connection has been lost. Some features may not work properly.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setIsServerHealthy(false)
      toast({
        title: "Server Unavailable",
        description: "Unable to connect to the server. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check server health periodically
    const healthCheckInterval = setInterval(checkServerHealth, 30000) // Every 30 seconds

    // Initial health check
    checkServerHealth()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(healthCheckInterval)
    }
  }, [])

  // Don't show anything if everything is working
  if (isOnline && isServerHealthy) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {!isOnline ? (
              <WifiOff className="h-5 w-5 text-red-500" />
            ) : !isServerHealthy ? (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            ) : (
              <Wifi className="h-5 w-5 text-green-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {!isOnline ? 'No Internet Connection' : 'Server Issues'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {!isOnline 
                ? 'Please check your internet connection.'
                : 'Database connection lost. Some features may not work properly.'
              }
            </p>
            <div className="mt-3">
              <button
                onClick={checkServerHealth}
                disabled={isChecking}
                className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                {isChecking ? 'Checking...' : 'Retry Connection'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectionStatus

