"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconArrowUpRight,
  IconBan,
  IconCalculator,
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconClock,
  IconCopy,
  IconDotsVertical,
  IconExternalLink,
  IconEye,
  IconFilter,
  IconGripVertical,
  IconLayoutColumns,
  IconPaperclip,
  IconReceipt2,
  IconSearch,
  IconUsers,
  IconX,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const transferTaxDetailSchema = z.object({
  id: z.string(),
  transferee: z.string().optional().nullable(),
  transferor: z.string().optional().nullable(),
  transactionType: z.string().optional().nullable(),
  taxDecNo: z.string().optional().nullable(),
  lotNo: z.string().optional().nullable(),
  area: z.number().optional().nullable(),
  marketValue: z.number().optional().nullable(),
  considerationValue: z.number().optional().nullable(),
  taxBase: z.number().optional().nullable(),
  transferTaxDue: z.number().optional().nullable(),
  surcharge: z.number().optional().nullable(),
  interest: z.number().optional().nullable(),
  totalDue: z.number().optional().nullable(),
})

export const schema = z.object({
  id: z.number(),
  taxId: z.string().optional(),
  controlNo: z.string(),
  transferee: z.string(),
  transferor: z.string(),
  allTransferees: z.array(z.string()).optional(),
  allTransferors: z.array(z.string()).optional(),
  transactionType: z.string(),
  notarialDoc: z.string(),
  notarialDocNumber: z.string(),
  notarialDocUrl: z.string().nullable().optional(),
  notarizedBy: z.string().nullable().optional(),
  notarialId: z.string().optional(),
  dateComputed: z.string(),
  validityDate: z.string().nullable().optional(),
  daysElapsed: z.number().optional(),
  status: z.string(),
  paymentStatus: z.string().optional(),
  amountDue: z.number(),
  marketValue: z.number().optional(),
  taxBase: z.number().optional(),
  surcharge: z.number().optional(),
  interest: z.number().optional(),
  assessor: z.string(),
  assessorEmail: z.string().optional(),
  assessorDesignation: z.string().optional(),
  propertiesCount: z.number().optional(),
  details: z.array(transferTaxDetailSchema).optional(),
})

export type TransferTaxRow = z.infer<typeof schema>

// Drag Handle Component
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3.5" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// Columns definition
const columns: ColumnDef<TransferTaxRow>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "controlNo",
    header: "Control No.",
    cell: ({ row }) => {
      const notarialId = row.original.notarialId
      return (
        <div className="flex items-center gap-1.5">
          {notarialId ? (
            <Link
              href={`/newTransferTax/summary/${notarialId}`}
              className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400"
              title="View Computation Sheet"
            >
              {row.original.controlNo}
            </Link>
          ) : (
            <span className="font-mono text-xs font-semibold">
              {row.original.controlNo}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "transferee",
    header: "Transferee / Transferor",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "transactionType",
    header: "Transaction Type",
    cell: ({ row }) => {
      const type = row.original.transactionType || "Transfer Tax"
      return (
        <Badge
          variant="outline"
          className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 whitespace-nowrap bg-muted/40"
        >
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "notarialDoc",
    header: "Notarial Document",
    cell: ({ row }) => {
      return (
        <div className="max-w-[200px] truncate">
          <div className="font-medium text-xs truncate flex items-center gap-1">
            <span className="truncate">{row.original.notarialDoc}</span>
            {row.original.notarialDocUrl && (
              <a
                href={row.original.notarialDocUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:text-blue-700 inline-flex shrink-0"
                title="View PDF Attachment"
              >
                <IconPaperclip className="size-3.5" />
              </a>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {row.original.notarialDocNumber}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "dateComputed",
    header: "Date Computed",
    cell: ({ row }) => {
      const dateVal = row.original.dateComputed
      let formattedDate = "N/A"
      try {
        formattedDate = format(new Date(dateVal), "MMM d, yyyy")
      } catch {
        formattedDate = dateVal
      }
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
          <IconClock className="size-3.5 text-muted-foreground/70" />
          <span>{formattedDate}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.original.status || "pending").toLowerCase()
      const paymentStatus = (row.original.paymentStatus || "").toLowerCase()
      const isPaid = status === "paid" || paymentStatus === "paid"
      const isVoided = status === "voided" || paymentStatus === "voided"

      if (isPaid) {
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs px-2 py-0.5 font-medium flex items-center gap-1 w-fit">
            <IconCircleCheckFilled className="size-3 text-emerald-500" />
            Paid
          </Badge>
        )
      }

      if (isVoided) {
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs px-2 py-0.5 font-medium flex items-center gap-1 w-fit">
            <IconBan className="size-3 text-rose-500" />
            Voided
          </Badge>
        )
      }

      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs px-2 py-0.5 font-medium flex items-center gap-1 w-fit">
          <IconClock className="size-3 text-amber-500" />
          Unpaid
        </Badge>
      )
    },
  },
  {
    accessorKey: "amountDue",
    header: () => <div className="w-full text-right">Amount Due</div>,
    cell: ({ row }) => {
      const amt = Number(row.original.amountDue || 0)
      return (
        <div className="text-right font-mono font-bold text-xs tabular-nums text-foreground">
          ₱{amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )
    },
  },
  {
    accessorKey: "taxBase",
    header: () => <div className="w-full text-right">Tax Base</div>,
    cell: ({ row }) => {
      const base = Number(row.original.taxBase || row.original.marketValue || 0)
      return (
        <div className="text-right font-mono text-xs tabular-nums text-muted-foreground">
          ₱{base.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )
    },
  },
  {
    accessorKey: "assessor",
    header: "Assessor",
    cell: ({ row }) => {
      const name = row.original.assessor || "Assessor"
      const designation = row.original.assessorDesignation || "Assessor"
      return (
        <div className="max-w-[150px] truncate">
          <div className="text-xs font-medium truncate">{name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{designation}</div>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {item.notarialId && (
              <DropdownMenuItem asChild>
                <Link
                  href={`/newTransferTax/summary/${item.notarialId}`}
                  className="cursor-pointer flex items-center"
                >
                  <IconExternalLink className="mr-2 size-4 text-blue-500" />
                  Computation Sheet
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(item.controlNo)
                toast.success(`Copied ${item.controlNo} to clipboard`)
              }}
              className="cursor-pointer"
            >
              <IconCopy className="mr-2 size-4 text-muted-foreground" />
              Copy Control No.
            </DropdownMenuItem>
            {item.notarialDocUrl && (
              <DropdownMenuItem asChild>
                <a
                  href={item.notarialDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer flex items-center"
                >
                  <IconPaperclip className="mr-2 size-4 text-muted-foreground" />
                  View PDF Document
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Draggable Row
function DraggableRow({ row }: { row: Row<TransferTaxRow> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

// Main DataTable component with 3 Cards UI
export function DataTable({
  data: initialData,
}: {
  data: TransferTaxRow[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("all")
  const [selectedUserMonth, setSelectedUserMonth] = React.useState<string>("all")
  const [applyMonthToTable, setApplyMonthToTable] = React.useState<boolean>(false)

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  // Synchronize when initialData changes
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Extract available months from data
  const availableMonths = React.useMemo(() => {
    const monthsMap: Record<string, { key: string; label: string; date: Date }> = {}
    data.forEach((item) => {
      if (!item.dateComputed) return
      try {
        const d = new Date(item.dateComputed)
        if (!isNaN(d.getTime())) {
          const key = format(d, "yyyy-MM")
          if (!monthsMap[key]) {
            monthsMap[key] = {
              key,
              label: format(d, "MMMM yyyy"),
              date: d,
            }
          }
        }
      } catch {
        // ignore invalid date
      }
    })

    return Object.values(monthsMap).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    )
  }, [data])

  // Compute 3 Cards Statistics
  const summaryStats = React.useMemo(() => {
    const totalCount = data.length

    const paidTaxes = data.filter(
      (t) => t.status === "paid" || t.paymentStatus === "paid"
    )
    const voidedTaxes = data.filter(
      (t) => t.status === "voided" || t.paymentStatus === "voided"
    )
    const unpaidTaxes = data.filter(
      (t) =>
        t.status !== "paid" &&
        t.paymentStatus !== "paid" &&
        t.status !== "voided" &&
        t.paymentStatus !== "voided"
    )

    const paidCount = paidTaxes.length
    const paidAmount = paidTaxes.reduce(
      (sum, t) => sum + Number(t.amountDue || 0),
      0
    )

    const unpaidCount = unpaidTaxes.length
    const unpaidAmount = unpaidTaxes.reduce(
      (sum, t) => sum + Number(t.amountDue || 0),
      0
    )

    const voidedCount = voidedTaxes.length
    const voidedAmount = voidedTaxes.reduce(
      (sum, t) => sum + Number(t.amountDue || 0),
      0
    )

    const totalAmount = data.reduce(
      (sum, t) => sum + Number(t.amountDue || 0),
      0
    )
    const activeTotalAmount = paidAmount + unpaidAmount

    return {
      totalCount,
      paidCount,
      paidAmount,
      unpaidCount,
      unpaidAmount,
      voidedCount,
      voidedAmount,
      totalAmount,
      activeTotalAmount,
    }
  }, [data])

  // Compute User Statistics based on selected month filter
  const userStats = React.useMemo(() => {
    const monthData =
      selectedUserMonth === "all"
        ? data
        : data.filter((t) => {
            if (!t.dateComputed) return false
            try {
              return format(new Date(t.dateComputed), "yyyy-MM") === selectedUserMonth
            } catch {
              return false
            }
          })

    const periodTotalCount = monthData.length
    const periodTotalAmount = monthData.reduce(
      (sum, t) => sum + Number(t.amountDue || 0),
      0
    )

    const userMap: Record<
      string,
      { name: string; designation: string; count: number; totalAmount: number }
    > = {}

    monthData.forEach((t) => {
      const userName = t.assessor || "Unknown Assessor"
      if (!userMap[userName]) {
        userMap[userName] = {
          name: userName,
          designation: t.assessorDesignation || "Assessor",
          count: 0,
          totalAmount: 0,
        }
      }
      userMap[userName].count += 1
      userMap[userName].totalAmount += Number(t.amountDue || 0)
    })

    const userBreakdown = Object.values(userMap).sort(
      (a, b) => b.count - a.count
    )

    const selectedMonthObj = availableMonths.find((m) => m.key === selectedUserMonth)
    const selectedMonthLabel = selectedMonthObj ? selectedMonthObj.label : "All-Time"

    return {
      monthData,
      periodTotalCount,
      periodTotalAmount,
      userBreakdown,
      activeStaffCount: userBreakdown.length,
      selectedMonthLabel,
    }
  }, [data, selectedUserMonth, availableMonths])

  // Filter data according to active tab, search query, and optional month filter
  const filteredData = React.useMemo(() => {
    let result = data

    // Optional sync with card month filter
    if (applyMonthToTable && selectedUserMonth !== "all") {
      result = result.filter((t) => {
        if (!t.dateComputed) return false
        try {
          return format(new Date(t.dateComputed), "yyyy-MM") === selectedUserMonth
        } catch {
          return false
        }
      })
    }

    // Tab filter
    if (activeTab === "paid") {
      result = result.filter(
        (t) => t.status === "paid" || t.paymentStatus === "paid"
      )
    } else if (activeTab === "unpaid") {
      result = result.filter(
        (t) =>
          t.status !== "paid" &&
          t.paymentStatus !== "paid" &&
          t.status !== "voided" &&
          t.paymentStatus !== "voided"
      )
    } else if (activeTab === "voided") {
      result = result.filter(
        (t) => t.status === "voided" || t.paymentStatus === "voided"
      )
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.controlNo.toLowerCase().includes(q) ||
          t.transferee.toLowerCase().includes(q) ||
          t.transferor.toLowerCase().includes(q) ||
          t.transactionType.toLowerCase().includes(q) ||
          t.notarialDoc.toLowerCase().includes(q) ||
          t.assessor.toLowerCase().includes(q)
      )
    }

    return result
  }, [data, activeTab, searchQuery, applyMonthToTable, selectedUserMonth])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData?.map(({ id }) => id) || [],
    [filteredData]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((prevData) => {
        const oldIndex = prevData.findIndex((d) => d.id === active.id)
        const newIndex = prevData.findIndex((d) => d.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return prevData
        return arrayMove(prevData, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 3 CARDS UI */}
      <div className="px-4 lg:px-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1st Card: Total number of Transfer Tax Computation */}
        <Card className="relative overflow-hidden border bg-gradient-to-br from-card via-card to-blue-500/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                Total Transfer Tax Computations
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                All assessed transactions
              </CardDescription>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <IconCalculator className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight font-mono text-foreground">
                {summaryStats.totalCount}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Total Computations
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t text-xs">
              <Badge
                variant="outline"
                className="text-[11px] font-normal border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5"
              >
                {summaryStats.paidCount + summaryStats.unpaidCount} Active
              </Badge>
              {summaryStats.voidedCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[11px] font-normal border-muted text-muted-foreground"
                >
                  {summaryStats.voidedCount} Voided
                </Badge>
              )}
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                ₱{summaryStats.totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 2nd Card: Paid vs Unpaid Computation counts and amounts */}
        <Card className="relative overflow-hidden border bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                Paid vs. Unpaid Computations
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Status breakdown & collections
              </CardDescription>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconReceipt2 className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3 divide-x divide-border">
              {/* Paid */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Paid ({summaryStats.paidCount})
                  </span>
                </div>
                <div className="text-base font-bold font-mono tracking-tight text-emerald-700 dark:text-emerald-300">
                  ₱{summaryStats.paidAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {summaryStats.totalCount > 0
                    ? ((summaryStats.paidCount / summaryStats.totalCount) * 100).toFixed(0)
                    : 0}
                  % of total count
                </div>
              </div>

              {/* Unpaid */}
              <div className="pl-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Unpaid ({summaryStats.unpaidCount})
                  </span>
                </div>
                <div className="text-base font-bold font-mono tracking-tight text-amber-700 dark:text-amber-300">
                  ₱{summaryStats.unpaidAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {summaryStats.totalCount > 0
                    ? ((summaryStats.unpaidCount / summaryStats.totalCount) * 100).toFixed(0)
                    : 0}
                  % pending payment
                </div>
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>Collection Realization:</span>
              <span className="font-semibold text-foreground">
                {summaryStats.activeTotalAmount > 0
                  ? `${((summaryStats.paidAmount / summaryStats.activeTotalAmount) * 100).toFixed(1)}%`
                  : "0.0%"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 3rd Card: Total Computed by User */}
        <Card className="relative overflow-hidden border bg-gradient-to-br from-card via-card to-purple-500/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground truncate">
                  Total Computed by User
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                {selectedUserMonth === "all"
                  ? "All-time staff workload & volume"
                  : `Workload in ${userStats.selectedMonthLabel}`}
              </CardDescription>
            </div>

            {/* Filter by Month Select Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Select
                value={selectedUserMonth}
                onValueChange={(val) => {
                  setSelectedUserMonth(val)
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="h-7 text-xs px-2 py-0 min-w-[115px] bg-background/80 border-purple-500/20 hover:border-purple-500/40 focus:ring-purple-500/20"
                >
                  <IconCalendar className="size-3 text-purple-600 dark:text-purple-400 mr-1 shrink-0" />
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent align="end" className="text-xs">
                  <SelectItem value="all" className="text-xs font-medium">
                    All Months
                  </SelectItem>
                  {availableMonths.map((m) => (
                    <SelectItem key={m.key} value={m.key} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-2 flex-1 flex flex-col justify-between">
            {/* Top Key Metrics for the Period */}
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight font-mono text-foreground">
                  {userStats.periodTotalCount}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {selectedUserMonth === "all" ? "Total Comps" : "Monthly Comps"}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-semibold text-purple-700 dark:text-purple-300">
                  ₱{userStats.periodTotalAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <div className="text-[10px] text-muted-foreground">
                  Total Assessed
                </div>
              </div>
            </div>

            {/* User Breakdown List */}
            {userStats.userBreakdown.length === 0 ? (
              <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground bg-muted/20 my-auto">
                No assessor activity in {userStats.selectedMonthLabel}
              </div>
            ) : (
              <div className="max-h-[110px] overflow-y-auto space-y-2 pr-1 divide-y divide-border/40">
                {userStats.userBreakdown.map((u, idx) => {
                  const initials = u.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                  const sharePct =
                    userStats.periodTotalCount > 0
                      ? Math.round((u.count / userStats.periodTotalCount) * 100)
                      : 0

                  return (
                    <div
                      key={idx}
                      className="pt-1.5 first:pt-0 space-y-1 group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                            {initials}
                          </div>
                          <div className="truncate">
                            <div className="font-medium text-foreground truncate flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {idx === 0 && userStats.userBreakdown.length > 1 && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-4 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5"
                                >
                                  Top
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {u.designation}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <Badge
                              variant="secondary"
                              className="font-mono text-[11px] px-1.5 py-0 h-5"
                            >
                              {u.count} {u.count === 1 ? "comp." : "comps."}
                            </Badge>
                            <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">
                              {sharePct}%
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            ₱{u.totalAmount.toLocaleString("en-US", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Visual Progress Bar for Workload Share */}
                      <div className="w-full bg-muted/60 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-purple-600 dark:bg-purple-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(4, sharePct)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer with Staff Count & Apply to Table Toggle */}
            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span>Active Staff:</span>
                <span className="font-semibold text-foreground font-mono">
                  {userStats.activeStaffCount}{" "}
                  {userStats.activeStaffCount === 1 ? "Assessor" : "Assessors"}
                </span>
              </div>

              {selectedUserMonth !== "all" && (
                <Button
                  type="button"
                  variant={applyMonthToTable ? "default" : "outline"}
                  size="sm"
                  onClick={() => setApplyMonthToTable((prev) => !prev)}
                  className={`h-6 text-[10px] px-2 gap-1 rounded-md transition-all ${
                    applyMonthToTable
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "border-purple-500/30 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  }`}
                  title={
                    applyMonthToTable
                      ? "Remove month filter from table"
                      : "Filter table records by this month"
                  }
                >
                  <IconFilter className="size-2.5" />
                  <span>{applyMonthToTable ? "Table Filtered" : "Filter Table"}</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE TABS & CONTROLS */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val)
          table.setPageIndex(0)
        }}
        className="w-full flex-col justify-start gap-4"
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-4 lg:px-6">
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 flex w-fit">
            <TabsTrigger value="all" className="gap-1.5">
              All Computations
              <Badge variant="secondary">{summaryStats.totalCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-1.5">
              Paid
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                {summaryStats.paidCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unpaid" className="gap-1.5">
              Unpaid
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
                {summaryStats.unpaidCount}
              </Badge>
            </TabsTrigger>
            {summaryStats.voidedCount > 0 && (
              <TabsTrigger value="voided" className="gap-1.5">
                Voided
                <Badge variant="secondary">{summaryStats.voidedCount}</Badge>
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Active Month Filter Badge (when synced with table) */}
            {applyMonthToTable && selectedUserMonth !== "all" && (
              <Badge
                variant="outline"
                className="h-8 gap-1.5 px-2.5 text-xs border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium shrink-0"
              >
                <IconCalendar className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>{userStats.selectedMonthLabel}</span>
                <button
                  type="button"
                  onClick={() => setApplyMonthToTable(false)}
                  className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Remove month filter from table"
                >
                  <IconX className="size-3" />
                </button>
              </Badge>
            )}

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search transferee, control no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            {/* Column Customizer */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <IconLayoutColumns className="size-3.5 mr-1" />
                  <span className="hidden lg:inline">Columns</span>
                  <IconChevronDown className="size-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
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
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direct Link to New Transfer Tax */}
            <Button asChild size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/newTransferTax">
                <IconArrowUpRight className="size-3.5 mr-1" />
                New Computation
              </Link>
            </Button>
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="px-4 lg:px-6">
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="bg-muted/60 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            colSpan={header.colSpan}
                            className="text-xs font-semibold uppercase tracking-wider py-3"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="divide-y">
                  {table.getRowModel().rows?.length ? (
                    <SortableContext
                      items={dataIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-28 text-center text-muted-foreground text-sm"
                      >
                        No transfer tax records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>

          {/* PAGINATION & FOOTER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-2">
            <div className="text-muted-foreground text-xs">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filteredData.length > 0
                  ? table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                    1
                  : 0}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  filteredData.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {filteredData.length}
              </span>{" "}
              entries
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                  ({table.getFilteredSelectedRowModel().rows.length} selected)
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="rows-per-page" className="text-xs text-muted-foreground">
                  Rows:
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger size="sm" className="w-16 h-7 text-xs" id="rows-per-page">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {Math.max(1, table.getPageCount())}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  className="size-7 p-0"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  title="First page"
                >
                  <IconChevronsLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  className="size-7 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  title="Previous page"
                >
                  <IconChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  className="size-7 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  title="Next page"
                >
                  <IconChevronRight className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  className="size-7 p-0"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  title="Last page"
                >
                  <IconChevronsRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

// Detailed Drawer Component for Row inspection
function TableCellViewer({ item }: { item: TransferTaxRow }) {
  const isMobile = useIsMobile()
  const router = useRouter()

  const formattedDate = React.useMemo(() => {
    try {
      return format(new Date(item.dateComputed), "MMMM d, yyyy h:mm a")
    } catch {
      return item.dateComputed
    }
  }, [item.dateComputed])

  const formattedValidity = React.useMemo(() => {
    if (!item.validityDate) return "N/A"
    try {
      const vDate = new Date(item.validityDate)
      if (vDate.getFullYear() >= 2099) return "Maximum Interest Reached"
      return format(vDate, "MMMM d, yyyy")
    } catch {
      return item.validityDate
    }
  }, [item.validityDate])

  const isPaid = item.status === "paid" || item.paymentStatus === "paid"
  const isVoided = item.status === "voided" || item.paymentStatus === "voided"

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <div className="cursor-pointer group">
          <div className="font-semibold text-xs text-foreground group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <span className="truncate max-w-[220px]">{item.transferee}</span>
            <IconEye className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">
            From: {item.transferor}
          </div>
        </div>
      </DrawerTrigger>
      <DrawerContent className="sm:max-w-lg">
        <DrawerHeader className="gap-1 border-b pb-4">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="font-mono text-xs px-2 py-0.5 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5"
            >
              {item.controlNo}
            </Badge>
            {isPaid ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-2 py-0.5">
                Paid
              </Badge>
            ) : isVoided ? (
              <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs px-2 py-0.5">
                Voided
              </Badge>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs px-2 py-0.5">
                Unpaid
              </Badge>
            )}
          </div>
          <DrawerTitle className="text-lg font-bold mt-2 truncate">
            {item.transferee}
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            Transfer Tax Computation Details & Assessment Summary
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto p-4 text-sm max-h-[calc(100vh-220px)]">
          {/* Financial Breakdown Card */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-baseline justify-between border-b pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Amount Due
              </span>
              <span className="text-2xl font-bold font-mono text-foreground">
                ₱{Number(item.amountDue || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Tax Base:</span>
                <div className="font-mono font-semibold">
                  ₱{Number(item.taxBase || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Market Value:</span>
                <div className="font-mono font-semibold">
                  ₱{Number(item.marketValue || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Surcharge (25%):</span>
                <div className="font-mono text-amber-600 dark:text-amber-400">
                  ₱{Number(item.surcharge || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Interest:</span>
                <div className="font-mono text-amber-600 dark:text-amber-400">
                  ₱{Number(item.interest || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Assessment Information
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-card">
              <div>
                <div className="text-muted-foreground">Transaction Type</div>
                <div className="font-medium mt-0.5">{item.transactionType}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Computed Date</div>
                <div className="font-medium mt-0.5">{formattedDate}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Validity Date</div>
                <div className="font-medium mt-0.5">{formattedValidity}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Assessor</div>
                <div className="font-medium mt-0.5">{item.assessor}</div>
              </div>
            </div>

            {/* Parties */}
            <div className="space-y-2 rounded-lg border p-3 bg-card">
              <div>
                <div className="text-muted-foreground">Transferee(s)</div>
                <div className="font-semibold text-foreground mt-0.5">
                  {item.transferee}
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-muted-foreground">Transferor(s)</div>
                <div className="font-medium text-foreground mt-0.5">
                  {item.transferor}
                </div>
              </div>
            </div>

            {/* Notarial Document */}
            <div className="space-y-2 rounded-lg border p-3 bg-card">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{item.notarialDoc}</span>
                {item.notarialDocUrl && (
                  <a
                    href={item.notarialDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <IconPaperclip className="size-3" />
                    Attachment
                  </a>
                )}
              </div>
              <div className="text-muted-foreground text-[11px]">
                {item.notarialDocNumber}
              </div>
              {item.notarizedBy && (
                <div className="text-[11px] text-muted-foreground">
                  Notarized by: <span className="font-medium text-foreground">{item.notarizedBy}</span>
                </div>
              )}
            </div>

            {/* Properties Attached */}
            {item.details && item.details.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Attached Properties ({item.details.length})</span>
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {item.details.map((prop, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border p-2.5 bg-card text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span>Tax Dec: {prop.taxDecNo || "N/A"}</span>
                        <span className="font-mono font-bold text-foreground">
                          ₱{Number(prop.totalDue || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Lot: {prop.lotNo || "N/A"}</span>
                        <span>Area: {prop.area || 0} sqm</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Market Value:</span>
                        <span className="font-mono">
                          ₱{Number(prop.marketValue || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="border-t pt-3">
          {item.notarialId && (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => router.push(`/newTransferTax/summary/${item.notarialId}`)}
            >
              <IconExternalLink className="mr-2 size-4" />
              View Full Computation Sheet
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
