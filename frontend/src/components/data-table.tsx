/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  OnChangeFn,
  PaginationState,
  ColumnFiltersState,
  getFacetedRowModel,
  getFacetedUniqueValues,
  Row,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "./pagination-control";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { IconAdjustmentsHorizontal, IconSearch, IconFilter, IconRefresh } from "@tabler/icons-react";

export const fuzzyFilter = (row: Row<any>, columnId: string, value: string) => {
  const itemValue = row.getValue(columnId);
  return String(itemValue).toLowerCase().includes(value.toLowerCase());
};

// --- TYPES ---
export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface DataTableFilterField<TData> {
  id: keyof TData;
  title: string;
  options: FilterOption[];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  searchableColumns?: (keyof TData)[]; 
  filterFields?: DataTableFilterField<TData>[]; 
  
  // NEW: Refresh Props
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  pagination,
  onPaginationChange,
  searchableColumns = [],
  filterFields = [],
  onRefresh,
  isRefreshing = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const globalFilterFn = React.useCallback(
    (row: any, _columnId: string, value: string) => {
      const search = value.toLowerCase();
      const columnsToSearch = searchableColumns.length > 0 
        ? searchableColumns 
        : Object.keys(row.original);

      return columnsToSearch.some((key) => {
        const cellValue = String(row.original[key] || "").toLowerCase();
        return cellValue.includes(search);
      });
    },
    [searchableColumns]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: false,
  });

  return (
    <div className="space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* LEFT: Search & Filters */}
        <div className="flex flex-1 items-center space-x-2 w-full sm:w-auto">
          <div className="relative w-full sm:max-w-xs">
            <IconSearch className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-9 pl-9 text-xs lg:w-[300px]"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {filterFields.map((field) => {
              const column = table.getColumn(field.id as string);
              if (!column) return null;

              return (
                <DataTableFacetedFilter
                  key={String(field.id)}
                  column={column}
                  title={field.title}
                  options={field.options}
                />
              );
            })}
          </div>
        </div>

        {/* RIGHT: Actions & View Columns */}
        <div className="flex items-center gap-2 ml-auto">
            {/* NEW REFRESH BUTTON */}
            {onRefresh && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="h-9 lg:flex"
                >
                    <IconRefresh className={`mr-2 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            )}

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 lg:flex">
                <IconAdjustmentsHorizontal className="mr-2 h-3.5 w-3.5" />
                View
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                .getAllColumns()
                .filter(
                    (column) => column.getCanHide() && column.id !== "actions"
                )
                .map((column) => {
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-zinc-200">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-10 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-zinc-50/50 transition-colors data-[state=selected]:bg-zinc-50"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 text-sm border-b-0">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <IconFilter className="h-8 w-8 opacity-20" />
                    <p className="text-sm">No records found matching your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="py-2">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}