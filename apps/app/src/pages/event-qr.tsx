import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function EventQR() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // In a real app we might fetch event details here to confirm title
  return (
    <div className="container mx-auto py-12 flex flex-col items-center">
       <Button variant="ghost" onClick={() => navigate(-1)} className="self-start mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <CardTitle>Check-in Code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-8 space-y-6">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <QRCodeSVG
                    value={JSON.stringify({
                        type: 'event_check_in',
                        eventId: id,
                        timestamp: Date.now()
                    })}
                    size={256}
                />
            </div>
            <p className="text-center text-muted-foreground text-sm">
                Show this code to a volunteer coordinator to check in to your shift.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
