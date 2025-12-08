/**
 * Main App Component
 *
 * Wraps the application with necessary providers and router
 */
import { Toaster } from 'react-hot-toast';
import { MinimalCDPProvider } from "./app/providers/MinimalCDPProvider";
import { AppRouter } from "./app/router";
import { ToastProvider } from './app/providers/ToastProvider';

function App() {
  return (
    <MinimalCDPProvider>
      <AppRouter />
      <Toaster />
      <ToastProvider />
    </MinimalCDPProvider>
  );
}

export default App;
