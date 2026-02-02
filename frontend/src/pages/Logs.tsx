"use client";

import { useState, useEffect, useMemo } from "react";
import { useLogs } from "@/hooks/useLogs";
import { DataTable } from "@/components/data-table/data-table";
import { logColumns } from "@/components/data-table/columns";
import { AccessDenied } from "../components/shared/access-denied";
import { Button } from "@/components/ui/button";
import { IconAlertCircle } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { PaginationState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export default function Logs() {
    const { data, loading, error, refetch } = useLogs();

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 20,
    });
    const [isForbidden, setIsForbidden] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem("role");
        if (role !== "admin") {
            setIsForbidden(true);
        }
    }, []);

    // 1. FIX: Transform data to match the column type (id: number -> string)
    const tableData = useMemo(() => {
        return (data || []).map((log) => ({
            ...log,
            id: String(log.id), // Converts number ID to string to satisfy TypeScript
        }));
    }, [data]);

    // 2. GENERATE FILTERS (Use tableData now)
    const { actionOptions, userOptions } = useMemo(() => {
        if (!tableData) return { actionOptions: [], userOptions: [] };

        const uniqueActions = Array.from(new Set(tableData.map(log => log.action))).sort();
        const uniqueUsers = Array.from(new Set(tableData.map(log => log.username))).sort();

        return {
            actionOptions: uniqueActions.map(action => ({ label: action, value: action })),
            userOptions: uniqueUsers.map(user => ({ label: user, value: user }))
        };
    }, [tableData]);

    const handleRefresh = async () => {
        if (refetch) {
            setIsRefreshing(true);
            await refetch();
            setTimeout(() => setIsRefreshing(false), 500);
        } else {
            window.location.reload();
        }
    };

    if (isForbidden || (error && error.includes("403"))) {
        return <AccessDenied />;
    }

    if (loading && !tableData.length) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Syncing Audit Trail...</span>
            </div>
        );
    }

    if (error && !tableData.length) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-red-500">
                <div className="p-3 bg-red-50 rounded-full"><IconAlertCircle size={32} /></div>
                <p className="font-medium">Error loading logs: {error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1600px] mx-auto p-6 space-y-6">

            {/* HEADER: Cleaned up */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Audit Logs</h2>
                        <Badge variant="secondary" className="px-2 h-6 text-xs font-semibold">
                            {tableData.length} Events
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        System-wide security events, access logs, and transaction history.
                    </p>
                </div>
            </div>

            <DataTable
                columns={logColumns}
                data={tableData}
                pagination={pagination}
                onPaginationChange={setPagination}

                // ADDED REFRESH HERE
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}

                searchableColumns={["username", "action", "details"]}
                filterFields={[
                    { id: "action", title: "Action Type", options: actionOptions },
                    { id: "username", title: "System User", options: userOptions }
                ]}
            />
        </div>
    );
}