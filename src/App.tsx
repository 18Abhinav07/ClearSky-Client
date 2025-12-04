/**
 * Main App Component - TESTING: Minimal CDP Provider
 *
 * Wraps the application with necessary providers and router
 */

import { MinimalCDPProvider } from "./app/providers/MinimalCDPProvider";
import { AppRouter } from "./app/router";

function App() {
  return (
    <MinimalCDPProvider>
      <AppRouter />
    </MinimalCDPProvider>
  );
}

export default App;
