import React, { useEffect, useState, useRef } from 'react';
import { useCompanyStore } from '../stores/companyStore';
import { useToast } from '../lib/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Building2, Globe, Mail, Phone, Upload, Image as ImageIcon } from 'lucide-react';

const CompanySettingsPage = () => {
    const { company, fetchCompany, updateCompany, uploadLogo, isLoading } = useCompanyStore();
    const { toast } = useToast();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        email: '',
        phone: '',
        website: ''
    });

    useEffect(() => {
        fetchCompany();
    }, []);

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                address: company.address || '',
                email: company.email || '',
                phone: company.phone || '',
                website: company.website || ''
            });
        }
    }, [company]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await updateCompany(formData);
        if (result.success) {
            toast({ title: "Success", description: "Company details updated successfully" });
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error });
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: "destructive", title: "Error", description: "File size must be less than 5MB" });
            return;
        }

        const result = await uploadLogo(file);
        if (result.success) {
            toast({ title: "Success", description: "Logo uploaded successfully" });
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error || "Upload failed" });
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Company Settings</h2>
                <p className="text-muted-foreground">
                    Customize your application branding and details.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Logo Upload Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            Company Logo
                        </CardTitle>
                        <CardDescription>
                            Upload your company logo. This will be displayed in the sidebar and reports.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                        <div className="w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                            {company?.logoUrl ? (
                                <img
                                    src={company.logoUrl}
                                    alt="Company Logo"
                                    className="w-full h-full object-contain p-2"
                                    onLoad={() => console.log('Logo loaded successfully:', company.logoUrl)}
                                    onError={(e) => console.error('Logo failed to load:', company.logoUrl, e)}
                                />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <Building2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <span>No Logo</span>
                                </div>
                            )}

                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="h-4 w-4 mr-2" /> Change
                                </Button>
                            </div>
                        </div>

                        <div className="text-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleFileChange}
                            />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                <Upload className="h-4 w-4 mr-2" />
                                {isLoading ? "Uploading..." : "Upload Logo"}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Supported formats: PNG, JPG, WEBP. Max 5MB.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Company Details
                        </CardTitle>
                        <CardDescription>
                            Enter your business information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input id="name" value={formData.name} onChange={handleChange} placeholder="My Logistics Co." required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" value={formData.address} onChange={handleChange} placeholder="123 Business St, City" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input id="email" value={formData.email} onChange={handleChange} className="pl-9" placeholder="contact@example.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input id="phone" value={formData.phone} onChange={handleChange} className="pl-9" placeholder="+1234567890" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <div className="relative">
                                    <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input id="website" value={formData.website} onChange={handleChange} className="pl-9" placeholder="https://example.com" />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Details"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CompanySettingsPage;
