import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Summarize from "./pages/Summarize";
import SavedPapers from "./pages/SavedPapers";
import ResearchChat from "./pages/ResearchChat";
import MyLists from "./pages/MyLists";
import ListDetails from "./pages/ListDetails";
import AuthForm from "./components/AuthForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/summarize" element={<Summarize />} />
          <Route path="/saved-papers" element={<SavedPapers />} />
          <Route path="/research-chat" element={<ResearchChat />} />
          <Route path="/my-lists" element={<MyLists />} />
          <Route path="/list/:listId" element={<ListDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
