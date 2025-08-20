'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building, User, Search, AlertTriangle } from 'lucide-react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { changeStudioOwner, createStudio } from '@/lib/firebase/firestore';
import type { UserProfile, GlobalRole } from '@/lib/types';

interface Studio {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerEmail?: string;
}

interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export default function StudioManagementPage() {
  const { toast } = useToast();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedStudio, setSelectedStudio] = useState<string>('');
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStudioName, setNewStudioName] = useState('');
  const [newStudioOwner, setNewStudioOwner] = useState<string>('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadStudios();
    loadUsers();
  }, []);

  const loadStudios = async () => {
    try {
      const studiosRef = collection(db, 'studios');
      const snapshot = await getDocs(studiosRef);
      const studiosData: Studio[] = [];

      for (const studioDoc of snapshot.docs) {
        const studioData = { id: studioDoc.id, ...studioDoc.data() } as Studio;
        
        // Get owner email
        if (studioData.ownerId) {
          try {
            const ownerRef = doc(db, 'users', studioData.ownerId);
            const ownerDoc = await getDoc(ownerRef);
            if (ownerDoc.exists()) {
              studioData.ownerEmail = ownerDoc.data().email;
            }
          } catch (error) {
            console.error('Error getting owner data:', error);
          }
        }

        studiosData.push(studioData);
      }

      setStudios(studiosData);
    } catch (error) {
      console.error('Error loading studios:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los estudios',
        variant: 'destructive'
      });
    }
  };

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive'
      });
    }
  };

  const handleChangeOwner = async () => {
    if (!selectedStudio || !selectedNewOwner) {
      toast({
        title: 'Error',
        description: 'Selecciona un estudio y un nuevo propietario',
        variant: 'destructive'
      });
      return;
    }

    const studio = studios.find(s => s.id === selectedStudio);
    const newOwner = users.find(u => u.uid === selectedNewOwner);

    if (!studio || !newOwner) {
      toast({
        title: 'Error',
        description: 'Datos no válidos',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await changeStudioOwner(selectedStudio, selectedNewOwner, studio.ownerId);

      toast({
        title: '¡Propietario cambiado!',
        description: `${newOwner.email} es ahora el propietario de ${studio.name}`
      });

      // Reload studios to reflect changes
      await loadStudios();
      setSelectedStudio('');
      setSelectedNewOwner('');
    } catch (error) {
      console.error('Error changing owner:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el propietario',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudio = async () => {
    if (!newStudioName.trim() || !newStudioOwner) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos',
        variant: 'destructive'
      });
      return;
    }

    setCreateLoading(true);
    try {
      const owner = users.find(u => u.uid === newStudioOwner);
      if (!owner) {
        throw new Error('Usuario propietario no encontrado');
      }

      const ownerProfile: UserProfile = {
        uid: owner.uid,
        email: owner.email,
        displayName: owner.displayName || owner.email,
        globalRole: 'owner' as GlobalRole
      };

      await createStudio(newStudioName.trim(), ownerProfile);
      
      toast({
        title: 'Éxito',
        description: `El estudio "${newStudioName}" ha sido creado correctamente`
      });

      // Reset form
      setNewStudioName('');
      setNewStudioOwner('');
      
      // Reload studios
      await loadStudios();
    } catch (error) {
      console.error('Error creating studio:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el estudio',
        variant: 'destructive'
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredStudios = studios.filter(studio =>
    studio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    studio.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Estudios</h1>
        <p className="text-gray-600">
          Administra la propiedad y configuración de los estudios
        </p>
      </div>

      <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-8">
        {/* Create New Studio Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Crear Nuevo Estudio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="studio-name">Nombre del Estudio</Label>
              <Input
                id="studio-name"
                value={newStudioName}
                onChange={(e) => setNewStudioName(e.target.value)}
                placeholder="Nombre del estudio..."
              />
            </div>

            <div>
              <Label htmlFor="studio-owner">Propietario</Label>
              <Select value={newStudioOwner} onValueChange={setNewStudioOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un propietario..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.uid} value={user.uid}>
                      {user.email} {user.displayName && `(${user.displayName})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateStudio}
              disabled={createLoading || !newStudioName.trim() || !newStudioOwner}
              className="w-full"
            >
              {createLoading ? 'Creando...' : 'Crear Estudio'}
            </Button>
          </CardContent>
        </Card>

        {/* Change Owner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cambiar Propietario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="studio-select">Seleccionar Estudio</Label>
              <Select value={selectedStudio} onValueChange={setSelectedStudio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estudio..." />
                </SelectTrigger>
                <SelectContent>
                  {studios.map(studio => (
                    <SelectItem key={studio.id} value={studio.id}>
                      {studio.name} ({studio.ownerEmail || 'Sin propietario'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="owner-select">Nuevo Propietario</Label>
              <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.uid} value={user.uid}>
                      {user.email} {user.displayName && `(${user.displayName})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudio && selectedNewOwner && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      Confirmar cambio de propietario
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Esta acción transferirá la propiedad del estudio y no se puede deshacer fácilmente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleChangeOwner}
              disabled={loading || !selectedStudio || !selectedNewOwner}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cambiando propietario...
                </>
              ) : (
                'Cambiar Propietario'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Studios List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Lista de Estudios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o propietario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredStudios.map(studio => (
                <div
                  key={studio.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{studio.name}</h4>
                      <p className="text-sm text-gray-500">/{studio.slug}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Propietario: {studio.ownerEmail || 'No asignado'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStudio(studio.id)}
                      disabled={selectedStudio === studio.id}
                    >
                      {selectedStudio === studio.id ? 'Seleccionado' : 'Seleccionar'}
                    </Button>
                  </div>
                </div>
              ))}

              {filteredStudios.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron estudios
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
