import React from "react"
import { Link, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  CreditCard, 
  Calculator,
  BarChart3, 
  Upload,
  LogOut,
  User
} from "lucide-react"
import { useAuthStore } from "../stores/authStore"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Shipments", href: "/shipments", icon: Package },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Ledger", href: "/ledger", icon: Calculator },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Bulk Import", href: "/bulk-import", icon: Upload },
]

const Sidebar = () => {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">CMS</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="border-t p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role || "Role"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout

