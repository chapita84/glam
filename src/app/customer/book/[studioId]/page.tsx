'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useSearchParams } from 'next/navigation';
import { getServicesForStudio, addOrUpdateAppointment } from '@/lib/firebase/firestore';
import { Service } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Clock, DollarSign, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function BookStudioPage() {
  const { studioId } = useParams();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service');
  const router = useRouter();
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar que el usuario sea un customer
    if (profile && profile.globalRole !== 'customer') {
      toast({
        title: 'Acceso denegado',
        description: 'Solo los clientes pueden acceder a esta página.',
        variant: 'destructive',
      });
      router.push('/dashboard');
      return;
    }

    const loadServices = async () => {
      if (studioId) {
        try {
          const studioServices = await getServicesForStudio(studioId as string);
          setServices(studioServices);
          
          // Si hay un servicio específico en la URL, seleccionarlo
          if (serviceId) {
            const service = studioServices.find(s => s.name.toLowerCase().includes(serviceId.toLowerCase()));
            if (service) {
              setSelectedService(service);
            }
          }
        } catch (error) {
          console.error('Error loading services:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadServices();
  }, [studioId, serviceId, profile, router, toast]);

  const handleBookAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !profile) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos para la reserva.',
        variant: 'destructive',
      });
      return;
    }

    console.log('User profile:', profile);
    console.log('User role:', profile.globalRole);
    console.log('Studio ID:', studioId);

    setIsBooking(true);
    try {
      // Crear fecha y hora completa
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentStart = new Date(selectedDate);
      appointmentStart.setHours(hours, minutes, 0, 0);
      
      const appointmentEnd = new Date(appointmentStart);
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + selectedService.duration);

      const appointmentData = {
        start: appointmentStart,
        end: appointmentEnd,
        serviceId: selectedService.id!,
        staffId: '', // Se asignará después por el estudio
        clientId: profile.uid,
        clientName: profile.displayName || profile.email,
        serviceName: selectedService.name,
        staffName: '',
        notes: '',
      };

      console.log('Creating appointment:', appointmentData);

      await addOrUpdateAppointment(studioId as string, appointmentData);

      console.log('Appointment created successfully');

      toast({
        title: 'Reserva creada',
        description: 'Tu reserva ha sido creada exitosamente. Recibirás una confirmación pronto.',
      });

      router.push('/customer');
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la reserva. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Generar opciones de horario (9 AM a 7 PM)
  const timeOptions = [];
  for (let hour = 9; hour <= 19; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`);
    timeOptions.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando servicios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/customer" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a estudios
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reservar Cita</h1>
        <p className="text-gray-600">
          Selecciona un servicio y fecha para tu cita
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Selección de Servicio */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay servicios disponibles en este estudio.
              </p>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedService?.id === service.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{service.name}</h3>
                    <Badge variant="secondary" className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ${service.price}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {service.duration} minutos
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Selección de Fecha y Confirmación */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Fecha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedService ? (
              <>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Servicio Seleccionado:</h4>
                  <p className="text-sm text-gray-600">{selectedService.name}</p>
                  <p className="text-sm text-gray-600">
                    Duración: {selectedService.duration} min - Precio: ${selectedService.price}
                  </p>
                </div>
                
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
                
                {selectedDate && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Seleccionar Hora:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {timeOptions.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 border rounded-lg text-sm transition-colors ${
                              selectedTime === time
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {selectedTime && (
                      <>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold mb-2">Resumen de la Cita:</h4>
                          <p className="text-sm">Servicio: {selectedService.name}</p>
                          <p className="text-sm">Fecha: {selectedDate.toLocaleDateString('es-ES')}</p>
                          <p className="text-sm">Hora: {selectedTime}</p>
                          <p className="text-sm">Duración: {selectedService.duration} minutos</p>
                          <p className="text-sm">Precio: ${selectedService.price}</p>
                        </div>
                        
                        <Button 
                          className="w-full" 
                          onClick={handleBookAppointment}
                          disabled={isBooking}
                        >
                          {isBooking ? 'Creando Reserva...' : 'Confirmar Reserva'}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Selecciona un servicio para continuar con la reserva
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
