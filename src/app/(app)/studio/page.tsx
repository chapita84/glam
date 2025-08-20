'use client';

import React from 'react';
import { useStudio } from '@/contexts/StudioContext';
import { useStudioData } from '@/contexts/StudioDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudioPage() {
  const { studio } = useStudio();
  const { config } = useStudioData();

  if (!studio) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>No Studio Selected</CardTitle>
            <CardDescription>Please select a studio to continue</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{studio.name}</CardTitle>
          <CardDescription>Studio Management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Studio Information</h3>
              <p><strong>ID:</strong> {studio.id}</p>
              <p><strong>Name:</strong> {studio.name}</p>
              <p><strong>Location:</strong> {studio.location}</p>
            </div>
            
            {config && (
              <div>
                <h3 className="text-lg font-semibold">Configuration</h3>
                <p><strong>Working Hours:</strong> {config.workingHours.length} schedules configured</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
