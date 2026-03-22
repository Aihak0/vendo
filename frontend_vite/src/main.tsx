import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertProvider } from "./components/ui/alert/Alert.tsx";
const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
         <AlertProvider />
        <App />
    </QueryClientProvider>
  </StrictMode>,
);
