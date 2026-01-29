"use client";

import { IconCircleCheckFilled, IconCircleXFilled, IconCash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ApplicationStatusNotificationProps {
  status: "Approved" | "Rejected";
}

export function ApplicationStatusNotification({
  status,
}: ApplicationStatusNotificationProps) {
  const navigate = useNavigate();
  const isApproved = status === "Approved";

  const handleConfirm = () => {
    navigate("/pages/applications");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Visual Feedback Section */}
        <div className={cn(
          "pt-12 pb-10 flex flex-col items-center text-center px-8",
          isApproved ? "bg-emerald-50/50" : "bg-zinc-50/50"
        )}>
          {isApproved ? (
            <IconCircleCheckFilled className="size-20 text-emerald-500 mb-6" />
          ) : (
            <IconCircleXFilled className="size-20 text-zinc-400 mb-6" />
          )}
          
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {isApproved ? "Application Approved" : "Application Rejected"}
          </h1>
          
          <p className="text-zinc-500 mt-3 text-sm leading-relaxed max-w-[280px]">
            {isApproved 
              ? "The automated eligibility assessment is complete and successful."
              : "The applicant does not meet the necessary criteria for approval at this time."}
          </p>
        </div>

        {/* Action & Info Section */}
        <div className="p-8 space-y-8">
          {isApproved && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50">
              <div className="bg-emerald-500 text-white p-2 rounded-xl shrink-0 shadow-sm">
                <IconCash size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-emerald-900">Ready for Disbursement</p>
                <p className="text-xs text-emerald-700/70">Funds are cleared for release.</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleConfirm} 
              className="w-full h-12 text-sm font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg shadow-zinc-200 transition-all active:scale-[0.98]"
            >
              Confirm
            </Button>
            
            <p className="text-[10px] text-center text-zinc-400 uppercase tracking-widest font-medium">
              Redirecting to applications management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}