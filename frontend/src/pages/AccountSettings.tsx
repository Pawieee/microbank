/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { IconUser, IconShieldLock, IconLoader2, IconCheck, IconX, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useAccountSettings } from "@/hooks/useAccountSettings";
import { useAlert } from "@/context/alert-context";
import { cn } from "@/lib/utils";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/security"; // Use centralized utility

export default function AccountSettings() {
    const { profile, loading, submitting, updatePassword } = useAccountSettings();
    const { triggerAlert } = useAlert();

    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    
    // Visibility States
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Use shared validator
    const passwordStrength = validatePassword(passwords.new);

    const handlePasswordSubmit = async () => {
        // 1. Check Matching
        if (passwords.new !== passwords.confirm) {
            triggerAlert({ 
                title: "Validation Error", 
                description: "New passwords do not match.", 
                variant: "destructive" 
            });
            return;
        }
        
        // 2. Check Complexity using shared utility
        if (!passwordStrength.isValid) {
             triggerAlert({ 
                title: "Weak Password", 
                description: "Please follow all password requirements.", 
                variant: "destructive" 
            });
            return;
        }

        const success = await updatePassword(passwords.current, passwords.new);
        if (success) {
            setPasswords({ current: "", new: "", confirm: "" });
            // Reset visibility
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground"><IconLoader2 className="animate-spin mr-2" /> Loading profile...</div>;

    // Helper for input with toggle
    const PasswordInput = ({ 
        value, 
        onChange, 
        isVisible, 
        onToggle, 
        placeholder = "••••••••",
        className,
        disabled
    }: any) => (
        <div className="relative">
            <Input
                type={isVisible ? "text" : "password"}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                className={cn("pr-10", className)}
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
            >
                {isVisible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
        </div>
    );

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

                {/* PROFILE TAB */}
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
                                    <Input value={profile?.full_name || ""} disabled className="bg-muted/50 cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input value={profile?.username || ""} disabled className="bg-muted/50 cursor-not-allowed" />
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
                    </Card>
                </TabsContent>

                {/* SECURITY TAB */}
                <TabsContent value="security">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Ensure your account is using a strong, random password to stay secure.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label>Current Password</Label>
                                <PasswordInput 
                                    value={passwords.current}
                                    onChange={(e: any) => setPasswords({ ...passwords, current: e.target.value })}
                                    isVisible={showCurrent}
                                    onToggle={() => setShowCurrent(!showCurrent)}
                                    disabled={submitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <PasswordInput 
                                    value={passwords.new}
                                    onChange={(e: any) => setPasswords({ ...passwords, new: e.target.value })}
                                    isVisible={showNew}
                                    onToggle={() => setShowNew(!showNew)}
                                    disabled={submitting}
                                    className={cn(passwords.new && !passwordStrength.isValid && "border-amber-500 focus-visible:ring-amber-500")}
                                />
                                
                                {/* Password Strength Visualizer using shared requirements */}
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {PASSWORD_REQUIREMENTS.map((req) => (
                                        <div key={req.key} className={cn("text-[10px] flex items-center gap-1", 
                                            // @ts-expect-error key is keyof PasswordStrength
                                            passwordStrength[req.key] ? "text-emerald-600" : "text-zinc-400"
                                        )}>
                                            {/* @ts-expect-error key is keyof PasswordStrength */}
                                            {passwordStrength[req.key] ? <IconCheck size={10} /> : <IconX size={10} />} 
                                            {req.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm New Password</Label>
                                <PasswordInput 
                                    value={passwords.confirm}
                                    onChange={(e: any) => setPasswords({ ...passwords, confirm: e.target.value })}
                                    isVisible={showConfirm}
                                    onToggle={() => setShowConfirm(!showConfirm)}
                                    disabled={submitting}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t px-6 py-4 flex justify-end">
                            <Button 
                                onClick={handlePasswordSubmit} 
                                disabled={submitting || (passwords.new.length > 0 && !passwordStrength.isValid)} 
                                className="bg-zinc-900 hover:bg-zinc-800 text-white"
                            >
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