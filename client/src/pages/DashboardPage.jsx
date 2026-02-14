import React from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import {
  Package,
  DollarSign,
  Users,
  UserPlus,
  Settings
} from "lucide-react"

const DashboardPage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your Courier Management System</p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <button
              onClick={() => navigate('/shipments')}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Package className="h-6 w-6 text-blue-600 mb-2" />
              <p className="font-medium">Create Shipment</p>
              <p className="text-sm text-gray-500">Add new shipment</p>
            </button>

            <button
              onClick={() => navigate('/customers')}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <UserPlus className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-medium">Add Customer</p>
              <p className="text-sm text-gray-500">New customer</p>
            </button>

            <button
              onClick={() => navigate('/payments')}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <DollarSign className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-medium">Record Payment</p>
              <p className="text-sm text-gray-500">Add payment</p>
            </button>

            <button
              onClick={() => navigate('/employees')}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Users className="h-6 w-6 text-orange-600 mb-2" />
              <p className="font-medium">Add Employee</p>
              <p className="text-sm text-gray-500">New employee</p>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Settings className="h-6 w-6 text-indigo-600 mb-2" />
              <p className="font-medium">Edit User Profile</p>
              <p className="text-sm text-gray-500">Update profile</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Spacer to push logo down */}
      <div style={{ flex: 1 }} />

      {/* Company Logo Watermark */}
      <div className="flex justify-center items-center py-10">
        <div className="text-center opacity-30">
          <div className="flex items-center justify-center bg-blue-600 text-white font-bold rounded-lg h-24 w-24 mx-auto mb-3">
            <span className="text-2xl font-bold">QR24</span>
          </div>
          <p className="text-xl font-semibold text-gray-400">Quick Route 24</p>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
