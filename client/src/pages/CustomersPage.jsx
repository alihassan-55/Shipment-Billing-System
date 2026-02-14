import React, { useState, useEffect, useMemo } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Badge } from "../components/ui/badge"
import { useDataStore } from "../stores/dataStore"
import { useToast } from "../lib/use-toast"
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { countries, searchCountries } from "../utils/countries"
import CustomerLedgerDialog from "../components/CustomerLedgerDialog"

const CustomersPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isLedgerDialogOpen, setIsLedgerDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [countrySearchTerm, setCountrySearchTerm] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

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

  const { customers, customersLoading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useDataStore()
  const { toast } = useToast()

  useEffect(() => {
    fetchCustomers({ page: currentPage, limit: pageSize, search: searchTerm })
  }, [fetchCustomers, currentPage, searchTerm])

  const handleCreateCustomer = async (e) => {
    e.preventDefault()

    const result = await createCustomer(newCustomer)

    if (result.success) {
      toast({
        title: "Success",
        description: "Customer created successfully!",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchCustomers({ page: currentPage, limit: pageSize, search: searchTerm })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleEditCustomer = async (e) => {
    e.preventDefault()

    const result = await updateCustomer(editingCustomer.id, editingCustomer)

    if (result.success) {
      toast({
        title: "Success",
        description: "Customer updated successfully!",
      })
      setIsEditDialogOpen(false)
      setEditingCustomer(null)
      fetchCustomers({ page: currentPage, limit: pageSize, search: searchTerm })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      const result = await deleteCustomer(customerId)

      if (result.success) {
        toast({
          title: "Success",
          description: "Customer deleted successfully!",
        })
        fetchCustomers({ page: currentPage, limit: pageSize, search: searchTerm })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    }
  }

  const resetForm = () => {
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
  }

  const openEditDialog = (customer) => {
    setEditingCustomer({
      ...customer,
      addresses: customer.addresses || [{
        type: "default",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US"
      }]
    })
    setIsEditDialogOpen(true)
  }

  const filteredCountries = useMemo(() => {
    return searchCountries(countrySearchTerm)
  }, [countrySearchTerm])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setShowSearchDropdown(true)

    try {
      const response = await fetchCustomers({ page: 1, limit: 10, search: searchTerm })
      setSearchResults(response.customers || [])
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)

    if (value.trim().length > 2) {
      // Auto-search as user types (debounced)
      const timeoutId = setTimeout(() => {
        handleSearch({ preventDefault: () => { } })
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer)
    setIsDetailDialogOpen(true)
    setShowSearchDropdown(false)
    setSearchTerm("")
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handleCustomerRowClick = (customer) => {
    setSelectedCustomerForLedger(customer)
    setIsLedgerDialogOpen(true)
  }

  const filteredCustomers = (customers || []).filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Enhanced Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
          <CardDescription>Type to search and select a customer to view details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, company, email, or phone..."
              value={searchTerm}
              onChange={handleSearchInputChange}
              className="pl-10"
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            />

            {/* Search Results Dropdown */}
            {showSearchDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="px-3 py-2 text-gray-500 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Searching...
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-500 border-b">
                      Found {searchResults.length} customer(s)
                    </div>
                    {searchResults.map((customer) => (
                      <div
                        key={customer.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">
                          {customer.company && `${customer.company} • `}
                          {customer.email && `${customer.email} • `}
                          {customer.phone}
                        </div>
                      </div>
                    ))}
                  </>
                ) : searchTerm.trim().length > 2 ? (
                  <div className="px-3 py-2 text-gray-500 text-center">
                    <div className="flex items-center justify-center">
                      <Search className="h-4 w-4 mr-2" />
                      No customers found
                    </div>
                  </div>
                ) : null}
              </div>
            )}
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
            <>
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
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleCustomerRowClick(customer)}
                    >
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
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredCustomers.length)} of {filteredCustomers.length} customers
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm">{currentPage}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage * pageSize >= filteredCustomers.length}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
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
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newCustomer.company}
                  onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
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
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
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
                <div className="relative">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={newCustomer.addresses[0].country}
                    onChange={(e) => {
                      setNewCustomer({
                        ...newCustomer,
                        addresses: [{
                          ...newCustomer.addresses[0],
                          country: e.target.value
                        }]
                      })
                      setCountrySearchTerm(e.target.value)
                      setShowCountryDropdown(true)
                    }}
                    onFocus={() => setShowCountryDropdown(true)}
                    placeholder="Search countries..."
                  />
                  {showCountryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredCountries.slice(0, 10).map((country) => (
                        <div
                          key={country.code}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setNewCustomer({
                              ...newCustomer,
                              addresses: [{
                                ...newCustomer.addresses[0],
                                country: country.code
                              }]
                            })
                            setCountrySearchTerm(country.name)
                            setShowCountryDropdown(false)
                          }}
                        >
                          {country.name} ({country.code})
                        </div>
                      ))}
                    </div>
                  )}
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

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>

          {editingCustomer && (
            <form onSubmit={handleEditCustomer} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-company">Company</Label>
                  <Input
                    id="edit-company"
                    value={editingCustomer.company}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="edit-line1">Address Line 1</Label>
                    <Input
                      id="edit-line1"
                      value={editingCustomer.addresses[0].line1}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        addresses: [{
                          ...editingCustomer.addresses[0],
                          line1: e.target.value
                        }]
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-line2">Address Line 2</Label>
                    <Input
                      id="edit-line2"
                      value={editingCustomer.addresses[0].line2}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        addresses: [{
                          ...editingCustomer.addresses[0],
                          line2: e.target.value
                        }]
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={editingCustomer.addresses[0].city}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        addresses: [{
                          ...editingCustomer.addresses[0],
                          city: e.target.value
                        }]
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-state">State</Label>
                    <Input
                      id="edit-state"
                      value={editingCustomer.addresses[0].state}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        addresses: [{
                          ...editingCustomer.addresses[0],
                          state: e.target.value
                        }]
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-postalCode">Postal Code</Label>
                    <Input
                      id="edit-postalCode"
                      value={editingCustomer.addresses[0].postalCode}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        addresses: [{
                          ...editingCustomer.addresses[0],
                          postalCode: e.target.value
                        }]
                      })}
                    />
                  </div>
                  <div className="relative">
                    <Label htmlFor="edit-country">Country</Label>
                    <Input
                      id="edit-country"
                      value={editingCustomer.addresses[0].country}
                      onChange={(e) => {
                        setEditingCustomer({
                          ...editingCustomer,
                          addresses: [{
                            ...editingCustomer.addresses[0],
                            country: e.target.value
                          }]
                        })
                        setCountrySearchTerm(e.target.value)
                        setShowCountryDropdown(true)
                      }}
                      onFocus={() => setShowCountryDropdown(true)}
                      placeholder="Search countries..."
                    />
                    {showCountryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredCountries.slice(0, 10).map((country) => (
                          <div
                            key={country.code}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setEditingCustomer({
                                ...editingCustomer,
                                addresses: [{
                                  ...editingCustomer.addresses[0],
                                  country: country.code
                                }]
                              })
                              setCountrySearchTerm(country.name)
                              setShowCountryDropdown(false)
                            }}
                          >
                            {country.name} ({country.code})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Customer</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Customer Details</DialogTitle>
                <DialogDescription>
                  View and manage customer information
                </DialogDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedCustomer) {
                      openEditDialog(selectedCustomer)
                      setIsDetailDialogOpen(false)
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedCustomer) {
                      handleDeleteCustomer(selectedCustomer.id)
                      setIsDetailDialogOpen(false)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <div className="text-lg font-semibold">{selectedCustomer.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Company</Label>
                  <div className="text-lg">{selectedCustomer.company || "-"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <div className="text-lg">{selectedCustomer.email || "-"}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <div className="text-lg">{selectedCustomer.phone || "-"}</div>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <Label className="text-sm font-medium text-gray-500">Addresses</Label>
                <div className="mt-2 space-y-3">
                  {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                    selectedCustomer.addresses.map((address, index) => (
                      <div key={address.id || index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{address.type || 'Default Address'}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {address.line1 && <div>{address.line1}</div>}
                              {address.line2 && <div>{address.line2}</div>}
                              <div>
                                {address.city && `${address.city}, `}
                                {address.state && `${address.state} `}
                                {address.postalCode && `${address.postalCode}`}
                              </div>
                              {address.country && <div>{address.country}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic">No addresses on file</div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer ID</Label>
                  <div className="text-sm font-mono">{selectedCustomer.id}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <div className="text-sm">
                    {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : "-"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Ledger Dialog */}
      <CustomerLedgerDialog
        customer={selectedCustomerForLedger}
        onClose={() => {
          setIsLedgerDialogOpen(false)
          setSelectedCustomerForLedger(null)
        }}
      />
    </div>
  )
}

export default CustomersPage
