import { BackendStatusProvider } from "./contexts/BackendStatusContext";
import Dashboard from "./pages/Dashboard";

const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
        /\/$/,
        "",
    ) || "http://127.0.0.1:8000";

function App() {
    return (
        <BackendStatusProvider apiBase={API_BASE_URL}>
            <Dashboard />
        </BackendStatusProvider>
    );
}

export default App;
