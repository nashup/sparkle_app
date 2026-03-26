import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Welcome from "./pages/welcome";
import Lobby from "./pages/lobby";
import WaitingRoom from "./pages/waiting-room";
import Game from "./pages/game";
import Results from "./pages/results";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/lobby" component={Lobby} />
      <Route path="/room/:code" component={WaitingRoom} />
      <Route path="/game/:code" component={Game} />
      <Route path="/results/:code" component={Results} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
