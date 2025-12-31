import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useDataStore } from '../../stores/dataStore';
import { useToast } from '../../lib/use-toast';
import { Loader2, Plus } from 'lucide-react';

const AddPaymentModal = ({ customerId, customerName, onSuccess }) => {
    const { toast } = useToast();
    const { recordPayment, customers, fetchCustomers } = useDataStore();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerId: customerId || '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        reference: '',
        notes: ''
    });

    // If customerId prop changes (e.g. from parent filter), update form
    useEffect(() => {
        if (customerId) {
            setFormData(prev => ({ ...prev, customerId }));
        }
    }, [customerId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.customerId) {
            toast({
                title: "Error",
                description: "Please select a customer",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            const result = await recordPayment({
                customerId: formData.customerId,
                amount: parseFloat(formData.amount),
                paymentDate: new Date(formData.paymentDate),
                paymentMethod: formData.paymentMethod,
                receiptNumber: formData.reference, // Mapping reference to receiptNumber
                notes: formData.notes
            });

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Payment recorded successfully",
                });
                setOpen(false);
                setFormData({
                    customerId: customerId || '',
                    amount: '',
                    paymentDate: new Date().toISOString().split('T')[0],
                    paymentMethod: 'CASH',
                    reference: '',
                    notes: ''
                });
                if (onSuccess) onSuccess();
            } else {
                toast({
                    title: "Error",
                    description: result.error || 'Failed to record payment',
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred",
                variant: "destructive"
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerChange = (val) => {
        setFormData({ ...formData, customerId: val });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Add a new payment record for {customerName ? customerName : 'a customer'}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">

                    {!customerId && (
                        <div className="grid gap-2">
                            <Label htmlFor="customer">Customer</Label>
                            <Select
                                value={formData.customerId}
                                onValueChange={handleCustomerChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name || c.personName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.paymentDate}
                            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="method">Payment Method</Label>
                        <Select
                            value={formData.paymentMethod}
                            onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                <SelectItem value="ONLINE">Online</SelectItem>
                                <SelectItem value="CREDIT">Credit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reference">Reference / Receipt #</Label>
                        <Input
                            id="reference"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddPaymentModal;
