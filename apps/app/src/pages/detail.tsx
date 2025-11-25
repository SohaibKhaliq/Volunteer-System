import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Clock, Share2, Flag, Mail, Phone, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Detail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in real app fetch based on ID
  const event = {
    title: 'Community Park Cleanup',
    organization: 'Green Earth Initiative',
    description: "Join us for our monthly park cleanup event! We'll be removing litter, planting flowers, and maintaining the trails. This is a great opportunity to meet neighbors and make our community cleaner and greener. Gloves and bags will be provided, but please bring your own water bottle.",
    date: 'Saturday, November 25, 2024',
    time: '09:00 AM - 01:00 PM',
    location: 'Central Park, Downtown',
    address: '123 Park Ave, Cityville, ST 12345',
    coordinates: [31.6295, -7.9811],
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop',
    organizer: {
      name: 'Sarah Johnson',
      role: 'Event Coordinator',
      avatar: 'https://github.com/shadcn.png',
      email: 'sarah@greenearth.org',
      phone: '+1 (555) 123-4567'
    },
    requirements: [
      'Must be 16+ years old',
      'Wear comfortable closed-toe shoes',
      'Sign waiver form upon arrival'
    ],
    tags: ['Environment', 'Outdoor', 'Community'],
    spots: {
      total: 50,
      filled: 32
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Hero Image */}
      <div className="relative h-[400px] w-full bg-slate-900">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute top-6 left-6">
          <Button 
            variant="secondary" 
            size="sm" 
            className="gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" /> {t('Back')}
          </Button>
        </div>
      </div>

      <div className="container px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {event.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <span className="font-medium text-primary">{event.organization}</span>
                  <span>•</span>
                  <span>{t('Posted 2 days ago')}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('About this Opportunity')}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('Requirements')}</h3>
                  <ul className="space-y-2">
                    {event.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3 text-slate-600">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('Location')}</h3>
                  <p className="text-slate-600 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {event.address}
                  </p>
                  <div className="h-[300px] w-full rounded-lg overflow-hidden border">
                    <MapContainer center={event.coordinates as [number, number]} zoom={15} className="w-full h-full">
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={event.coordinates as [number, number]}>
                        <Popup>{event.location}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="border-none shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle>{t('Date & Time')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">{event.date}</div>
                      <div className="text-sm text-muted-foreground">{t('Add to Calendar')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">{event.time}</div>
                      <div className="text-sm text-muted-foreground">{t('4 hours duration')}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{event.spots.filled} {t('volunteers signed up')}</span>
                    <span className="text-muted-foreground">{event.spots.total} {t('spots total')}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${(event.spots.filled / event.spots.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button size="lg" className="w-full font-semibold text-lg h-12">
                    {t('Join Now')}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" /> {t('Share')}
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Flag className="h-4 w-4 mr-2" /> {t('Report')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Card */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{t('Organizer')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={event.organizer.avatar} />
                    <AvatarFallback>SJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{event.organizer.name}</div>
                    <div className="text-sm text-muted-foreground">{event.organizer.role}</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4" /> {event.organizer.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4" /> {event.organizer.phone}
                  </div>
                </div>
                <Button variant="link" className="px-0 mt-2 text-primary">
                  {t('View Organization Profile')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
