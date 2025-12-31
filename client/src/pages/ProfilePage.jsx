import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../lib/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { User, Lock, Mail, Shield } from 'lucide-react';

const ProfilePage = () => {
    const { user, updateProfile, isLoading } = useAuthStore();
    const { toast } = useToast();

    const [name, setName] = useState(user?.name || '');

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Name cannot be empty",
            });
            return;
        }

        const result = await updateProfile({ name });

        if (result.success) {
            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error,
            });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "New passwords do not match",
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Password must be at least 6 characters",
            });
            return;
        }

        const result = await updateProfile({
            currentPassword,
            newPassword
        });

        if (result.success) {
            toast({
                title: "Success",
                description: "Password changed successfully",
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error,
            });
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>
                            Update your personal details here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        id="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="pl-9 bg-gray-50"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <div className="relative">
                                    <Shield className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        id="role"
                                        value={user?.role || ''}
                                        disabled
                                        className="pl-9 bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your full name"
                                />
                            </div>

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Security Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Security
                        </CardTitle>
                        <CardDescription>
                            Change your password here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <Button type="submit" variant="secondary" disabled={isLoading}>
                                {isLoading ? "Updating..." : "Update Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;
