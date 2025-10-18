import React, { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { useDataStore } from "../stores/dataStore"
import { formatCurrency } from "../lib/utils"
import LedgerComponent from "../components/LedgerComponent"
import { 
  Package, 
  FileText, 
  DollarSign, 
  Clock,
  TrendingUp,
  Users,
  Truck
} from "lucide-react"

const DashboardPage = () => {
  const { dashboardStats, fetchDashboardStats } = useDataStore()

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  const stats = [
    {
      title: "Total Shipments",
      value: dashboardStats.totalShipments,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Invoices",
      value: dashboardStats.totalInvoices,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(dashboardStats.totalRevenue),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Pending Payments",
      value: dashboardStats.pendingPayments,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your Courier Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest shipments and invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New Shipment Created</p>
                    <p className="text-xs text-gray-500">CMS-20250111-0001</p>
                  </div>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Invoice Generated</p>
                    <p className="text-xs text-gray-500">INV-2025-000001</p>
                  </div>
                </div>
                <Badge variant="outline">Unpaid</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Package className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium">Create Shipment</p>
                <p className="text-sm text-gray-500">Add new shipment</p>
              </button>
              
              <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                <FileText className="h-6 w-6 text-green-600 mb-2" />
                <p className="font-medium">Generate Invoice</p>
                <p className="text-sm text-gray-500">Create invoice</p>
              </button>
              
              <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Users className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium">Add Customer</p>
                <p className="text-sm text-gray-500">New customer</p>
              </button>
              
              <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
                <p className="font-medium">View Reports</p>
                <p className="text-sm text-gray-500">Analytics</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Summary */}
      <LedgerComponent showCustomerFilter={false} />
    </div>
  )
}

export default DashboardPage

