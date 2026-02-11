/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/useUsers";
import { useAlert } from "@/context/alert-context"; // Added for error alerts
import { AccessDenied } from "@/components/shared/access-denied";
import { DataTable } from "@/components/data-table/data-table";
import { userColumns, UserData } from "@/components/data-table/columns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { IconUserPlus, IconShieldLock, IconEye, IconEyeOff } from "@tabler/icons-react"; // Added Icons
import { Loader2 } from "lucide-react";
import { PaginationState } from "@tanstack/react-table";
import { validatePassword } from "@/lib/security"; // Use centralized utility

// Helper interface for the form state
interface UserFormData {
    full_name: string;
    username: string;
    password: string;
    role: "admin" | "manager" | "teller";
    status: "active" | "suspended" | "locked";
}

export default function Users() {
    const {
        users, loading, error, isSubmitting, refresh,
        create, update: updateUser, resetPassword, remove
    } = useUsers();

    const { triggerAlert } = useAlert();

    // --- STATE ---
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);

    // Visibility States
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);

    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- FORM STATE ---
    const [formData, setFormData] = useState<UserFormData>({
        full_name: "",
        username: "",
        password: "",
        role: "teller",
        status: "active",
    });

    // --- HANDLERS ---
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const resetForm = () => {
        setFormData({
            full_name: "",
            username: "",
            password: "",
            role: "teller",
            status: "active"
        });
        setShowCreatePassword(false); // Reset visibility
        setShowResetPassword(false);
    };

    const handleCreate = async () => {
        // Validate Password
        const strength = validatePassword(formData.password);
        if (!strength.isValid) {
            triggerAlert({
                title: "Weak Password",
                description: "Password must have 8+ chars, Uppercase, Lowercase, Number, and Special Char.",
                variant: "destructive"
            });
            return;
        }

        const success = await create(formData);
        if (success) {
            setIsCreateOpen(false);
            resetForm();
        }
    };

    const handleUpdate = async () => {
        if (!selectedUser) return;
        const success = await updateUser(selectedUser.user_id, {
            full_name: formData.full_name,
            role: formData.role,
            status: formData.status
        });
        if (success) setIsEditOpen(false);
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;

        // Validate Password
        const strength = validatePassword(formData.password);
        if (!strength.isValid) {
            triggerAlert({
                title: "Weak Password",
                description: "Password must have 8+ chars, Uppercase, Lowercase, Number, and Special Char.",
                variant: "destructive"
            });
            return;
        }

        const success = await resetPassword(selectedUser.user_id, formData.password);
        if (success) {
            setIsResetOpen(false);
            setFormData(prev => ({ ...prev, password: "" }));
            setShowResetPassword(false);
        }
    };

    const handleDelete = async (user: UserData) => {
        await remove(user.user_id, user.username);
    };

    // --- ACTION TRIGGERS ---
    const openEdit = (user: UserData) => {
        setSelectedUser(user);
        setFormData({
            full_name: user.full_name,
            username: user.username,
            password: "",
            role: user.role as "admin" | "manager" | "teller",
            status: (user.status || "active") as "active" | "suspended" | "locked"
        });
        setIsEditOpen(true);
    };

    const openReset = (user: UserData) => {
        setSelectedUser(user);
        setFormData(prev => ({ ...prev, password: "" }));
        setIsResetOpen(true);
        setShowResetPassword(false);
    };

    // --- DATA PREP ---
    const tableData = useMemo(() => {
        return users.map((user) => {
            const safeUser: UserData = {
                ...user,
                status: (user.status || "active") as "active" | "suspended" | "locked",
                created_at: user.created_at, // ✅ Explicitly map this (though spread ...user handles it usually)
            } as UserData;

            return {
                ...safeUser,
                onEdit: () => openEdit(safeUser),
                onReset: () => openReset(safeUser),
                onDelete: () => handleDelete(safeUser)
            };
        });
    }, [users]);

    // --- RENDER ---

    if (loading && !users.length) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    if (error && error.includes("403")) return <AccessDenied />;

    return (
        <div className="flex flex-col gap-6 p-6 w-full max-w-[1600px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        User Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage system access, roles, and security settings.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="gap-2 h-9">
                        <IconUserPlus size={16} />
                        Add User
                    </Button>
                </div>
            </div>

            <DataTable
                columns={userColumns}
                data={tableData}
                pagination={pagination}
                onPaginationChange={setPagination}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                searchableColumns={["full_name", "username"]}
                filterFields={[
                    { id: "role", title: "Role", options: [{ label: "Admin", value: "admin" }, { label: "Manager", value: "manager" }, { label: "Teller", value: "teller" }] },
                    { id: "status", title: "Status", options: [{ label: "Active", value: "active" }, { label: "Suspended", value: "suspended" }, { label: "Locked", value: "locked" }] }
                ]}
            />

            {/* --- 1. CREATE DIALOG --- */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>Add a new employee to the system.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label>Full Name</Label><Input placeholder="e.g. Juan Dela Cruz" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Username</Label><Input placeholder="e.g. teller.juan" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Role</Label><Select value={formData.role} onValueChange={(val: any) => setFormData({ ...formData, role: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="teller">Teller</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Temporary Password</Label>
                            <div className="relative">
                                <Input
                                    type={showCreatePassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pr-10"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showCreatePassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- 2. EDIT DIALOG --- */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit User</DialogTitle><DialogDescription>Update profile for {selectedUser?.username}.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label>Full Name</Label><Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Role</Label><Select value={formData.role} onValueChange={(val: any) => setFormData({ ...formData, role: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="teller">Teller</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
                            <div className="grid gap-2"><Label>Status</Label><Select value={formData.status} onValueChange={(val: any) => setFormData({ ...formData, status: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="locked">Locked</SelectItem></SelectContent></Select></div>
                        </div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- 3. RESET PASSWORD DIALOG --- */}
            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reset Password</DialogTitle><DialogDescription>Enter a new password for <span className="font-semibold text-foreground">{selectedUser?.username}</span>.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>New Password</Label>
                            <div className="relative">
                                <IconShieldLock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                <Input
                                    type={showResetPassword ? "text" : "password"}
                                    className="pl-9 pr-10"
                                    placeholder="Generate strong password..."
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowResetPassword(!showResetPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showResetPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button><Button onClick={handleResetPassword} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-500">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reset Password</Button></DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}