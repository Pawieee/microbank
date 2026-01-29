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
  IconCalendar,
  IconSortDescending,
  IconSortAscending,
  IconX,
  IconUsers
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { AccessDenied } from "./access-denied";

export default function Logs() {
  const { data, loading, error } = useLogs();
  
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterUser, setFilterUser] = useState("ALL"); // NEW: User Filter
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // 1. Role Check
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      setIsForbidden(true);
    }
  }, []);

  // 2. Extract Unique Values for Dropdowns
  const { uniqueActions, uniqueUsers } = useMemo(() => {
    if (!data) return { uniqueActions: [], uniqueUsers: [] };
    
    const actions = new Set(data.map(log => log.action));
    const users = new Set(data.map(log => log.username)); // Extract Users

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
        // A. Search Query Filter
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch = 
          !searchQuery ||
          log.username.toLowerCase().includes(lowerQuery) ||
          log.action.toLowerCase().includes(lowerQuery) ||
          (log.details && log.details.toLowerCase().includes(lowerQuery)) ||
          (log.ip_address && log.ip_address.includes(lowerQuery));

        // B. Date Filter
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        const matchesDate = !filterDate || logDate === filterDate;

        // C. Action Filter
        const matchesAction = filterAction === "ALL" || log.action === filterAction;

        // D. User Filter (NEW)
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

  const getActionStyle = (action: string) => {
    const upperAction = action.toUpperCase();
    if (upperAction.includes("LOGIN")) return { color: "text-blue-600 bg-blue-50 border-blue-200", icon: <IconLogin size={16} /> };
    if (upperAction.includes("LOGOUT")) return { color: "text-slate-500 bg-slate-50 border-slate-200", icon: <IconLogout size={16} /> };
    if (upperAction.includes("DISBURSE") || upperAction.includes("PAYMENT")) return { color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <IconCashBanknote size={16} /> };
    if (upperAction.includes("UNAUTHORIZED") || upperAction.includes("REJECTED")) return { color: "text-red-600 bg-red-50 border-red-200", icon: <IconShieldLock size={16} /> };
    if (upperAction.includes("CREATE") || upperAction.includes("UPDATE")) return { color: "text-orange-600 bg-orange-50 border-orange-200", icon: <IconFileDescription size={16} /> };
    return { color: "text-slate-600 bg-slate-50 border-slate-200", icon: <IconActivity size={16} /> };
  };

  // --- RENDER ---

  if (loading && !isForbidden) {
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
          <IconShieldLock className="w-6 h-6 text-primary" />
          Security Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitoring system activities, access control, and transaction history.
        </p>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        
        {/* Left: Filters */}
        <div className="flex flex-col lg:flex-row gap-3 w-full xl:w-auto">
           
           {/* Date Filter */}
           <div className="relative">
              <IconCalendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-10 w-full lg:w-[160px] rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
           </div>

           {/* User Filter (NEW) */}
           <div className="relative">
             <IconUsers className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
             <select 
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="h-10 w-full lg:w-[160px] appearance-none rounded-md border border-input bg-background pl-9 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
             >
                <option value="ALL">All Users</option>
                {uniqueUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                ))}
             </select>
           </div>

           {/* Action Filter */}
           <div className="relative">
             <IconFilter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
             <select 
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="h-10 w-full lg:w-[180px] appearance-none rounded-md border border-input bg-background pl-9 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
             >
                <option value="ALL">All Event Types</option>
                {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                ))}
             </select>
           </div>

           {/* Reset Button */}
           {(filterDate || filterAction !== "ALL" || filterUser !== "ALL" || searchQuery) && (
              <Button variant="ghost" size="icon" onClick={clearFilters} className="h-10 w-10 text-muted-foreground hover:text-destructive">
                 <IconX className="h-4 w-4" />
              </Button>
           )}
        </div>

        {/* Right: Search & Sort */}
        <div className="flex gap-3 w-full xl:w-auto">
           <Button 
             variant="outline" 
             onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
             className="gap-2 min-w-[130px] justify-between"
           >
             <span className="text-xs text-muted-foreground uppercase tracking-wider">Time</span>
             <div className="flex items-center gap-1">
                {sortOrder === "desc" ? "Newest" : "Oldest"}
                {sortOrder === "desc" ? <IconSortDescending className="h-4 w-4" /> : <IconSortAscending className="h-4 w-4" />}
             </div>
           </Button>

           <div className="relative flex-1 xl:w-[280px]">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search details or IP..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background" 
              />
           </div>
        </div>
      </div>

      {/* LOGS LIST */}
      <Card className="shadow-sm border-muted-foreground/10 bg-card">
        <CardHeader className="py-4 px-6 border-b bg-muted/5 flex flex-row items-center justify-between">
           <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <IconActivity className="w-4 h-4" />
              Activity Feed
           </CardTitle>
           <Badge variant="secondary" className="text-xs font-medium">
              {filteredLogs.length} Events
           </Badge>
        </CardHeader>
        
        <CardContent className="p-0">
            {paginatedLogs.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-3">
                    <div className="p-4 bg-muted/50 rounded-full border border-dashed"><IconFilter className="w-8 h-8 opacity-40"/></div>
                    <div>
                        <p className="font-medium">No records found</p>
                        <p className="text-sm opacity-70">Try adjusting your filters.</p>
                    </div>
                    <Button variant="link" onClick={clearFilters} className="text-primary mt-2">Clear all filters</Button>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {paginatedLogs.map((log) => {
                        const style = getActionStyle(log.action);
                        return (
                            <div key={log.id || Math.random()} className="flex flex-col md:flex-row md:items-center p-4 hover:bg-muted/30 transition-colors gap-4 group">
                                <div className="flex items-center gap-4 md:w-[220px] min-w-[200px]">
                                    <div className={`p-2.5 rounded-xl border shadow-sm ${style.color}`}>
                                        {style.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-foreground">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`${style.color} bg-opacity-10 border-opacity-40 font-bold px-2 py-0`}>
                                            {log.action}
                                        </Badge>
                                        {log.ip_address && (
                                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border">
                                                <IconDeviceDesktop size={10} />
                                                {log.ip_address}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors" title={log.details}>
                                        {log.details || "No details provided."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 md:w-[180px] md:justify-end border-t md:border-t-0 pt-3 md:pt-0 mt-1 md:mt-0">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-medium text-foreground">{log.username}</p>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">System User</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                                        <IconUser size={14} />
                                    </div>
                                    <div className="md:hidden">
                                        <p className="text-sm font-medium">{log.username}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </CardContent>

        {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-muted/5">
                <p className="text-xs font-medium text-muted-foreground">
                    Page <span className="text-foreground">{currentPage}</span> of {totalPages}
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