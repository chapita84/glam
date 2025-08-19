
'use client';

import { useEffect, useState } from 'react';
import { getAllStudios } from '@/lib/firebase/firestore';
import { type Studio } from '@/lib/types';
import { SearchResultCard } from '@/components/search-result-card';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function SearchPage() {
  console.log("DEBUG: Renderizando /search page");

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
      <h1 className="mb-6 text-3xl font-bold">Buscar Estudios</h1>
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
              <SearchResultCard key={studio.id} studio={studio} />
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
