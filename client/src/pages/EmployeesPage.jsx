import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';
import { useToast } from '../lib/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

const EmployeesPage = () => {
    const { employees, fetchEmployees, createEmployee, updateEmployee, deleteEmployee, isLoading } = useAuthStore();
    const { fetchShipments } = useDataStore();
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [employeeShipmentCounts, setEmployeeShipmentCounts] = useState({});

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        isActive: true
    });

    useEffect(() => {
        fetchEmployees();
        fetchEmployeeShipmentCounts();
    }, []);

    // Fetch shipment counts for all employees
    const fetchEmployeeShipmentCounts = async () => {
        if (!employees || employees.length === 0) return;

        const counts = {};
        await Promise.all(
            employees.map(async (emp) => {
                try {
                    const result = await fetchShipments({ employeeId: emp.id });
                    counts[emp.id] = result.shipments?.length || 0;
                } catch (error) {
                    console.error(`Failed to fetch shipments for employee ${emp.id}:`, error);
                    counts[emp.id] = 0;
                }
            })
        );
        setEmployeeShipmentCounts(counts);
    };

    // Re-fetch shipment counts when employees change
    useEffect(() => {
        if (employees && employees.length > 0) {
            fetchEmployeeShipmentCounts();
        }
    }, [employees]);

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenDialog = (employee = null) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData({
                name: employee.name,
                email: employee.email,
                role: employee.role,
                isActive: employee.isActive,
                password: '' // Don't fill password on edit
            });
        } else {
            setEditingEmployee(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'EMPLOYEE',
                isActive: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || (!editingEmployee && !formData.password)) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please fill in all required fields",
            });
            return;
        }

        let result;
        if (editingEmployee) {
            const dataToUpdate = { ...formData };
            if (!dataToUpdate.password) delete dataToUpdate.password; // Only send password if changed
            result = await updateEmployee(editingEmployee.id, dataToUpdate);
        } else {
            result = await createEmployee(formData);
        }

        if (result.success) {
            toast({
                title: "Success",
                description: `Employee ${editingEmployee ? 'updated' : 'created'} successfully`,
            });
            setIsDialogOpen(false);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error,
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            const result = await deleteEmployee(id);
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Employee deleted successfully",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error,
                });
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
                    <p className="text-muted-foreground">
                        Manage system users and their roles.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Employee
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>No. of Shipments</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : filteredEmployees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No employees found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredEmployees.map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell className="font-medium">{emp.name}</TableCell>
                                    <TableCell>{emp.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={emp.role === 'ADMIN' ? 'default' : 'secondary'}>
                                            {emp.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={emp.isActive ? 'outline' : 'destructive'}>
                                            {emp.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {employeeShipmentCounts[emp.id] || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(emp)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(emp.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                        <DialogDescription>
                            {editingEmployee ? 'Update employee details.' : 'Create a new user account.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                                disabled={!!editingEmployee} // Disable email edit to prevent conflicts/complexity for now
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password {editingEmployee && '(Leave blank to keep current)'}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="USER">User</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.isActive.toString()}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : (editingEmployee ? 'Update' : 'Create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeesPage;
