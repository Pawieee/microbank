"use client";

import { ColumnDef } from "@tanstack/react-table";
import { 
  MoreHorizontal, 
  Copy, 
  User, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Pencil, 
  Key, 
  Trash,
  Info 
} from "lucide-react";
import { fuzzyFilter } from "./data-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "./column-header";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// SECTION 1: LOANS COLUMNS (Active / Settled)
// ============================================================================

export type LoanData = {
  loan_id: string;
  applicant_name: string;
  applicant_id: number;
  email: string;
  amount: number;
  duration: number;
  status: string; 
  date_applied: string;
};

// Helper for Status Colors
const LoanStatusCell = ({ status }: { status: string }) => {
  const normalizedStatus = status.toLowerCase();
  
  let label = status;
  let colorClass = "bg-zinc-100 text-zinc-700 border-zinc-200"; 

  if (normalizedStatus === "approved") {
    label = "Active";
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (normalizedStatus === "settled") {
    label = "Settled";
    colorClass = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (normalizedStatus === "pending") {
    label = "Pending";
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (normalizedStatus === "rejected") {
    label = "Rejected";
    colorClass = "bg-red-50 text-red-700 border-red-200";
  }

  return (
    <Badge variant="outline" className={`${colorClass} font-medium border`}>
      {label}
    </Badge>
  );
};

export const loanColumns: ColumnDef<LoanData>[] = [
  {
    accessorKey: "loan_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Loan ID" />,
    filterFn: fuzzyFilter,
    cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("loan_id")}</div>,
  },
  {
    accessorKey: "applicant_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client Name" />,
    cell: ({ row }) => <div className="font-medium text-zinc-900">{row.original.applicant_name}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email Address" />,
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "duration",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Loan Term" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span>{row.getValue("duration")}</span>
        <span className="text-muted-foreground text-xs">mos.</span>
      </div>
    ),
    filterFn: (row, id, filterValue) => filterValue.includes(String(row.getValue(id))),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <LoanStatusCell status={row.getValue("status")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "date_applied",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date Applied" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("date_applied"));
      return <div className="text-muted-foreground">{date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</div>;
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Principal" className="text-right justify-end" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
      return <div className="text-right font-bold text-zinc-900">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const loan = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(loan.loan_id); }}>
              <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> View Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// ============================================================================
// SECTION 2: APPLICATIONS COLUMNS (Pending Review)
// ============================================================================

export type ApplicationData = {
  loan_id: string;
  applicant_name: string;
  applicant_id: number;
  email: string;
  amount: number;
  duration: number;
  status: string;
  date_applied: string;
  credit_score?: number | string; 
  monthly_income?: number;
  loan_purpose?: string;
};

const CreditScoreBadge = ({ score }: { score: any }) => {
  const numScore = Number(score);
  let colorClass = "bg-zinc-100 text-zinc-600";
  let label = "No Score";

  if (!score || isNaN(numScore)) {
    return <Badge variant="outline" className={colorClass}>N/A</Badge>;
  }

  if (numScore >= 700) {
    colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
    label = "Low Risk";
  } else if (numScore >= 600) {
    colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
    label = "Medium Risk";
  } else {
    colorClass = "bg-red-100 text-red-700 border-red-200";
    label = "High Risk";
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-mono font-bold text-xs">{numScore}</span>
      <Badge variant="outline" className={`${colorClass} text-[10px] h-5 px-1.5`}>
        {label}
      </Badge>
    </div>
  );
};

export const applicationColumns: ColumnDef<ApplicationData>[] = [
  {
    accessorKey: "loan_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="App ID" />,
    cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">#{row.getValue("loan_id")}</div>,
    filterFn: fuzzyFilter,
  },
  {
    accessorKey: "date_applied",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date Applied" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("date_applied"));
      return (
        <div className="flex flex-col">
            <span className="text-sm font-medium">{date.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span>
            <span className="text-xs text-muted-foreground">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "applicant_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Applicant" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-zinc-900">{row.original.applicant_name}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "financials", // Virtual Column for Risk Analysis
    header: "Financial Profile",
    cell: ({ row }) => {
        const income = row.original.monthly_income || 0;
        return (
            <div className="flex items-center gap-4">
                <div className="min-w-[80px]">
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-0.5">Credit Score</p>
                    <CreditScoreBadge score={row.original.credit_score} />
                </div>
                <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-0.5">Mo. Income</p>
                    <span className="font-medium text-sm">
                        {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(income)}
                    </span>
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Loan Request" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
      const purpose = row.original.loan_purpose || "Business";
      const term = row.original.duration;

      return (
        <div>
            <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-700">{formatted}</span>
                <span className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 border">{term} mos.</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <FileText size={10} />
                {purpose}
            </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const app = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Decision</DropdownMenuLabel>
            <DropdownMenuItem className="text-emerald-600 focus:text-emerald-700 font-medium cursor-pointer">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Disburse
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 focus:text-red-700 cursor-pointer">
              <XCircle className="mr-2 h-4 w-4" /> Reject Application
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
                <Info className="mr-2 h-4 w-4 text-muted-foreground" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(app.loan_id)} className="cursor-pointer">
              <Copy className="mr-2 h-4 w-4 text-muted-foreground" /> Copy App ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// ============================================================================
// SECTION 3: SYSTEM LOGS COLUMNS
// ============================================================================

export type LogData = {
  id?: string;
  timestamp: string;
  username: string;
  action: string;
  details: string;
  ip_address?: string;
};

const LogActionCell = ({ action }: { action: string }) => {
    let colorClass = "bg-zinc-100 text-zinc-700 border-zinc-200";
    
    // Normalize logic
    if (action.includes("LOGIN")) colorClass = "bg-blue-50 text-blue-700 border-blue-200";
    else if (action.includes("LOGOUT")) colorClass = "bg-slate-50 text-slate-700 border-slate-200";
    else if (action.includes("DISBURSE")) colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    else if (action.includes("REJECTED")) colorClass = "bg-red-50 text-red-700 border-red-200";
    else if (action.includes("UNAUTHORIZED")) colorClass = "bg-red-50 text-red-600 border-red-200 border-dashed";
    else if (action.includes("PAYMENT")) colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    else if (action.includes("CREATE") || action.includes("UPDATE")) colorClass = "bg-orange-50 text-orange-700 border-orange-200";

    return (
        <Badge variant="outline" className={`${colorClass} font-mono text-[10px] uppercase tracking-wide border`}>
            {action}
        </Badge>
    );
};

export const logColumns: ColumnDef<LogData>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date & Time" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("timestamp"));
      return (
        <div className="flex flex-col text-left"> 
            <span className="font-medium text-xs text-zinc-900">
                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: ({ column }) => <DataTableColumnHeader column={column} title="System User" />,
    cell: ({ row }) => (
        <div className="font-medium text-zinc-700 flex items-center gap-2">
            <User className="h-3 w-3 text-zinc-400" />
            {row.getValue("username") || "System"}
        </div>
    )
  },
  {
    accessorKey: "action",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Action Type" />,
    cell: ({ row }) => <LogActionCell action={row.getValue("action")} />,
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => (
        <div className="max-w-[500px] truncate text-muted-foreground text-xs" title={row.getValue("details")}>
            {row.getValue("details")}
        </div>
    ),
  },
];

// ============================================================================
// SECTION 4: USER MANAGEMENT COLUMNS
// ============================================================================

export type UserData = {
  user_id: number;
  full_name: string;
  username: string;
  role: string;
  status: string;
  last_login?: string | null;
  // We attach handlers here to let the column definition call page functions
  onEdit?: (user: UserData) => void;
  onReset?: (user: UserData) => void;
  onDelete?: (user: UserData) => void;
};

// Helper for Role Badges
const RoleBadge = ({ role }: { role: string }) => {
  switch (role) {
    case 'admin': return <Badge className="bg-zinc-900 hover:bg-zinc-800 border-zinc-900">Admin</Badge>;
    case 'manager': return <Badge className="bg-blue-600 hover:bg-blue-500 border-blue-600">Manager</Badge>;
    case 'teller': return <Badge className="bg-emerald-600 hover:bg-emerald-500 border-emerald-600">Teller</Badge>;
    default: return <Badge variant="outline">{role}</Badge>;
  }
};

// Helper for Status Indicators
const StatusIndicator = ({ status }: { status: string }) => {
  switch (status) {
    case 'active': 
      return <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="text-xs font-medium text-emerald-700">Active</span></div>;
    case 'suspended': 
      return <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500"/><span className="text-xs font-medium text-red-700">Suspended</span></div>;
    case 'locked': 
      return <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500"/><span className="text-xs font-medium text-orange-700">Locked</span></div>;
    default: return null;
  }
};

export const userColumns: ColumnDef<UserData>[] = [
  {
    accessorKey: "full_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="User Profile" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
            <User className="h-4 w-4 text-zinc-400" />
        </div>
        <div className="flex flex-col">
            <span className="font-medium text-sm text-zinc-900">{row.getValue("full_name")}</span>
            <span className="text-xs text-muted-foreground font-mono">{row.original.username}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => <RoleBadge role={row.getValue("role")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Account Status" />,
    cell: ({ row }) => <StatusIndicator status={row.getValue("status")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "last_login",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
    cell: ({ row }) => {
      const dateVal = row.getValue("last_login");
      if (!dateVal) return <span className="text-muted-foreground text-xs italic">Never</span>;
      return <div className="text-xs text-muted-foreground">{new Date(dateVal as string).toLocaleString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => user.onEdit?.(user)}>
              <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => user.onReset?.(user)}>
              <Key className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Reset Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => user.onDelete?.(user)} className="text-red-600 focus:text-red-600">
              <Trash className="mr-2 h-3.5 w-3.5" /> Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];