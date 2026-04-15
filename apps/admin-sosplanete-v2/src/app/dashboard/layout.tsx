'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialisation du rôle depuis le localStorage pour éviter les flashs d'UI
  const [role] = useState<'AS' | 'AM'>(() => {
    if (typeof window !== 'undefined') {
      return (getAuthData('user_role') as 'AS' | 'AM') || 'AM';
    }
    return 'AM';
  });

  return (
    <DashboardLayout role={role}>
      {children}
    </DashboardLayout>
  );
}
