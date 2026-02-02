"use client";

import { IconCircleCheckFilled, IconClock, IconFileDescription } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ApplicationStatusNotification() {
  const navigate = useNavigate();

  const handleConfirm = () => {
    navigate("/pages/applications");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gray-50/50">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Visual Feedback Section */}
        <div className="pt-12 pb-10 flex flex-col items-center text-center px-8 bg-emerald-50/30 border-b border-emerald-100/50">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-200 blur-xl opacity-20 rounded-full"></div>
            <IconCircleCheckFilled className="size-20 text-emerald-500 mb-6 relative z-10" />
          </div>
          
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Application Submitted
          </h1>
          
          <p className="text-zinc-500 mt-3 text-sm leading-relaxed max-w-[280px]">
            The loan offer has been accepted and the application is now recorded in the system.
          </p>
        </div>

        {/* Action & Info Section */}
        <div className="p-8 space-y-8">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100/50">
            <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl shrink-0 shadow-sm">
              <IconClock size={20} />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-amber-900">Pending Manager Review</p>
              <p className="text-xs text-amber-700/70">Final approval required for disbursement.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleConfirm} 
              className="w-full h-12 text-sm font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg shadow-zinc-200 transition-all active:scale-[0.98]"
            >
              Return to Applications
            </Button>
            
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
              <IconFileDescription size={12} />
              <span>Record ID Generated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}