'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { getAllStudios, getServicesForStudio } from '@/lib/firebase/firestore';
import { Studio, Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface BookAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StudioWithServices extends Studio {
  services?: Service[];
}

export default function BookAppointmentModal({ open, onOpenChange }: BookAppointmentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [studios, setStudios] = useState<StudioWithServices[]>([]);
  const [selectedStudio, setSelectedStudio] = useState<StudioWithServices | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Horarios disponibles (esto debería venir del backend)
  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  useEffect(() => {
    if (open) {
      loadStudios();
    }
  }, [open]);

  const loadStudios = async () => {
    setLoading(true);
    try {
      const allStudios = await getAllStudios();
      
      // Cargar servicios para cada estudio
      const studiosWithServices = await Promise.all(
        allStudios.map(async (studio) => {
          try {
            const services = await getServicesForStudio(studio.id);
            return { ...studio, services };
          } catch (error) {
            console.error(`Error loading services for studio ${studio.id}:`, error);
            return { ...studio, services: [] };
          }
        })
      );
      
      setStudios(studiosWithServices);
    } catch (error) {
      console.error('Error loading studios:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los estudios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudioSelect = async (studioId: string) => {
    const studio = studios.find(s => s.id === studioId);
    if (studio) {
      setSelectedStudio(studio);
      setStep(2);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = selectedStudio?.services?.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setStep(3);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setStep(4);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(5);
  };

  const handleConfirm = async () => {
    if (!selectedStudio || !selectedService || !selectedDate || !selectedTime) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos',
        variant: 'destructive'
      });
      return;
    }

    // Aquí iría la lógica para crear la cita
    toast({
      title: 'Funcionalidad pendiente',
      description: 'La reserva de citas será implementada próximamente',
    });
    
    // Reset y cerrar
    resetModal();
    onOpenChange(false);
  };

  const resetModal = () => {
    setStep(1);
    setSelectedStudio(null);
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime('');
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetModal();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && 'Selecciona un Estudio'}
            {step === 2 && 'Selecciona un Servicio'}
            {step === 3 && 'Selecciona una Fecha'}
            {step === 4 && 'Selecciona un Horario'}
            {step === 5 && 'Confirmar Cita'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Paso 1: Seleccionar Estudio */}
          {step === 1 && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando estudios...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {studios.map((studio) => (
                    <Card
                      key={studio.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleStudioSelect(studio.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{studio.name}</h3>
                            <div className="flex items-center text-gray-600 mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="text-sm">Ubicación no especificada</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm text-gray-600">
                                {studio.services?.length || 0} servicios disponibles
                              </span>
                              <Badge variant="secondary">⭐ 0</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Seleccionar Servicio */}
          {step === 2 && selectedStudio && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  ← Volver
                </Button>
                <span className="text-sm text-gray-600">
                  Estudio: <strong>{selectedStudio.name}</strong>
                </span>
              </div>
              
              <div className="grid gap-3">
                {selectedStudio.services?.map((service) => (
                  <Card
                    key={service.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleServiceSelect(service.id!)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              {service.duration} min
                            </div>
                            <div className="flex items-center text-sm font-medium">
                              <DollarSign className="h-4 w-4 mr-1" />
                              ${service.price}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Paso 3: Seleccionar Fecha */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  ← Volver
                </Button>
                <span className="text-sm text-gray-600">
                  Servicio: <strong>{selectedService?.name}</strong>
                </span>
              </div>
              
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date() || date.getDay() === 0} // Deshabilitar domingos y fechas pasadas
                  className="rounded-md border"
                />
              </div>
            </div>
          )}

          {/* Paso 4: Seleccionar Horario */}
          {step === 4 && selectedDate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  ← Volver
                </Button>
                <span className="text-sm text-gray-600">
                  Fecha: <strong>{selectedDate.toLocaleDateString('es-ES')}</strong>
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant="outline"
                    className="h-12"
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 5: Confirmar */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  ← Volver
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de la Cita</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estudio:</span>
                    <span className="font-medium">{selectedStudio?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">{selectedDate?.toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horario:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duración:</span>
                    <span className="font-medium">{selectedService?.duration} minutos</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-lg">${selectedService?.price}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Button onClick={handleConfirm} className="w-full" size="lg">
                Confirmar Cita
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
