import React, { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Badge } from "../components/ui/badge"
import { useDataStore } from "../stores/dataStore"
import { useToast } from "../lib/use-toast"
import { Plus, Search, Edit, Trash2 } from "lucide-react"

const CustomersPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    addresses: [{
      type: "default",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US"
    }]
  })

  const { customers, customersLoading, fetchCustomers, createCustomer } = useDataStore()
  const { toast } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleCreateCustomer = async (e) => {
    e.preventDefault()
    
    const result = await createCustomer(newCustomer)
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Customer created successfully!",
      })
      setIsCreateDialogOpen(false)
      setNewCustomer({
        name: "",
        company: "",
        email: "",
        phone: "",
        addresses: [{
          type: "default",
          line1: "",
          line2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "US"
        }]
      })
      fetchCustomers()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const filteredCustomers = (customers || []).filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            A list of all customers in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Addresses</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.company || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {customer.addresses?.length || 0} address(es)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to your system
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateCustomer} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newCustomer.company}
                  onChange={(e) => setNewCustomer({...newCustomer, company: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label>Address</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="line1">Address Line 1</Label>
                  <Input
                    id="line1"
                    value={newCustomer.addresses[0].line1}
                    onChange={(e) => setNewCustomer({
                      ...newCustomer,
                      addresses: [{
                        ...newCustomer.addresses[0],
                        line1: e.target.value
                      }]
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="line2">Address Line 2</Label>
                  <Input
                    id="line2"
                    value={newCustomer.addresses[0].line2}
                    onChange={(e) => setNewCustomer({
                      ...newCustomer,
                      addresses: [{
                        ...newCustomer.addresses[0],
                        line2: e.target.value
                      }]
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newCustomer.addresses[0].city}
                    onChange={(e) => setNewCustomer({
                      ...newCustomer,
                      addresses: [{
                        ...newCustomer.addresses[0],
                        city: e.target.value
                      }]
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newCustomer.addresses[0].state}
                    onChange={(e) => setNewCustomer({
                      ...newCustomer,
                      addresses: [{
                        ...newCustomer.addresses[0],
                        state: e.target.value
                      }]
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={newCustomer.addresses[0].postalCode}
                    onChange={(e) => setNewCustomer({
                      ...newCustomer,
                      addresses: [{
                        ...newCustomer.addresses[0],
                        postalCode: e.target.value
                      }]
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={newCustomer.addresses[0].country}
                    onChange={(e) => setNewCustomer({
                      ...newCustomer,
                      addresses: [{
                        ...newCustomer.addresses[0],
                        country: e.target.value
                      }]
                    })}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Customer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomersPage
