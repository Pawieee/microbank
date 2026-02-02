import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const ForcePasswordChangeModal: React.FC = () => {
  const { changeInitialPassword, logout, isLoading } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const isFirstLogin = localStorage.getItem("is_first_login") === "true";
    setIsOpen(isFirstLogin);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (newPassword.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    const success = await changeInitialPassword(newPassword);
    
    if (success) {
      setIsOpen(false);
    }
  };

  const handleCancel = async () => {
    await logout();
  };

  if (!isOpen) return null;

  return (
    /* FIX APPLIED HERE:
      1. 'fixed inset-0': Covers entire viewport.
      2. 'z-[9999]': Ensures it is above the Sidebar and Header.
      3. 'bg-black/50': Modern Tailwind syntax for 50% opacity black.
      4. 'backdrop-blur-sm': Adds the glass effect to the background.
    */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
        
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-blue-50 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome to MicroBank
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            For your security, please update your temporary password to continue to your dashboard.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Min. 8 characters"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Confirm new password"
              required
            />
          </div>

          {localError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {localError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold shadow-sm transition-all duration-200
                ${isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-95'}`}
            >
              {isLoading ? 'Updating Account...' : 'Set Password & Access Dashboard'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-2 px-4 rounded-lg text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              Cancel and Log Out
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChangeModal;