"use client";

import { useState, useEffect, useMemo } from "react";
import { useLogs } from "@/hooks/useLogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconSearch,
  IconShieldLock,
  IconLogin,
  IconLogout,
  IconCashBanknote,
  IconActivity,
  IconFileDescription,
  IconUser,
  IconDeviceDesktop,
  IconFilter,
  IconSortDescending,
  IconSortAscending,
  IconX,
  IconRefresh 
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { AccessDenied } from "./access-denied";

export default function Logs() {
  const { data, loading, error, refetch } = useLogs();
  
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false); 
  const itemsPerPage = 15; // INCREASED ITEMS PER PAGE SINCE IT IS COMPACT

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterUser, setFilterUser] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // 1. Role Check
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      setIsForbidden(true);
    }
  }, []);

  // 2. Extract Unique Values
  const { uniqueActions, uniqueUsers } = useMemo(() => {
    if (!data) return { uniqueActions: [], uniqueUsers: [] };
    
    const actions = new Set(data.map(log => log.action));
    const users = new Set(data.map(log => log.username)); 

    return {
        uniqueActions: Array.from(actions).sort(),
        uniqueUsers: Array.from(users).sort()
    };
  }, [data]);

  // 3. Filter & Sort Logic
  const filteredLogs = useMemo(() => {
    const safeData = data || [];

    return safeData
      .filter((log) => {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch = 
          !searchQuery ||
          log.username.toLowerCase().includes(lowerQuery) ||
          log.action.toLowerCase().includes(lowerQuery) ||
          (log.details && log.details.toLowerCase().includes(lowerQuery)) ||
          (log.ip_address && log.ip_address.includes(lowerQuery));

        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        const matchesDate = !filterDate || logDate === filterDate;

        const matchesAction = filterAction === "ALL" || log.action === filterAction;
        const matchesUser = filterUser === "ALL" || log.username === filterUser;

        return matchesSearch && matchesDate && matchesAction && matchesUser;
      })
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [data, searchQuery, filterDate, filterAction, filterUser, sortOrder]);

  // 4. Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDate, filterAction, filterUser]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterDate("");
    setFilterAction("ALL");
    setFilterUser("ALL");
    setSortOrder("desc");
  };

  const handleRefresh = async () => {
    if (refetch) {
      setIsRefreshing(true);
      await refetch();
      setTimeout(() => setIsRefreshing(false), 500);
    } else {
        console.warn("useLogs hook does not return a refetch function");
        window.location.reload(); 
    }
  };

  const getActionStyle = (action: string) => {
    const upperAction = action.toUpperCase();
    // Using slightly smaller icon size (14) for compact view
    if (upperAction.includes("LOGIN")) return { color: "text-blue-600 bg-blue-50 border-blue-200", icon: <IconLogin size={14} /> };
    if (upperAction.includes("LOGOUT")) return { color: "text-slate-500 bg-slate-50 border-slate-200", icon: <IconLogout size={14} /> };
    if (upperAction.includes("DISBURSE") || upperAction.includes("PAYMENT")) return { color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <IconCashBanknote size={14} /> };
    if (upperAction.includes("UNAUTHORIZED") || upperAction.includes("REJECTED")) return { color: "text-red-600 bg-red-50 border-red-200", icon: <IconShieldLock size={14} /> };
    if (upperAction.includes("CREATE") || upperAction.includes("UPDATE")) return { color: "text-orange-600 bg-orange-50 border-orange-200", icon: <IconFileDescription size={14} /> };
    return { color: "text-slate-600 bg-slate-50 border-slate-200", icon: <IconActivity size={14} /> };
  };

  if (loading && !isForbidden && !data) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Syncing Audit Trail...</span>
      </div>
    );
  }

  if (isForbidden || (error && error.includes("403"))) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-[1600px] mx-auto">
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          Security Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitoring system activities, access control, and transaction history.
        </p>
      </div>

      <Card className="shadow-sm border-muted-foreground/10 bg-card">
        
        {/* HEADER */}
        <CardHeader className="py-3 px-4 border-b space-y-3">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
             <div className="flex items-center gap-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <IconActivity className="w-4 h-4" />
                    Activity Feed
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-medium px-1.5 h-5">
                    {filteredLogs.length} Events
                </Badge>
             </div>

             <div className="flex items-center gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-[280px]">
                    <IconSearch className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search logs..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 bg-background h-8 text-xs" 
                    />
                </div>
                
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefresh}
                    className="h-8 w-8 px-0"
                    title="Refresh Logs"
                    disabled={isRefreshing || loading}
                >
                    <IconRefresh className={`h-3.5 w-3.5 ${isRefreshing || loading ? "animate-spin" : ""}`} />
                </Button>

                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                    className="h-8 gap-1"
                >
                    {sortOrder === "desc" ? <IconSortDescending className="h-3.5 w-3.5" /> : <IconSortAscending className="h-3.5 w-3.5" />}
                </Button>
             </div>
           </div>

           <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <input 
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="h-8 w-[130px] rounded-md border border-input bg-background px-2 text-[10px] uppercase font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
                <select 
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="h-8 w-[130px] rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="ALL">All Users</option>
                    {uniqueUsers.map(user => <option key={user} value={user}>{user}</option>)}
                </select>
                <select 
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="h-8 w-[140px] rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="ALL">All Actions</option>
                    {uniqueActions.map(action => <option key={action} value={action}>{action}</option>)}
                </select>

                {(filterDate || filterAction !== "ALL" || filterUser !== "ALL" || searchQuery) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-muted-foreground hover:text-destructive">
                        <IconX className="h-3.5 w-3.5" />
                    </Button>
                )}
           </div>
        </CardHeader>
        
        {/* COMPACT CONTENT */}
        <CardContent className="p-0">
            {paginatedLogs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <IconFilter className="w-6 h-6 opacity-30"/>
                    <p className="text-xs">No records found</p>
                    <Button variant="link" onClick={clearFilters} className="text-primary h-auto p-0 text-xs">Clear filters</Button>
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {paginatedLogs.map((log) => {
                        const style = getActionStyle(log.action);
                        return (
                            // COMPACT ROW LAYOUT
                            <div key={log.id || Math.random()} className="flex items-center py-2 px-4 hover:bg-muted/30 transition-colors gap-3 group">
                                
                                {/* 1. Date & Icon (Narrower) */}
                                <div className="flex items-center gap-3 w-[160px] shrink-0">
                                    <div className={`p-1.5 rounded-lg border shadow-sm shrink-0 ${style.color}`}>
                                        {style.icon}
                                    </div>
                                    <div className="flex flex-col leading-none gap-0.5">
                                        <span className="text-xs font-semibold text-foreground">
                                            {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Action & Details (Fluid width) */}
                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                    <Badge variant="outline" className={`${style.color} bg-opacity-10 border-opacity-40 font-bold px-1.5 py-0 h-5 text-[10px] shrink-0`}>
                                        {log.action}
                                    </Badge>
                                    
                                    <p className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors" title={log.details}>
                                        {log.details || "-"}
                                    </p>
                                    
                                    {log.ip_address && (
                                        <span className="hidden xl:flex items-center gap-1 text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border shrink-0">
                                            <IconDeviceDesktop size={9} />
                                            {log.ip_address}
                                        </span>
                                    )}
                                </div>

                                {/* 3. User (Compact Right Align) */}
                                <div className="flex items-center justify-end gap-2 w-[140px] shrink-0">
                                    <div className="text-right hidden sm:block leading-tight">
                                        <p className="text-xs font-medium text-foreground">{log.username}</p>
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground">Admin</p>
                                    </div>
                                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                                        <IconUser size={12} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </CardContent>

        {totalPages > 1 && (
            <div className="flex items-center justify-between py-2 px-4 border-t bg-muted/5">
                <p className="text-[10px] font-medium text-muted-foreground">
                    Page <span className="text-foreground">{currentPage}</span> of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="h-7 text-[10px] px-2"
                    >
                        Prev
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="h-7 text-[10px] px-2"
                    >
                        Next
                    </Button>
                </div>
            </div>
        )}
      </Card>
    </div>
  );
}