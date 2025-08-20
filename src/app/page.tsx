'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Import search page component
import SearchPage from './search/page';

export default function Home() {
  const { currentUser, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // Si no hay usuario, mostrar la página de búsqueda directamente
  if (!currentUser) {
    return <SearchPage />;
  }

  // Si hay usuario autenticado, el AuthContext manejará la redirección
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin" />
    </div>
  );
}
