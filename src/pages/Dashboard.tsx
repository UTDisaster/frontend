import ChatDock from '@components/chat/ChatDock';
import ControlPanel from '@components/controls/ControlPanel';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';

const Dashboard = () => {
    return (
        <div className="relative isolate h-full w-full overflow-hidden text-slate-950">
            <MapContainer
                className="absolute inset-0 z-0 h-full w-full bg-slate-200"
                center={[51.505, -0.09]} zoom={13} scrollWheelZoom={true}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                    <Marker position={[51.505, -0.09]}>
                        <Popup> A pretty CSS3 popup. <br /> Easily customizable. </Popup>
                </Marker>
            </MapContainer>

            <ControlPanel />
            <ChatDock />
        </div>
    );
};

export default Dashboard;
