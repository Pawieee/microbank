"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { IconUser, IconShieldLock, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

export default function AccountSettings() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [profile, setProfile] = useState({ full_name: "", username: "", role: "", created_at: "" });

    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

    useEffect(() => {
        fetch("/api/me")
            .then(res => res.json())
            .then(data => {
                setProfile(data);
                setLoading(false);
            });
    }, []);

    const handleUpdateProfile = async () => {
        setSubmitting(true);
        try {
            const res = await fetch("/api/me/update-profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: profile.full_name }),
            });
            if (!res.ok) throw new Error("Failed to update");

            localStorage.setItem("full_name", profile.full_name);
            toast.success("Profile updated successfully");
            window.location.reload(); // Refresh to update sidebar
        } catch (err) {
            toast.error("Error updating profile");
        } finally {
            setSubmitting(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            toast.error("New passwords do not match");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/me/change-password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: passwords.current,
                    new_password: passwords.new
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            toast.success("Password changed successfully");
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><IconLoader2 className="animate-spin" /></div>;

    return (
        <div className="w-full mx-auto py-8 px-4 md:px-12 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground">Manage your profile information and security credentials.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="profile" className="gap-2"><IconUser size={16} /> Profile</TabsTrigger>
                    <TabsTrigger value="security" className="gap-2"><IconShieldLock size={16} /> Security</TabsTrigger>
                </TabsList>

                {/* PROFILE TAB */}
                <TabsContent value="profile">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details visible to other staff.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input value={profile.username} disabled className="bg-muted/50 cursor-not-allowed" />
                                    <p className="text-[10px] text-muted-foreground">Username cannot be changed for audit purposes.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Role</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize px-3 py-1">{profile.role}</Badge>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Member Since</Label>
                                    <p className="text-sm font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t px-6 py-4 flex justify-end">
                            <Button onClick={handleUpdateProfile} disabled={submitting}>
                                {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm New Password</Label>
                                <Input
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t px-6 py-4 flex justify-end">
                            <Button onClick={handleChangePassword} disabled={submitting} className="bg-black">
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