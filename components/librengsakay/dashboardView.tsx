"use client"

import * as React from "react"
import { Users, Wallet, Landmark, History, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export interface Stats {
    totalPax: number;
    totalSpent: number;
    runningBalance: number;
    budgetUtilization: number;
    initialBudget: number;
    allTrips: any[];
    allLiquidations: any[];
}

export default function DashboardView({ stats, recent }: { stats: Stats, recent: any[] }) {
    const [timeRange, setTimeRange] = React.useState("90d")

    // Process data for chart
    const processedData = React.useMemo(() => {
        const dailyData: Record<string, { date: string; amount: number; pax: number }> = {};
        
        // Process Liquidations (Amount)
        stats.allLiquidations.forEach(record => {
            const dateStr = new Date(record.paymentDate).toISOString().split('T')[0];
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = { date: dateStr, amount: 0, pax: 0 };
            }
            dailyData[dateStr].amount += Number(record.amount || 0);
        });

        // Process Trips (Pax)
        stats.allTrips.forEach(record => {
            const dateStr = new Date(record.departureDate).toISOString().split('T')[0];
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = { date: dateStr, amount: 0, pax: 0 };
            }
            dailyData[dateStr].pax += Number(record.numberofPax || 0);
        });

        return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    }, [stats.allTrips, stats.allLiquidations]);

    const filteredData = React.useMemo(() => {
        return processedData.filter((item) => {
            const date = new Date(item.date)
            const now = new Date();
            let daysToSubtract = 90
            if (timeRange === "30d") daysToSubtract = 30
            else if (timeRange === "7d") daysToSubtract = 7
            
            const startDate = new Date()
            startDate.setDate(now.getDate() - daysToSubtract)
            return date >= startDate
        })
    }, [processedData, timeRange]);

    const chartConfig = {
        amount: {
            label: "Liquidated (P)",
            color: "var(--chart-1)",
        },
        pax: {
            label: "Passengers",
            color: "var(--chart-2)",
        },
    } satisfies ChartConfig

    return (
        <div className="flex flex-1 flex-col gap-6">
            {/* SectionCards Style Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
                <Card className="@container/card">
                    <CardHeader>
                        <CardDescription>Total Liquidated</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl line-clamp-1">
                            P {stats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </CardTitle>
                        <CardAction>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                <IconTrendingUp className="size-3 mr-1" />
                                {stats.budgetUtilization.toFixed(1)}% Use
                            </Badge>
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                            Disbursed budget <Activity className="size-4 text-emerald-500" />
                        </div>
                        <div className="text-muted-foreground">Actual cash liquidation to date</div>
                    </CardFooter>
                </Card>

                <Card className="@container/card">
                    <CardHeader>
                        <CardDescription>Passengers Served</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {stats.totalPax.toLocaleString()}
                        </CardTitle>
                        <CardAction>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                                <Users className="size-3 mr-1" />
                                MTD
                            </Badge>
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                            Steady ridership <IconTrendingUp className="size-4 text-blue-500" />
                        </div>
                        <div className="text-muted-foreground">Total free rides provided this month</div>
                    </CardFooter>
                </Card>

                <Card className="@container/card">
                    <CardHeader>
                        <CardDescription>Initial Budget</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            P {stats.initialBudget.toLocaleString()}
                        </CardTitle>
                        <CardAction>
                            <Badge variant="outline">
                                FY {new Date().getFullYear()}
                            </Badge>
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                            Total allocation <Landmark className="size-4 text-slate-500" />
                        </div>
                        <div className="text-muted-foreground">Annual budget for Libreng Sakay</div>
                    </CardFooter>
                </Card>

                <Card className="@container/card">
                    <CardHeader>
                        <CardDescription>Running Balance</CardDescription>
                        <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${stats.runningBalance < 50000 ? 'text-red-600' : 'text-emerald-600'}`}>
                            P {stats.runningBalance.toLocaleString()}
                        </CardTitle>
                        <CardAction>
                            <Badge variant={stats.runningBalance < 50000 ? "destructive" : "outline"}>
                                {stats.runningBalance < 50000 ? 'LOW' : 'HEALTHY'}
                            </Badge>
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                            Remaining funds {stats.runningBalance < 50000 ? <TrendingDown className="size-4 text-red-500" /> : <TrendingUp className="size-4 text-emerald-500" />}
                        </div>
                        <div className="text-muted-foreground">Available balance for future trips</div>
                    </CardFooter>
                </Card>
            </div>

            {/* Interactive Trend Chart */}
            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Libreng Sakay Performance Trends</CardTitle>
                    <CardDescription>
                        Visualizing ridership volume and budget liquidation over time
                    </CardDescription>
                    <CardAction>
                        <ToggleGroup
                            type="single"
                            value={timeRange}
                            onValueChange={(val) => val && setTimeRange(val)}
                            variant="outline"
                            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
                        >
                            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
                            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
                            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
                        </ToggleGroup>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="flex w-40 @[767px]/card:hidden" size="sm">
                                <SelectValue placeholder="Last 3 months" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="90d">Last 3 months</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardAction>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                        <AreaChart data={filteredData}>
                            <defs>
                                <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="fillPax" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(value) => {
                                    const date = new Date(value)
                                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        indicator="dot"
                                    />
                                }
                            />
                            <Area dataKey="amount" type="natural" fill="url(#fillAmount)" stroke="var(--chart-1)" stackId="a" />
                            <Area dataKey="pax" type="natural" fill="url(#fillPax)" stroke="var(--chart-2)" stackId="b" />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Audit Log Table */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-gray-500" />
                        <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Recent Liquidations (Audit Log)</h3>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">LATEST 5</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 uppercase text-[11px] font-bold border-b">
                            <tr>
                                <th className="px-6 py-3">AR Number</th>
                                <th className="px-6 py-3">Date Paid</th>
                                <th className="px-6 py-3">Driver</th>
                                <th className="px-6 py-3">Plate</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-right">Prepared By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recent.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">No recent liquidations found.</td>
                                </tr>
                            ) : (
                                recent.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-blue-700">{item.arnumber}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(item.paymentDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{item.driverName}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{item.vehiclePlateNumber}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">₱{item.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase tracking-tighter">
                                                {item.user?.name || "System"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}