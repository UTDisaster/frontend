import 'leaflet/dist/leaflet.css';

import type { LatLngExpression } from 'leaflet';
import { MapContainer, Polygon, TileLayer } from 'react-leaflet';

import type { MapPolygon } from './types';

const DEFAULT_CENTER: [number, number] = [30.2672, -97.7431];
const DEFAULT_ZOOM = 10;

/** Sample polygons for demo; replace with API or props later. */
const SAMPLE_POLYGONS: MapPolygon[] = [
    {
        id: 'area-1',
        coordinates: [
            [30.27, -97.75],
            [30.28, -97.75],
            [30.28, -97.73],
            [30.27, -97.73],
        ],
    },
];

interface MapViewProps {
    polygons?: MapPolygon[];
}

const PolygonLayer = ({ polygons }: { polygons: MapPolygon[] }) => {
    if (polygons.length === 0) return null;

    return (
        <>
            {polygons.map((poly) => (
                <Polygon
                    key={poly.id}
                    positions={poly.coordinates as LatLngExpression[]}
                    pathOptions={{
                        color: '#0f172a',
                        fillColor: '#334155',
                        fillOpacity: 0.25,
                        weight: 2,
                    }}
                />
            ))}
        </>
    );
};

const MapView = ({ polygons = SAMPLE_POLYGONS }: MapViewProps) => {
    return (
        <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <PolygonLayer polygons={polygons} />
        </MapContainer>
    );
};

export default MapView;
