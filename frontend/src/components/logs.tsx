"use client";

import { useState, useEffect, useMemo } from "react";
import { useLogs } from "@/hooks/useLogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  const itemsPerPage = 15; 

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
        window.location.reload(); 
    }
  };

  const hasActiveFilters = filterDate || filterAction !== "ALL" || filterUser !== "ALL" || searchQuery;

  const getActionStyle = (action: string) => {
    const upperAction = action.toUpperCase();
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
      
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Security Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          View and filter system activities, access control events, and transaction history.
        </p>
      </div>

      <Card className="shadow-sm border-border bg-card">
        
        {/* TOOLBAR */}
        <CardHeader className="p-4 space-y-4">
           <div className="flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
             
             {/* LEFT: Search */}
             <div className="flex flex-1 gap-3 items-center w-full">
                <div className="relative flex-1 max-w-md">
                    <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs by user, action, or IP..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-background" 
                    />
                </div>
                <div className="hidden sm:flex h-9 items-center px-3 rounded-md border bg-muted/20 text-xs font-medium text-muted-foreground whitespace-nowrap">
                   {filteredLogs.length} Records
                </div>
             </div>

             {/* RIGHT: Filters */}
             <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                <input 
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <select 
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-[140px]"
                >
                    <option value="ALL">All Users</option>
                    {uniqueUsers.map(user => <option key={user} value={user}>{user}</option>)}
                </select>
                <select 
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-[140px]"
                >
                    <option value="ALL">All Actions</option>
                    {uniqueActions.map(action => <option key={action} value={action}>{action}</option>)}
                </select>

                <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>

                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                    className="h-9 w-9 p-0"
                >
                    {sortOrder === "desc" ? <IconSortDescending className="h-4 w-4" /> : <IconSortAscending className="h-4 w-4" />}
                </Button>

                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefresh}
                    className="h-9 w-9 p-0"
                    disabled={isRefreshing || loading}
                >
                    <IconRefresh className={`h-4 w-4 ${isRefreshing || loading ? "animate-spin" : ""}`} />
                </Button>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <IconX className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Clear</span>
                    </Button>
                )}
             </div>
           </div>
        </CardHeader>
        
        <CardContent className="p-0">
            {paginatedLogs.length === 0 ? (
                <div className="py-24 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <div className="p-4 bg-muted/50 rounded-full">
                        <IconFilter className="w-8 h-8 opacity-40"/>
                    </div>
                    <p className="text-sm font-medium">No logs found matching your criteria</p>
                    <Button variant="link" onClick={clearFilters} className="text-primary h-auto p-0">Clear active filters</Button>
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* VISUAL COLUMN HEADERS 
                       Added 'gap-4' here to match the data rows exactly.
                       Added 'shrink-0' to fixed widths to prevent flex squishing.
                    */}
                    <div className="flex items-center gap-4 px-4 py-3 bg-muted/40 border-y border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="w-[180px] shrink-0">Timestamp</div>
                        <div className="flex-1">Event Details</div>
                        <div className="w-[140px] shrink-0 text-right pr-2">User</div>
                    </div>

                    <div className="divide-y divide-border/40">
                        {paginatedLogs.map((log) => {
                            const style = getActionStyle(log.action);
                            return (
                                /* DATA ROW
                                   Matches header structure: flex, gap-4, px-4, specific widths 
                                */
                                <div key={log.id || Math.random()} className="flex items-center gap-4 py-3 px-4 hover:bg-muted/30 transition-colors group text-sm">
                                    
                                    {/* Column 1: Timestamp (Fixed 180px) */}
                                    <div className="flex items-center gap-3 w-[180px] shrink-0">
                                        <div className={`p-2 rounded-md border shrink-0 ${style.color}`}>
                                            {style.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">
                                                {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Column 2: Details (Flex-1) */}
                                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <Badge variant="outline" className={`${style.color} bg-opacity-10 w-fit border-opacity-40 font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 shrink-0`}>
                                            {log.action}
                                        </Badge>
                                        
                                        <span className="text-muted-foreground truncate group-hover:text-foreground transition-colors" title={log.details}>
                                            {log.details || "No details provided"}
                                        </span>
                                        
                                        {log.ip_address && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border w-fit font-mono shrink-0">
                                                <IconDeviceDesktop size={10} />
                                                {log.ip_address}
                                            </span>
                                        )}
                                    </div>

                                    {/* Column 3: User (Fixed 140px) */}
                                    <div className="flex items-center justify-end gap-3 w-[140px] shrink-0">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-medium text-foreground">{log.username}</p>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                                            <IconUser size={16} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </CardContent>

        {totalPages > 1 && (
            <div className="flex items-center justify-between py-3 px-4 border-t bg-muted/5">
                <p className="text-xs text-muted-foreground">
                    Showing page <span className="font-medium text-foreground">{currentPage}</span> of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="h-8 text-xs"
                    >
                        Previous
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="h-8 text-xs"
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