"use client";

import { useEffect, useState } from "react";
import { getPendingOverrides, processOverrideRequest } from "@/lib/actions/transfertax-actions";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function AdminNotifications() {
  const [overrides, setOverrides] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchOverrides = async () => {
    try {
      const res = await getPendingOverrides();
      if (res.success) {
        setIsAdmin(true);
        setOverrides(res.overrides || []);
      } else if (res.error === "Only admins can view pending overrides") {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOverrides();
    // Poll every 15 seconds
    const interval = setInterval(fetchOverrides, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!isAdmin) return null;

  const handleProcess = async (id: string, approve: boolean) => {
    setIsProcessing(id);
    try {
      const res = await processOverrideRequest(id, approve);
      if (res.success) {
        toast.success(`Request ${approve ? "approved" : "rejected"} successfully.`);
        fetchOverrides();
      } else {
        toast.error(res.error || "Failed to process request.");
      }
    } catch (error) {
      toast.error("Error processing request.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative mr-2">
          <Bell className="h-5 w-5" />
          {overrides.length > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {overrides.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Pending Overrides</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {overrides.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No pending override requests.
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto flex flex-col">
            {overrides.map((req) => (
              <div key={req.id} className="p-3 border-b last:border-b-0 text-sm flex flex-col gap-2 hover:bg-gray-50">
                <div>
                  <span className="font-semibold text-gray-800">{req.user?.name || req.user?.email || "User"}</span> requested to <span className="font-bold text-red-600">{req.actionType}</span> transaction <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{req.transactionId.substring(0, 8)}...</span>
                </div>
                <div className="text-gray-600 italic border-l-2 border-gray-200 pl-2 text-xs">
                  "{req.reason}"
                </div>
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                </div>
                <div className="flex gap-2 mt-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs" 
                    onClick={() => handleProcess(req.id, true)}
                    disabled={isProcessing === req.id}
                  >
                    <Check className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs" 
                    onClick={() => handleProcess(req.id, false)}
                    disabled={isProcessing === req.id}
                  >
                    <X className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
