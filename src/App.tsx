
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Summarize from "./pages/Summarize";
import ResearchChat from "./pages/ResearchChat";
import MyLists from "./pages/MyLists";
import ListDetails from "./pages/ListDetails";
import PaperDetails from "./pages/PaperDetails";
import AuthForm from "./components/AuthForm";
import NotFound from "./pages/NotFound";
import UploadPaper from "./pages/UploadPaper";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/summarize" element={<Summarize />} />
          <Route path="/research-chat" element={<ResearchChat />} />
          <Route path="/my-lists" element={<MyLists />} />
          <Route path="/upload" element={<UploadPaper />} />
          <Route path="/list/:listId" element={<ListDetails />} />
          <Route path="/paper/:source/:paperId" element={<PaperDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
