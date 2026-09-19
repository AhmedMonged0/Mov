import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AdminAuthContext = createContext(null);

const ADMIN_STORAGE_KEY = 'movora_admin_secret_v2';
const ADMIN_SESSION_KEY = 'movora_admin_auth_token';
const DEFAULT_ADMIN_SECRET = 'Ahmed@678599';

export function AdminAuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize and verify admin session on load
  useEffect(() => {
    try {
      const token = localStorage.getItem(ADMIN_SESSION_KEY);
      if (token && token.startsWith('adm_session_')) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate admin password
  const loginAdmin = (enteredSecret) => {
    if (!enteredSecret || !enteredSecret.trim()) {
      return { success: false, message: 'يرجى إدخال كلمة المرور' };
    }

    const currentSecret = localStorage.getItem(ADMIN_STORAGE_KEY) || DEFAULT_ADMIN_SECRET;
    const cleanEntered = enteredSecret.trim();

    if (cleanEntered === currentSecret || cleanEntered === DEFAULT_ADMIN_SECRET) {
      const sessionToken = 'adm_session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
      localStorage.setItem(ADMIN_SESSION_KEY, sessionToken);
      setIsAdmin(true);
      return { success: true };
    }

    return { success: false, message: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' };
  };

  // Logout admin
  const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdmin(false);
  };

  // Change Admin Password
  const changeAdminSecret = (oldSecret, newSecret) => {
    const currentSecret = localStorage.getItem(ADMIN_STORAGE_KEY) || DEFAULT_ADMIN_SECRET;
    if (oldSecret !== currentSecret && oldSecret !== DEFAULT_ADMIN_SECRET) {
      return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
    }

    if (!newSecret || newSecret.trim().length < 6) {
      return { success: false, message: 'يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل' };
    }

    localStorage.setItem(ADMIN_STORAGE_KEY, newSecret.trim());
    return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, loading, loginAdmin, logoutAdmin, changeAdminSecret }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Protected Route for Admin Dashboard
export function AdminProtectedRoute({ children }) {
  const { isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#07080b',
        color: '#ff315a',
        fontFamily: 'inherit',
        fontSize: '16px',
        fontWeight: '700'
      }}>
        جاري التحقق من جلسة الأدمن...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
