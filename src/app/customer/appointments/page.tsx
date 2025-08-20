'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Appointment } from '@/lib/types';
import { getAppointmentsForClient } from '@/lib/firebase/firestore';

export default function CustomerAppointmentsPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<(Appointment & { studioId: string; studioName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!profile) return;
      try {
        console.log('Fetching appointments for client:', profile.uid);
        const userAppointments = await getAppointmentsForClient(profile.uid);
        console.log('Found appointments:', userAppointments);
        setAppointments(userAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [profile]);

  if (!profile) {
    return <div>Cargando...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Cargando tus citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/customer" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Citas</h1>
        <p className="text-gray-600">
          Gestiona tus citas programadas y revisa el historial
        </p>
      </div>

      {/* Filtros y acciones */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Próximas
          </Button>
          <Button variant="ghost" size="sm">
            Pasadas
          </Button>
          <Button variant="ghost" size="sm">
            Canceladas
          </Button>
        </div>
        <Link href="/customer">
          <Button>
            Nueva Cita
          </Button>
        </Link>
      </div>

      {/* Lista de citas */}
      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No tienes citas programadas
          </h3>
          <p className="text-gray-600 mb-6">
            ¡Agenda tu primera cita para comenzar tu experiencia de belleza!
          </p>
          <Link href="/customer">
            <Button>
              Buscar Servicios
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Información de la cita */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {appointment.serviceName || 'Servicio'}
                      </h3>
                      <Badge variant="secondary">
                        Confirmada
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{appointment.studioName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {appointment.start ? new Date(appointment.start).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Fecha no disponible'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {appointment.start && appointment.end ? 
                            `${new Date(appointment.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` :
                            'Horario no disponible'
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{appointment.staffName || 'Profesional asignado'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Estudio de Belleza</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 md:items-end">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Reprogramar
                      </Button>
                      <Button variant="outline" size="sm">
                        Cancelar
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 md:text-right">
                      Reservada hace 2 días
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
