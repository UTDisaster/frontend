import 'leaflet/dist/leaflet.css';

import { useEffect, useState } from 'react';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import { ImageOverlay, MapContainer, Polygon, TileLayer, useMap } from 'react-leaflet';

import type { ImageOverlayMode } from '@components/controls/ControlPanel';
import {
    defaultOverlayJsonAdapter,
    type MapImageOverlay,
    loadImageOverlay,
} from './overlay';
import type { MapPolygon } from './types';

const DEFAULT_CENTER: [number, number] = [30.2672, -97.7431];
const DEFAULT_ZOOM = 10;
const OVERLAY_DATA_URL = '/hurricane-florence_00000087_post_disaster.json';
const OVERLAY_IMAGE_URL_BY_MODE: Record<Exclude<ImageOverlayMode, 'none'>, string> = {
    post: '/hurricane-florence_00000087_post_disaster.png',
    pre: '/hurricane-florence_00000087_pre_disaster.png',
};

interface MapViewProps {
    imageOverlayOpacity?: number;
    imageOverlayMode?: ImageOverlayMode;
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

const ViewportSync = ({ bounds }: { bounds?: LatLngBoundsExpression }) => {
    const map = useMap();

    useEffect(() => {
        if (!bounds) return;
        map.fitBounds(bounds, { padding: [24, 24] });
    }, [bounds, map]);

    return null;
};

const MapView = ({
    imageOverlayOpacity = 0.8,
    imageOverlayMode = 'post',
    polygons = [],
}: MapViewProps) => {
    const [imageOverlay, setImageOverlay] = useState<MapImageOverlay | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadOverlay = async () => {
            try {
                const overlay = await loadImageOverlay({
                    dataUrl: OVERLAY_DATA_URL,
                    imageUrl: OVERLAY_IMAGE_URL_BY_MODE.post,
                    adapter: defaultOverlayJsonAdapter,
                });

                if (isMounted) {
                    setImageOverlay(overlay);
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to build image overlay:', error);
                    setImageOverlay(null);
                }
            }
        };

        void loadOverlay();

        return () => {
            isMounted = false;
        };
    }, []);

    const mapBounds = imageOverlay?.bounds as LatLngBoundsExpression | undefined;
    const activeOverlayImageUrl =
        imageOverlayMode === 'none' ? null : OVERLAY_IMAGE_URL_BY_MODE[imageOverlayMode];

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
            <ViewportSync bounds={mapBounds} />
            {imageOverlay && activeOverlayImageUrl ? (
                <ImageOverlay
                    url={activeOverlayImageUrl}
                    bounds={imageOverlay.bounds}
                    opacity={imageOverlayOpacity}
                />
            ) : null}
            <PolygonLayer polygons={polygons} />
        </MapContainer>
    );
};

export default MapView;
