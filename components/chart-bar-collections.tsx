"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export function ChartBarCollections({ records }: { records: any[] }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Process data for chart
  const { chartData, chartConfig, totalAmount } = React.useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let total = 0;
    
    records.forEach(record => {
      record.collections?.forEach((collection: any) => {
        collection.collectionItems?.forEach((item: any) => {
          const catName = item.collectionCategory?.name || 'Unknown';
          if (!categoryTotals[catName]) {
            categoryTotals[catName] = 0;
          }
          const amt = Number(item.amount || 0);
          categoryTotals[catName] += amt;
          total += amt;
        });
      });
    });

    const processed = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value); // Sort descending

    const sanitizeKey = (key: string) => key.replace(/[^a-zA-Z0-9]/g, '');

    const COLORS = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ];

    const data = processed.map((item, index) => {
      const key = sanitizeKey(item.name);
      return {
        categoryKey: key,
        categoryName: item.name,
        amount: item.value,
        fill: `var(--color-${key})`
      };
    });

    const config: ChartConfig = {
      amount: {
        label: "Revenue",
      }
    };
    
    data.forEach((item, index) => {
      config[item.categoryKey] = {
        label: item.categoryName,
        color: COLORS[index % COLORS.length]
      };
    });

    return { chartData: data, chartConfig: config, totalAmount: total };
  }, [records]);

  return (
    <Card className="flex flex-col @container/card h-full">
      <CardHeader className="pb-4">
        <CardTitle>Collections by Category</CardTitle>
        <CardDescription>
          Total Revenue: ₱{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {!mounted ? null : (
          <ChartContainer
            config={chartConfig}
            className="w-full aspect-square max-h-[300px]"
          >
            <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="categoryName"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
              />
              <ChartTooltip 
                cursor={false} 
                content={
                  <ChartTooltipContent 
                    hideLabel 
                    formatter={(value, name, item) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: item.payload.fill }}
                        />
                        <div className="flex w-full justify-between gap-4">
                          <span className="text-muted-foreground">{item.payload.categoryName}</span>
                          <span className="font-mono font-medium tabular-nums">
                            ₱{Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    )}
                  />
                } 
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
