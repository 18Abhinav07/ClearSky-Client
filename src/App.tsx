/**
 * Main App Component
 *
 * Wraps the application with necessary providers and router
 */

import { WagmiProvider } from "./app/providers/WagmiProvider";
import { AppRouter } from "./app/router";

function App() {
  return (
    <WagmiProvider>
      <AppRouter />
    </WagmiProvider>
  );
}

export default App;
