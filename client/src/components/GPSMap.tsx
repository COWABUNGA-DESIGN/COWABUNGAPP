import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Technician {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'offline';
  currentJob?: string;
  location: { lat: number; lng: number };
  lastUpdate: string;
}

interface GPSMapProps {
  technicians: Technician[];
}

const statusColors = {
  available: 'bg-green-500',
  busy: 'bg-orange-500',
  offline: 'bg-gray-500',
};

export function GPSMap({ technicians }: GPSMapProps) {
  return (
    <div className="flex gap-4 h-full">
      <div className="w-80 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technicians</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {technicians.map((tech) => (
              <div
                key={tech.id}
                className="p-3 bg-card border border-card-border rounded-lg hover-elevate cursor-pointer"
                data-testid={`card-technician-${tech.id}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {tech.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{tech.name}</span>
                      <span className={`w-2 h-2 rounded-full ${statusColors[tech.status]}`}></span>
                    </div>
                    {tech.currentJob ? (
                      <p className="text-xs text-muted-foreground truncate">{tech.currentJob}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{tech.status}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Updated {tech.lastUpdate}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <CardContent className="p-0 h-full">
          <div className="relative w-full h-full min-h-[500px] bg-muted rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <i className="fas fa-map-marked-alt text-6xl text-muted-foreground/50"></i>
                <div>
                  <p className="text-lg font-semibold text-foreground">GPS Map View</p>
                  <p className="text-sm text-muted-foreground">Real-time technician tracking</p>
                </div>
                <div className="flex gap-4 justify-center">
                  {technicians.map((tech) => (
                    <div
                      key={tech.id}
                      className="flex items-center gap-2 px-3 py-2 bg-card border border-card-border rounded-lg"
                    >
                      <span className={`w-3 h-3 rounded-full ${statusColors[tech.status]}`}></span>
                      <span className="text-xs font-medium">{tech.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
