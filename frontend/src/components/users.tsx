"use client";

import { useState, useMemo } from "react";
import { useUsers, User } from "@/hooks/useUsers";
import { AccessDenied } from "./access-denied";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  IconSearch,
  IconDots,
  IconUserPlus,
  IconShieldLock,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconUser,
  IconKey,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming you have sonner or similar, if not replace with alert

export default function Users() {
  const { users, loading, error, refresh } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- MODAL STATES ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    password: "",
    role: "teller",
    status: "active",
  });

  // --- FILTERING ---
  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // --- HANDLERS ---

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("User created successfully");
      setIsCreateOpen(false);
      resetForm();
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            full_name: formData.full_name,
            role: formData.role,
            status: formData.status
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("User updated successfully");
      setIsEditOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.user_id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Password reset successfully");
      setIsResetOpen(false);
      setFormData(prev => ({ ...prev, password: "" }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/users/${user.user_id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("User deleted");
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
        full_name: user.full_name,
        username: user.username,
        password: "",
        role: user.role,
        status: user.status
    });
    setIsEditOpen(true);
  };

  const openReset = (user: User) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, password: "" }));
    setIsResetOpen(true);
  };

  const resetForm = () => {
    setFormData({
        full_name: "",
        username: "",
        password: "",
        role: "teller",
        status: "active"
    });
  };

  // --- RENDER HELPERS ---
  const getRoleBadge = (role: string) => {
    switch(role) {
        case 'admin': return <Badge className="bg-zinc-900 hover:bg-zinc-800">Admin</Badge>;
        case 'manager': return <Badge className="bg-blue-600 hover:bg-blue-500">Manager</Badge>;
        case 'teller': return <Badge className="bg-emerald-600 hover:bg-emerald-500">Teller</Badge>;
        default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'active': return <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="text-xs font-medium text-emerald-700">Active</span></div>;
        case 'suspended': return <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500"/><span className="text-xs font-medium text-red-700">Suspended</span></div>;
        case 'locked': return <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500"/><span className="text-xs font-medium text-orange-700">Locked</span></div>;
        default: return null;
    }
  };

  // --- MAIN RENDER ---

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (error && error.includes("403")) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-[1600px] mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system access, roles, and security settings.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="gap-2">
            <IconUserPlus size={18} />
            Add User
        </Button>
      </div>

      {/* TABLE CONTAINER */}
      <div className="border rounded-lg bg-card shadow-sm">
        
        {/* Toolbar */}
        <div className="p-4 border-b flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background"
                />
            </div>
            <Button variant="ghost" size="icon" onClick={refresh} title="Refresh">
                <IconRefresh size={18} />
            </Button>
        </div>

        <Table>
            <TableHeader>
                <TableRow className="bg-muted/50">
                    <TableHead>User Profile</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredUsers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No users found.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredUsers.map((user) => (
                        <TableRow key={user.user_id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-muted border flex items-center justify-center">
                                        <IconUser className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm text-foreground">{user.full_name}</span>
                                        <span className="text-xs text-muted-foreground font-mono">{user.username}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <IconDots className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => openEdit(user)}>
                                            <IconEdit className="mr-2 h-4 w-4" /> Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openReset(user)}>
                                            <IconKey className="mr-2 h-4 w-4" /> Reset Password
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDelete(user)} className="text-red-600 focus:text-red-600">
                                            <IconTrash className="mr-2 h-4 w-4" /> Delete Account
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>

      {/* --- DIALOGS --- */}

      {/* 1. CREATE USER DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new employee to the system. They will use the username and password to log in.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input 
                        placeholder="e.g. Juan Dela Cruz" 
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Username</Label>
                        <Input 
                            placeholder="e.g. teller.juan" 
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Role</Label>
                        <Select 
                            value={formData.role} 
                            onValueChange={(val) => setFormData({...formData, role: val})}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="teller">Teller</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>Temporary Password</Label>
                    <Input 
                        type="password"
                        placeholder="••••••••" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. EDIT USER DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update profile for {selectedUser?.username}. Note: Username cannot be changed.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input 
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Role</Label>
                        <Select 
                            value={formData.role} 
                            onValueChange={(val) => setFormData({...formData, role: val})}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="teller">Teller</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select 
                            value={formData.status} 
                            onValueChange={(val) => setFormData({...formData, status: val})}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="locked">Locked</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. RESET PASSWORD DIALOG */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                    Enter a new password for <span className="font-semibold text-foreground">{selectedUser?.username}</span>.
                    This will unlock their account if it was locked.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>New Password</Label>
                    <div className="relative">
                        <IconShieldLock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="text" // Visible so Admin can copy it
                            className="pl-9"
                            placeholder="Generate strong password..." 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
                <Button onClick={handleResetPassword} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-500">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset Password
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}