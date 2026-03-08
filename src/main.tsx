import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAxiosUrl } from "./api/e-posApi";

const initApp = async () => {
    // Si estamos en electron, esperamos a obtener el puerto del backend dinámico
    console.log("Iniciando conexión con Electron backend...");
    await initializeAxiosUrl();
    console.log("Conexión Electron finalizada. Renderizando App.");

    createRoot(document.getElementById("root")!).render(<App />);
};

initApp();
