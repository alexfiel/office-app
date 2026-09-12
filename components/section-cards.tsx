"use client";

import React, { useRef, useState, useEffect } from "react"
import {
  IconBuildingBank,
  IconBuildingStore,
  IconCoins,
  IconSchool,
  IconShieldLock,
  IconTrendingUp,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface FundTypeStat {
  id?: string;
  name: string;
  code: string;
  amount: number;
  percentage?: number;
  count?: number;
}

export interface SectionCardsProps {
  stats: {
    currentYear?: number;
    totalRevenue: number;
    fundTypes?: FundTypeStat[];
    totalTransactions?: number;
    activeAssessors?: number;
    growthRate?: number;
  };
}

const FUND_META: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    subtitle: string;
    badgeClass: string;
  }
> = {
  GF: {
    icon: IconBuildingBank,
    subtitle: "General city operations & regular taxes",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  EF: {
    icon: IconBuildingStore,
    subtitle: "Economic enterprises, markets & slaughterhouse",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  SF: {
    icon: IconSchool,
    subtitle: "Public education fund & school facilities",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  SEF: {
    icon: IconSchool,
    subtitle: "Public education fund & school facilities",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  TS: {
    icon: IconShieldLock,
    subtitle: "Trust receipts & special health fund",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  TF: {
    icon: IconShieldLock,
    subtitle: "Trust accounts & specific grants",
    badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  },
};

/**
 * AutoScaleAmount component that automatically adjusts its font size
 * to fit within the container width without clipping or wrapping.
 */
function AutoScaleAmount({
  amount,
  maxFontSize = 26,
  minFontSize = 13,
}: {
  amount: string;
  maxFontSize?: number;
  minFontSize?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number>(() => {
    // Initial size based on character count for instant layout
    if (amount.length > 17) return 17;
    if (amount.length > 14) return 20;
    if (amount.length > 11) return 23;
    return maxFontSize;
  });

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const adjustFontSize = () => {
      const containerWidth = container.clientWidth;
      if (containerWidth <= 0) return;

      let currentSize = maxFontSize;
      text.style.fontSize = `${currentSize}px`;

      // Iteratively reduce font size until text fits inside container
      while (text.scrollWidth > containerWidth && currentSize > minFontSize) {
        currentSize -= 0.5;
        text.style.fontSize = `${currentSize}px`;
      }

      setFontSize(currentSize);
    };

    // Run on mount and whenever amount changes
    adjustFontSize();

    // Dynamically readjust when card or container resizes (e.g. sidebar toggle or viewport resize)
    const resizeObserver = new ResizeObserver(() => {
      adjustFontSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [amount, maxFontSize, minFontSize]);

  return (
    <div ref={containerRef} className="w-full min-w-0 overflow-hidden">
      <span
        ref={textRef}
        style={{ fontSize: `${fontSize}px` }}
        className="font-semibold tabular-nums tracking-tight leading-none block whitespace-nowrap"
      >
        {amount}
      </span>
    </div>
  );
}

export function SectionCards({ stats }: SectionCardsProps) {
  const { totalRevenue = 0, fundTypes = [], currentYear = new Date().getFullYear() } = stats;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {/* Total Collections Card */}
      <Card className="@container/card py-5">
        <CardHeader className="gap-2 px-5 pb-0">
          <div className="flex items-start justify-between gap-2 w-full">
            <CardDescription className="font-medium text-xs sm:text-sm">
              Total Collections (CY {currentYear})
            </CardDescription>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium shrink-0 text-[11px] px-1.5 py-0.5"
            >
              <IconCoins className="size-3 mr-1" />
              CY {currentYear}
            </Badge>
          </div>
          <CardTitle className="w-full mt-1.5 min-w-0">
            <AutoScaleAmount
              amount={`₱ ${Number(totalRevenue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              maxFontSize={28}
            />
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm px-5 pt-4">
          <div className="line-clamp-1 flex gap-2 font-medium text-xs sm:text-sm">
            Consolidated Total <IconTrendingUp className="size-4 text-emerald-500" />
          </div>
          <div className="text-muted-foreground text-xs">
            Consolidated collections for CY {currentYear}
          </div>
        </CardFooter>
      </Card>

      {/* Fund Types Cards */}
      {fundTypes.map((fund) => {
        const meta = FUND_META[fund.code.toUpperCase()] || {
          icon: IconCoins,
          subtitle: "Dedicated fund collections",
          badgeClass: "bg-muted text-muted-foreground border-border",
        };
        const FundIcon = meta.icon;
        const pct = fund.percentage != null ? fund.percentage.toFixed(1) : "0.0";

        return (
          <Card key={fund.code || fund.name} className="@container/card py-5">
            <CardHeader className="gap-2 px-5 pb-0">
              <div className="flex items-start justify-between gap-2 w-full">
                <CardDescription className="font-medium text-xs sm:text-sm line-clamp-1">
                  {fund.name} ({fund.code})
                </CardDescription>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 text-[11px] px-1.5 py-0.5 font-medium", meta.badgeClass)}
                >
                  <FundIcon className="size-3 mr-1" />
                  {pct}%
                </Badge>
              </div>
              <CardTitle className="w-full mt-1.5 min-w-0">
                <AutoScaleAmount
                  amount={`₱ ${Number(fund.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  maxFontSize={26}
                />
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm px-5 pt-4">
              <div className="line-clamp-1 flex gap-2 font-medium text-xs sm:text-sm">
                {pct}% of Total <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground text-xs line-clamp-1">
                {fund.count != null
                  ? `${fund.count.toLocaleString("en-US")} transactions in CY ${currentYear}`
                  : meta.subtitle}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
