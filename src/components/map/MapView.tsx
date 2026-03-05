import 'leaflet/dist/leaflet.css';

import type { LatLngExpression } from 'leaflet';
import { MapContainer, Polygon, Popup, TileLayer } from 'react-leaflet';

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
        area: 'Austin, TX',
        classification: 'Major',
        notes: 'Roof damage, standing water observed.',
    },
];

interface MapViewProps {
    polygons?: MapPolygon[];
}

const formatLatLng = (coords: [number, number][]): string => {
    if (coords.length === 0) return '—';
    const [lat, lng] = coords[0];
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

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
                >
                    <Popup>
                        <div className="min-w-[180px] text-sm text-slate-900">
                            <p className="font-semibold">
                                {formatLatLng(poly.coordinates)}
                            </p>
                            {poly.area != null && (
                                <p className="text-slate-600">{poly.area}</p>
                            )}
                            {poly.classification != null && (
                                <p>
                                    <span className="text-slate-500">
                                        Classification:
                                    </span>{' '}
                                    {poly.classification}
                                </p>
                            )}
                            {poly.notes != null && (
                                <p className="mt-1 text-slate-600">
                                    {poly.notes}
                                </p>
                            )}
                        </div>
                    </Popup>
                </Polygon>
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
            zoomControl={false}
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
