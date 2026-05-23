"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

export function CollectionFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filterType, setFilterType] = useState(searchParams.get("filterType") || "single");
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [month, setMonth] = useState(searchParams.get("month") || "");
  const [year, setYear] = useState(searchParams.get("year") || new Date().getFullYear().toString());

  useEffect(() => {
    setFilterType(searchParams.get("filterType") || "single");
    setDate(searchParams.get("date") || "");
    setStartDate(searchParams.get("startDate") || "");
    setEndDate(searchParams.get("endDate") || "");
    setMonth(searchParams.get("month") || "");
    setYear(searchParams.get("year") || new Date().getFullYear().toString());
  }, [searchParams]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("filterType", filterType);

    if (filterType === "single" && date) params.set("date", date);
    if (filterType === "range" && startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    }
    if (filterType === "month" && month) params.set("month", month);
    if (filterType === "year" && year) params.set("year", year);

    router.push(`/cashier/collections?${params.toString()}`);
  };

  const handleClear = () => {
    setFilterType("single");
    setDate("");
    setStartDate("");
    setEndDate("");
    setMonth("");
    setYear(new Date().getFullYear().toString());
    router.push("/cashier/collections");
  };

  const hasActiveFilter = !!searchParams.get("filterType");

  return (
    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-[140px] h-9 bg-white">
          <SelectValue placeholder="Filter By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="single">Single Date</SelectItem>
          <SelectItem value="range">Date Range</SelectItem>
          <SelectItem value="month">Monthly</SelectItem>
          <SelectItem value="year">Yearly</SelectItem>
        </SelectContent>
      </Select>

      {filterType === "single" && (
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto h-9 bg-white" required />
      )}

      {filterType === "range" && (
        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto h-9 bg-white" required />
          <span className="text-sm text-slate-500">to</span>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto h-9 bg-white" required />
        </div>
      )}

      {filterType === "month" && (
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-auto h-9 bg-white" required />
      )}

      {filterType === "year" && (
        <Input type="number" min="2000" max="2100" value={year} onChange={e => setYear(e.target.value)} className="w-24 h-9 bg-white" required />
      )}

      <Button type="submit" variant="secondary" size="sm" className="h-9">
        <Search className="h-4 w-4 mr-2" />
        Apply
      </Button>

      {hasActiveFilter && (
        <Button type="button" onClick={handleClear} variant="ghost" size="sm" className="h-9 text-muted-foreground px-2">
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
