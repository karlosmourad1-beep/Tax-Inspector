import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGameEngine } from "./hooks/useGameEngine";

// Pages
import MainMenu from "./pages/MainMenu";
import Desk from "./pages/Desk";
import EndScreen from "./pages/EndScreen";
import DayStartScreen from "./pages/DayStartScreen";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function GameRouter() {
  const engine = useGameEngine();
  const { status } = engine.state;

  // Render different root views based on game status
  if (status === 'TITLE') return <MainMenu engine={engine} />;
  if (status === 'DAY_START') return <DayStartScreen engine={engine} />;
  if (status === 'PLAYING' || status === 'DAY_END') return <Desk engine={engine} />;
  if (status === 'GAME_OVER' || status === 'VICTORY') return <EndScreen engine={engine} />;
  
  return <NotFound />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/" component={GameRouter} />
            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
