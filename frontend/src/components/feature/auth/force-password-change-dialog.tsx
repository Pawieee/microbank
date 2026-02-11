import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ShieldAlert, Loader2, Lock, Eye, EyeOff } from "lucide-react"; // Added Eye icons
import { cn } from "@/lib/utils";
import { validatePassword } from "@/lib/security"; // Import security utils

const ForcePasswordChangeModal: React.FC = () => {
  const { user, changeInitialPassword, logout, isLoading } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  
  // Visibility States
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Sync open state with user profile
  useEffect(() => {
    if (user && user.isFirstLogin) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // 1. Strict Validation
    const strength = validatePassword(newPassword);
    if (!strength.isValid) {
      setLocalError('Password does not meet security requirements (8+ chars, Uppercase, Lowercase, Number, Special).');
      return;
    }

    // 2. Match Validation
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    const success = await changeInitialPassword(newPassword);
    if (success) setIsOpen(false);
  };

  const handleCancel = async () => {
    await logout();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm transition-all duration-300 p-4">
      <div className="bg-white w-full max-w-[400px] rounded-lg shadow-xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-start gap-4">
          <div className="p-2 bg-amber-50 border border-amber-100 rounded-md text-amber-600 mt-0.5">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 leading-none mb-1.5">
              Security Update Required
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              This is your first login. For security purposes, please define a new permanent password.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">New Password</label>
            <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-9 pl-9 pr-9 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 placeholder:text-zinc-400 transition-all"
                  placeholder="Strong password required"
                  autoFocus
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">Confirm Password</label>
            <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-9 pl-9 pr-9 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 placeholder:text-zinc-400 transition-all"
                  placeholder="Re-enter password"
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <button 
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
          </div>

          {localError && (
            <div className="text-xs font-medium text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-100">
              {localError}
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-9 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors text-white shadow-sm",
                isLoading ? "bg-zinc-400 cursor-not-allowed" : "bg-zinc-900 hover:bg-zinc-800"
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full h-8 text-xs text-zinc-500 hover:text-zinc-800 hover:underline decoration-zinc-300 underline-offset-4 transition-all"
            >
              Cancel and sign out
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChangeModal;