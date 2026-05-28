import { useSessionGuard } from '@/hooks/useSessionGuard';
import { AlertTriangle, LogOut, Clock } from 'lucide-react';

export default function SessionWarningModal() {
  const { showWarning, extendSession, forceLogout } = useSessionGuard();

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="card relative max-w-sm w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Session Expiring Soon</h2>
            <p className="mt-1 text-sm text-gray-600">
              Your session will expire in less than a minute. You will be automatically logged out.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={extendSession} className="btn-secondary flex-1 gap-1.5">
            <Clock className="h-4 w-4" />
            Dismiss
          </button>
          <button onClick={forceLogout} className="btn-danger flex-1 gap-1.5">
            <LogOut className="h-4 w-4" />
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}
