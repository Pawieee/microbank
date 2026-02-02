/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { IconUser, IconShieldLock, IconLoader2 } from "@tabler/icons-react";
import { useAccountSettings } from "@/hooks/useAccountSettings";
import { useAlert } from "@/context/alert-context";

export default function AccountSettings() {
    // Removed 'updateName' as it is no longer needed
    const { profile, loading, submitting, updatePassword } = useAccountSettings();
    const { triggerAlert } = useAlert();

    // Local Form States
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

    const handlePasswordSubmit = async () => {
        if (passwords.new !== passwords.confirm) {
            triggerAlert({ 
                title: "Validation Error", 
                description: "New passwords do not match.", 
                variant: "destructive" 
            });
            return;
        }
        
        if (passwords.new.length < 6) {
             triggerAlert({ 
                title: "Validation Error", 
                description: "Password must be at least 6 characters.", 
                variant: "destructive" 
            });
            return;
        }

        const success = await updatePassword(passwords.current, passwords.new);
        if (success) {
            setPasswords({ current: "", new: "", confirm: "" });
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground"><IconLoader2 className="animate-spin mr-2" /> Loading profile...</div>;

    return (
        <div className="w-full mx-auto py-8 px-4 md:px-12 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Account Settings</h1>
                <p className="text-muted-foreground">Manage your profile information and security credentials.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="profile" className="gap-2"><IconUser size={16} /> Profile</TabsTrigger>
                    <TabsTrigger value="security" className="gap-2"><IconShieldLock size={16} /> Security</TabsTrigger>
                </TabsList>

                {/* PROFILE TAB - READ ONLY */}
                <TabsContent value="profile">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>View your personal details visible to other staff.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={profile?.full_name || ""}
                                        disabled
                                        className="bg-muted/50 cursor-not-allowed"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Contact an administrator to update your personal details.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input value={profile?.username || ""} disabled className="bg-muted/50 cursor-not-allowed" />
                                    <p className="text-[10px] text-muted-foreground">Username cannot be changed for audit purposes.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Role</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize px-3 py-1">{profile?.role || "N/A"}</Badge>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Member Since</Label>
                                    <p className="text-sm font-medium">
                                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        {/* Footer removed since there are no editable fields */}
                    </Card>
                </TabsContent>

                {/* SECURITY TAB */}
                <TabsContent value="security">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label>Current Password</Label>
                                <Input
                                    type="password"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    disabled={submitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                    disabled={submitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm New Password</Label>
                                <Input
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                    disabled={submitting}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t px-6 py-4 flex justify-end">
                            <Button onClick={handlePasswordSubmit} disabled={submitting} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                                {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}