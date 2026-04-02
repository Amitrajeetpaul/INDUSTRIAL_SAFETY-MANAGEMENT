import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MapPin } from "lucide-react";
import { Incident } from "@shared/schema";

interface FloorplanMapProps {
    incidents: Incident[];
}

// A simple simulated floorplan SVG mapping
// We map typical locations to x,y coordinates on a 800x600 viewBox
const ZONE_COORDINATES: Record<string, { x: number; y: number }> = {
    "Warehouse Zone A": { x: 200, y: 150 },
    "Warehouse Zone B": { x: 200, y: 450 },
    "Warehouse Block B": { x: 200, y: 450 },
    "Production Line 1": { x: 500, y: 150 },
    "Production Line 2": { x: 500, y: 300 },
    "Loading Dock": { x: 100, y: 500 },
    "Default": { x: 400, y: 300 }
};

export function FloorplanMap({ incidents }: FloorplanMapProps) {
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [drillMode, setDrillMode] = useState(false);

    const getCoordinates = (location: string) => {
        // Exact match or fallback
        for (const [key, coords] of Object.entries(ZONE_COORDINATES)) {
            if (location.toLowerCase().includes(key.toLowerCase())) return coords;
        }
        return ZONE_COORDINATES["Default"];
    };

    const getMarkerColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'fill-red-600';
            case 'high': return 'fill-orange-500';
            case 'medium': return 'fill-amber-400';
            case 'low': return 'fill-blue-400';
            default: return 'fill-gray-400';
        }
    };

    // Only show open or under review items on the map typically, but we'll show all
    const activeIncidents = incidents.filter(i => i.status !== 'resolved');

    return (
        <div className="relative w-full aspect-[4/3] bg-zinc-900/5 dark:bg-zinc-900/40 rounded-lg border border-border/50 overflow-hidden shadow-2xl">
            {/* Control Overlay */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <button 
                  onClick={() => setDrillMode(!drillMode)}
                  className={`px-4 py-2 rounded-lg font-black uppercase text-xs tracking-widest transition-all border-2 ${
                    drillMode 
                    ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/50 animate-pulse" 
                    : "bg-background/80 border-border/50 text-foreground hover:bg-background"
                  }`}
                >
                  {drillMode ? "⚠️ DRILL ACTIVE" : "🛡️ START DRILL"}
                </button>
            </div>

            {/* Base Floorplan SVG */}
            <svg viewBox="0 0 800 600" className="w-full h-full text-zinc-300 dark:text-zinc-700">
                <rect x="50" y="50" width="700" height="500" fill="none" stroke="currentColor" strokeWidth="4" />
                {/* Warehouse */}
                <rect x="50" y="50" width="300" height="500" fill="none" stroke="currentColor" strokeWidth="2" />
                <text x="200" y="80" fill="currentColor" textAnchor="middle" className="text-xl font-black opacity-20">WAREHOUSE</text>
                <line x1="50" y1="300" x2="350" y2="300" stroke="currentColor" strokeWidth="2" strokeDasharray="10,10" />
                <text x="200" y="200" fill="currentColor" textAnchor="middle" className="text-lg font-bold opacity-10 uppercase tracking-widest">Zone A</text>
                <text x="200" y="450" fill="currentColor" textAnchor="middle" className="text-lg font-bold opacity-10 uppercase tracking-widest">Zone B</text>

                {/* Production Lines */}
                <rect x="350" y="50" width="400" height="350" fill="none" stroke="currentColor" strokeWidth="2" />
                <text x="550" y="80" fill="currentColor" textAnchor="middle" className="text-xl font-black opacity-20">PRODUCTION</text>
                <line x1="350" y1="225" x2="750" y2="225" stroke="currentColor" strokeWidth="2" strokeDasharray="10,10" />
                <text x="550" y="160" fill="currentColor" textAnchor="middle" className="text-lg font-bold opacity-10 uppercase tracking-widest">Line 1</text>
                <text x="550" y="320" fill="currentColor" textAnchor="middle" className="text-lg font-bold opacity-10 uppercase tracking-widest">Line 2</text>

                {/* Loading Dock */}
                <rect x="50" y="450" width="100" height="100" fill="none" stroke="currentColor" strokeWidth="2" />
                <text x="100" y="470" fill="currentColor" textAnchor="middle" className="text-[10px] uppercase font-black opacity-20">Dock</text>

                {/* Evacuation Routes (Active only during Drill) */}
                {drillMode && (
                  <g>
                    {/* Primary Route */}
                    <path 
                      d="M 500 300 L 500 550 L 50 550" 
                      fill="none" 
                      stroke="#22c55e" 
                      strokeWidth="8" 
                      strokeDasharray="20,10" 
                      className="animate-[dash_2s_linear_infinite]"
                      style={{ strokeDashoffset: 100 }}
                    />
                    {/* Secondary Route */}
                    <path 
                      d="M 200 150 L 50 150" 
                      fill="none" 
                      stroke="#eab308" 
                      strokeWidth="8" 
                      strokeDasharray="20,10" 
                    />
                    
                    {/* Fire Extinguishers */}
                    <circle cx="350" cy="50" r="10" className="fill-red-600 animate-pulse" />
                    <circle cx="750" cy="300" r="10" className="fill-red-600 animate-pulse" />
                    <text x="350" y="35" fill="#ef4444" textAnchor="middle" className="text-[8px] font-black">🔥 EXT</text>
                    <text x="750" y="285" fill="#ef4444" textAnchor="middle" className="text-[8px] font-black">🔥 EXT</text>

                    {/* Safe Assemble Zone */}
                    <rect x="40" y="540" width="120" height="40" className="fill-green-600/20 stroke-green-500 stroke-2" />
                    <text x="100" y="565" fill="#22c55e" textAnchor="middle" className="text-[10px] font-black uppercase tracking-tighter">SAFE ZONE</text>
                  </g>
                )}

                {/* Render Incident Pins */}
                {activeIncidents.map((incident) => {
                    const { x, y } = getCoordinates(incident.location);
                    return (
                        <g
                            key={incident.id}
                            className="transition-opacity duration-300"
                            style={{ opacity: drillMode ? 0.3 : 1 }}
                            onClick={() => setSelectedIncident(incident)}
                            transform={`translate(${x}, ${y})`}
                        >
                            <circle cx="0" cy="0" r="12" className={`${getMarkerColor(incident.severity)} cursor-pointer animate-pulse`} />
                            <circle cx="0" cy="0" r="18" className={`${getMarkerColor(incident.severity)} opacity-30 animate-ping`} />
                            <MapPin className="text-white w-4 h-4 -translate-y-2 -translate-x-2 pointer-events-none" />
                        </g>
                    );
                })}
            </svg>

            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: 0;
                }
              }
            `}</style>

            {/* Selected Incident Tooltip/Card overlay */}
            {selectedIncident && !drillMode && (
                <div className="absolute top-4 right-4 max-w-sm">
                    <Card className="shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm">
                        <CardContent className="p-4 relative">
                            <button
                                onClick={() => setSelectedIncident(null)}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                            >
                                &times;
                            </button>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant={
                                    selectedIncident.severity === 'critical' ? 'destructive' :
                                        selectedIncident.severity === 'high' ? 'destructive' :
                                            selectedIncident.severity === 'medium' ? 'outline' : 'secondary'
                                }>
                                    {selectedIncident.severity}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono">ID: {selectedIncident.id}</span>
                            </div>
                            <h4 className="font-bold text-sm leading-tight mb-1">{selectedIncident.title}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                <MapPin className="w-3 h-3" /> {selectedIncident.location}
                            </p>
                            <p className="text-sm line-clamp-2">{selectedIncident.description}</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
