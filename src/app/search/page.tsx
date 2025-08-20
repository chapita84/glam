
'use client';

import { useEffect, useState } from 'react';
import { getAllStudios } from '@/lib/firebase/firestore';
import { type Studio } from '@/lib/types';
import { SearchResultCard } from '@/components/search-result-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function SearchPage() {
  console.log("DEBUG: Renderizando /search page");

  const { currentUser, logout } = useAuth();
  const [allStudios, setAllStudios] = useState<Studio[]>([]);
  const [filteredStudios, setFilteredStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudios = async () => {
      console.log("DEBUG: [fetchStudios] Iniciando carga de estudios públicos...");
      setLoading(true);
      try {
        const studios = await getAllStudios();
        console.log(`DEBUG: [fetchStudios] Se encontraron ${studios.length} estudios.`);
        setAllStudios(studios);
        setFilteredStudios(studios);
      } catch (error) {
        console.error("DEBUG: [fetchStudios] Error cargando estudios:", error);
      } finally {
        setLoading(false);
        console.log("DEBUG: [fetchStudios] Carga de estudios finalizada.");
      }
    };
    fetchStudios();
  }, []);

  useEffect(() => {
    console.log(`DEBUG: [useEffect searchTerm] Filtrando estudios con el término: "${searchTerm}"`);
    if (searchTerm === '') {
      setFilteredStudios(allStudios);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = allStudios.filter((studio) =>
        studio.name.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredStudios(filtered);
    }
  }, [searchTerm, allStudios]);

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Buscar Estudios</h1>
        
        {/* Botones de autenticación */}
        <div className="flex gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentUser.email}
              </span>
              <Button onClick={logout} variant="outline" size="sm">
                Cerrar Sesión
              </Button>
              <Link href="/" passHref>
                <Button variant="default" size="sm">
                  Panel
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" passHref>
                <Button variant="outline" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register" passHref>
                <Button variant="default" size="sm">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <Input
          type="text"
          placeholder="Busca por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudios.length > 0 ? (
            filteredStudios.map((studio) => (
              <SearchResultCard key={studio.id} {...studio} />
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">
              No se encontraron estudios.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
