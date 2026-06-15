"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Label, Sector } from "recharts"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

  const categories = React.useMemo(() => chartData.map(item => item.categoryKey), [chartData]);
  const [activeCategory, setActiveCategory] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (categories.length > 0 && (!activeCategory || !categories.includes(activeCategory))) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const activeIndex = React.useMemo(
    () => {
       const idx = chartData.findIndex((item) => item.categoryKey === activeCategory);
       return idx >= 0 ? idx : 0;
    },
    [activeCategory, chartData]
  )

  return (
    <Card className="flex flex-col @container/card h-full">
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Collections by Category</CardTitle>
          <CardDescription>
            Total Revenue: ₱{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardDescription>
        </div>
        <Select value={activeCategory} onValueChange={setActiveCategory}>
          <SelectTrigger
            className="ml-auto h-7 w-[140px] rounded-lg pl-2.5"
            aria-label="Select a category"
          >
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {categories.map((key) => {
              const config = chartConfig[key as keyof typeof chartConfig]
              if (!config) return null
              return (
                <SelectItem
                  key={key}
                  value={key}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-sm"
                      style={{
                        backgroundColor: `var(--color-${key})`,
                      }}
                    />
                    {config?.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 pb-4 flex flex-col justify-center">
        {!mounted ? null : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto w-full aspect-square max-h-[250px]"
          >
            <PieChart>
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
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="categoryKey"
                innerRadius={60}
                strokeWidth={3}
                activeIndex={activeIndex}
                activeShape={({
                  outerRadius = 0,
                  ...props
                }: any) => (
                  <Sector {...props} outerRadius={outerRadius + 8} />
                )}
                onMouseEnter={(_, index) => {
                  const key = chartData[index]?.categoryKey;
                  if (key) setActiveCategory(key);
                }}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 5}
                            className="fill-foreground text-2xl font-bold"
                          >
                            ₱{Number(chartData[activeIndex]?.amount || 0).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 18}
                            className="fill-muted-foreground text-xs"
                          >
                            {chartData[activeIndex]?.categoryName?.length > 15 
                              ? chartData[activeIndex].categoryName.substring(0, 15) + "..."
                              : chartData[activeIndex]?.categoryName}
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
