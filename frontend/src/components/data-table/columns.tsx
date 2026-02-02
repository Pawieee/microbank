"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Copy,
  User,
  Building2,
  CreditCard,
  FileText,
  Pencil,
  Key,
  Trash,
  Info,
  CalendarClock,
  Wallet,
  CheckCheck,
  TrendingDown,
  AlertCircle,
  XCircle,
  Clock,
  CheckCircle2,
  Banknote // Imported Banknote for the new status
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
// SECTION 1: ACTIVE LOANS COLUMNS (Ongoing / Settled)
// ============================================================================

export type ActiveLoanData = {
  loan_id: string;
  applicant_name: string;
  email: string;
  amount: number;       // Total Loan Amount
  balance?: number;     // Remaining Balance
  next_due?: string;    // Date string
  due_amount?: number;  // Amount due next
  status: "approved" | "settled" | "past_due";
  date_applied: string;

  // Extended Metadata (Available in row data for actions/details view)
  credit_score?: number | string;
  monthly_income?: number;
  phone_num?: string;
  loan_purpose?: string;
  payment_schedule?: string;
  gender?: string;
  civil_status?: string;
  id_type?: string;
  id_image_data?: string;
  address?: string;
  disbursement_method?: string;
  disbursement_account_number?: string;
};

const ActiveStatusBadge = ({ status }: { status: string }) => {
  const s = status.toLowerCase();
  if (s === "settled") {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><CheckCheck size={12} /> Settled</Badge>;
  }
  if (s === "past_due") {
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1"><AlertCircle size={12} /> Overdue</Badge>;
  }
  // Default: Approved/Active
  return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><Wallet size={12} /> Active</Badge>;
};

export const activeLoanColumns: ColumnDef<ActiveLoanData>[] = [
  {
    accessorKey: "loan_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Loan ID" />,
    cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">#{row.getValue("loan_id")}</div>,
    filterFn: fuzzyFilter,
  },
  {
    accessorKey: "applicant_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Borrower" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-zinc-900">{row.original.applicant_name}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Account Status" />,
    cell: ({ row }) => <ActiveStatusBadge status={row.getValue("status")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "payment_info", // Virtual Column for Next Due
    header: "Next Payment",
    cell: ({ row }) => {
      const nextDue = row.original.next_due;
      const dueAmount = row.original.due_amount || 0;
      const isSettled = row.original.status === "settled";

      if (isSettled) return <span className="text-xs text-muted-foreground italic">Fully Paid</span>;

      return (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-50 rounded-full text-zinc-400">
            <CalendarClock size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-700">
              {nextDue ? new Date(nextDue).toLocaleDateString("en-PH", { month: 'short', day: 'numeric' }) : "N/A"}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
              Due: ₱{dueAmount.toLocaleString()}
            </p>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Principal" className="text-right justify-end" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const balance = row.original.balance ?? amount; // Fallback to amount if balance missing

      return (
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="font-bold text-zinc-900">₱{amount.toLocaleString()}</span>
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
            <TrendingDown size={12} />
            <span>Bal: ₱{balance.toLocaleString()}</span>
          </div>
        </div>
      );
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
              <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> View Ledger
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// ============================================================================
// SECTION 2: APPLICATIONS COLUMNS (Updated with Status Badge)
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
  remarks?: string;

  // Extended Metadata
  credit_score: number | string;
  monthly_income: number;
  loan_purpose: string;
  employment_status: string;
  payment_schedule: string;
  gender: string;
  civil_status: string;
  phone_num: string;
  address: string;
  id_type: string;
  id_image_data: string;
  disbursement_method: string;
  disbursement_account_number: string;
};

// 1. Helper for Method Icons
const MethodIcon = ({ method }: { method: string }) => {
  if (method?.includes("GCash") || method?.includes("Maya"))
    return <Wallet className="text-blue-500 h-3 w-3" />;
  if (method?.includes("Bank"))
    return <Building2 className="text-emerald-600 h-3 w-3" />;
  return <CreditCard className="text-orange-500 h-3 w-3" />;
};

// 2. NEW: Dedicated Application Status Badge with "For Release" support
const ApplicationStatusBadge = ({ status }: { status: string }) => {
  // Normalize casing just in case
  const s = status ? status.toLowerCase() : "pending";

  if (s === "rejected") {
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1"><XCircle size={12} /> Rejected</Badge>;
  }
  if (s === "approved") {
    return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><CheckCircle2 size={12} /> Active</Badge>;
  }
  // NEW: Handling the 'For Release' status
  if (s === "for release") {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><Banknote size={12} /> Ready for Release</Badge>;
  }
  // Default: Pending
  return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><Clock size={12} /> Pending Review</Badge>;
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
          <span className="text-xs text-muted-foreground">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
  // 3. APPLIED: Status Column with Badge
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <ApplicationStatusBadge status={row.getValue("status")} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "disbursement_method",
    header: "Disbursement",
    cell: ({ row }) => {
      const method = row.original.disbursement_method || "Cash Pickup";
      return (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">
            <MethodIcon method={method} />
          </div>
          <span className="text-sm text-zinc-700">{method}</span>
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
      const purpose = row.original.loan_purpose || "General";
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
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigator.clipboard.writeText(app.loan_id)}>
              <Copy className="mr-2 h-4 w-4 text-muted-foreground" /> Copy App ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-blue-600 font-medium cursor-pointer">
              <Info className="mr-2 h-4 w-4" /> View Details
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
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
  onEdit?: (user: UserData) => void;
  onReset?: (user: UserData) => void;
  onDelete?: (user: UserData) => void;
};

const RoleBadge = ({ role }: { role: string }) => {
  switch (role) {
    case 'admin': return <Badge className="bg-zinc-900 hover:bg-zinc-800 border-zinc-900">Admin</Badge>;
    case 'manager': return <Badge className="bg-blue-600 hover:bg-blue-500 border-blue-600">Manager</Badge>;
    case 'teller': return <Badge className="bg-emerald-600 hover:bg-emerald-500 border-emerald-600">Teller</Badge>;
    default: return <Badge variant="outline">{role}</Badge>;
  }
};

const StatusIndicator = ({ status }: { status: string }) => {
  switch (status) {
    case 'active':
      return <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-xs font-medium text-emerald-700">Active</span></div>;
    case 'suspended':
      return <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /><span className="text-xs font-medium text-red-700">Suspended</span></div>;
    case 'locked':
      return <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" /><span className="text-xs font-medium text-orange-700">Locked</span></div>;
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