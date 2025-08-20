'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, MapPin, Star, Clock, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { getAllStudios, getPublicServicesForStudio, getPublicStaffForStudio, addOrUpdateAppointment } from '@/lib/firebase/firestore';
import { Studio, Service, UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';

interface StudioWithServices extends Studio {
  services?: Service[];
}

export default function BookAppointmentPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [studios, setStudios] = useState<StudioWithServices[]>([]);
  const [filteredStudios, setFilteredStudios] = useState<StudioWithServices[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<'search' | 'book'>('search');

  // Form data
  const [formData, setFormData] = useState({
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    const fetchStudiosAndServices = async () => {
      try {
        setLoading(true);
        const allStudios = await getAllStudios();
        
        const studiosWithServices = await Promise.all(
          allStudios.map(async (studio) => {
            try {
              const services = await getPublicServicesForStudio(studio.id);
              return { ...studio, services };
            } catch (error) {
              console.error(`Error loading services for studio ${studio.id}:`, error);
              return { ...studio, services: [] };
            }
          })
        );
        
        setStudios(studiosWithServices);
        setFilteredStudios(studiosWithServices);
      } catch (error) {
        console.error('Error fetching studios:', error);
        toast({ title: "Error", description: "No se pudieron cargar los estudios.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchStudiosAndServices();
  }, []);

  useEffect(() => {
    const filtered = studios.filter(studio => {
      const matchesSearch = studio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (studio.address?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesService = !selectedService || selectedService === 'all' || 
                           studio.services?.some(s => s.id === selectedService);
      return matchesSearch && matchesService;
    });
    setFilteredStudios(filtered);
  }, [studios, searchTerm, selectedService]);

  const handleStudioSelect = async (studio: Studio) => {
    setSelectedStudio(studio);
    setStep('book');
    
    try {
      const [studioServices, studioStaff] = await Promise.all([
        getPublicServicesForStudio(studio.id),
        getPublicStaffForStudio(studio.id)
      ]);
      setServices(studioServices);
      setStaff(studioStaff);
    } catch (error) {
      console.error('Error loading studio data:', error);
      toast({ title: "Error", description: "No se pudieron cargar los datos del estudio.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudio || !profile) return;

    setIsSaving(true);
    try {
      const service = services.find(s => s.id === formData.serviceId);
      if (!service) {
        toast({ title: "Error", description: "Servicio no válido.", variant: "destructive" });
        return;
      }

      const start = parse(`${formData.date} ${formData.time}`, 'yyyy-MM-dd HH:mm', new Date());
      const end = new Date(start.getTime() + service.duration * 60000);

      await addOrUpdateAppointment(selectedStudio.id, {
        clientName: profile.displayName || profile.email || 'Cliente',
        clientEmail: profile.email,
        clientId: profile.uid || 'anonymous',
        serviceId: formData.serviceId,
        staffId: formData.staffId,
        start,
        end,
        status: 'confirmed',
        notes: formData.notes
      });

      toast({ title: "¡Cita agendada!", description: "Tu cita ha sido agendada exitosamente." });
      router.push('/customer/appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({ title: "Error", description: "No se pudo agendar la cita.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" asChild>
            <Link href="/customer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {step === 'search' ? 'Agendar Nueva Cita' : `Agendar en ${selectedStudio?.name}`}
          </h1>
        </div>

        {step === 'search' && (
          <>
            {/* Filtros de búsqueda */}
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div>
                <Input
                  placeholder="Buscar por nombre o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los servicios</SelectItem>
                    {studios.flatMap(s => s.services || [])
                      .filter((service, index, self) => 
                        index === self.findIndex(s => s.id === service.id)
                      )
                      .map(service => (
                        <SelectItem key={service.id} value={service.id!}>
                          {service.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista de estudios */}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredStudios.map((studio) => (
                <Card key={studio.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6" onClick={() => handleStudioSelect(studio)}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{studio.name}</h3>
                        <div className="flex items-center text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{studio.address || 'Dirección no disponible'}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm">4.8 (120 reseñas)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Servicios disponibles:</h4>
                      <div className="flex flex-wrap gap-1">
                        {studio.services?.slice(0, 3).map((service) => (
                          <Badge key={service.id} variant="secondary" className="text-xs">
                            {service.name}
                          </Badge>
                        ))}
                        {studio.services && studio.services.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{studio.services.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {step === 'book' && selectedStudio && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalles de la Cita</CardTitle>
                <Button variant="ghost" onClick={() => setStep('search')}>
                  Cambiar estudio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Servicio</label>
                    <Select 
                      value={formData.serviceId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id!}>
                            <div className="flex justify-between w-full">
                              <span>{service.name}</span>
                              <span className="text-muted-foreground ml-2">
                                {service.duration}min - ${service.price}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Profesional</label>
                    <Select 
                      value={formData.staffId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, staffId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un profesional" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map(member => (
                          <SelectItem key={member.uid} value={member.uid}>
                            {member.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Fecha</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Hora</label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Notas adicionales (opcional)</label>
                  <Input
                    placeholder="Cualquier información adicional..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSaving} className="flex-1">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Agendar Cita
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
