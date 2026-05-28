import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { useAuth } from './useAuth';
import { secondsUntilExpiry } from '@/utils/token';
import { revokeToken } from '@/features/auth/authApi';

export function useSessionGuard() {
  const dispatch = useAppDispatch();
  const { token, expiresAt, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !expiresAt) return;

    const tick = () => {
      const secs = secondsUntilExpiry(expiresAt);
      if (secs <= 0) {
        revokeToken();
        dispatch(logout());
        setShowWarning(false);
      } else if (secs <= 60) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [token, expiresAt, isAuthenticated, dispatch]);

  const extendSession = () => {
    // Nothing to extend on the client side — would require a /refresh endpoint.
    // For now just dismiss the warning and let the server reject when it actually expires.
    setShowWarning(false);
  };

  const forceLogout = () => {
    revokeToken();
    dispatch(logout());
    setShowWarning(false);
  };

  return { showWarning, extendSession, forceLogout };
}
