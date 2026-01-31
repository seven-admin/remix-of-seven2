import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { PortalIncorporadorLayout } from "@/components/portal-incorporador/PortalIncorporadorLayout";
import {
  PortalIncorporadorDashboard,
  PortalIncorporadorExecutivo,
  PortalIncorporadorForecast,
  PortalIncorporadorMarketing,
  PortalIncorporadorPlanejamento,
} from "@/pages/portal-incorporador";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Empreendimentos from "./pages/Empreendimentos";
import EmpreendimentoDetalhe from "./pages/EmpreendimentoDetalhe";
import MapaUnidadesPage from "./pages/MapaUnidadesPage";
import Clientes from "./pages/Clientes";
import Configuracoes from "./pages/Configuracoes";
import Usuarios from "./pages/Usuarios";
import Imobiliarias from "./pages/Imobiliarias";
import Incorporadoras from "./pages/Incorporadoras";
import Corretores from "./pages/Corretores";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Atividades from "./pages/Atividades";
import Forecast from "./pages/Forecast";
import Negociacoes from "./pages/Negociacoes";
import Propostas from "./pages/Propostas";
import Contratos from "./pages/Contratos";
import Comissoes from "./pages/Comissoes";
import PortalDashboard from "./pages/PortalDashboard";
import PortalEmpreendimentos from "./pages/PortalEmpreendimentos";
import PortalEmpreendimentoDetalhe from "./pages/PortalEmpreendimentoDetalhe";
import PortalSolicitacoes from "./pages/PortalSolicitacoes";
import ConfiguracaoNegociacoes from "./pages/ConfiguracaoNegociacoes";
import Relatorios from "./pages/Relatorios";
import Auditoria from "./pages/Auditoria";
import Marketing from "./pages/Marketing";
import MarketingCalendario from "./pages/MarketingCalendario";
import MarketingDetalhe from "./pages/MarketingDetalhe";
import EtapasTickets from "./pages/EtapasTickets";
import Eventos from "./pages/Eventos";
import EventoDetalhe from "./pages/EventoDetalhe";
import EventosCalendarioPage from "./pages/EventosCalendario";
import EventoTemplates from "./pages/EventoTemplates";
import Briefings from "./pages/Briefings";
import Financeiro from "./pages/Financeiro";
import Bonificacoes from "./pages/Bonificacoes";
import DRE from "./pages/DRE";
import MetasComerciais from "./pages/MetasComerciais";
import TiposParcela from "./pages/TiposParcela";
import AssinarContrato from "./pages/AssinarContrato";
import DashboardExecutivo from "./pages/DashboardExecutivo";
import Solicitacoes from "./pages/Solicitacoes";

import DashboardMarketing from "./pages/DashboardMarketing";
import EquipeMarketing from "./pages/EquipeMarketing";
import TermosUso from "./pages/TermosUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import PortalClientes from "./pages/PortalClientes";
import NovaPropostaComercial from "./pages/NovaPropostaComercial";
import SemAcesso from "./pages/SemAcesso";
import Planejamento from "./pages/Planejamento";
import PlanejamentoConfiguracoes from "./pages/PlanejamentoConfiguracoes";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/assinar/:token" element={<AssinarContrato />} />
            <Route path="/termos" element={<TermosUso />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/sem-acesso" element={<SemAcesso />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute moduleName="dashboard">
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-executivo" element={
              <ProtectedRoute moduleName="dashboard" adminOnly>
                <DashboardExecutivo />
              </ProtectedRoute>
            } />
            <Route path="/empreendimentos" element={
              <ProtectedRoute moduleName="empreendimentos">
                <Empreendimentos />
              </ProtectedRoute>
            } />
            <Route path="/empreendimentos/:id" element={
              <ProtectedRoute moduleName="empreendimentos">
                <EmpreendimentoDetalhe />
              </ProtectedRoute>
            } />
            <Route path="/mapa-unidades" element={
              <ProtectedRoute moduleName="unidades">
                <MapaUnidadesPage />
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute moduleName="clientes">
                <Clientes />
              </ProtectedRoute>
            } />
            <Route path="/atividades" element={
              <ProtectedRoute moduleName="atividades">
                <Atividades />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute moduleName="configuracoes">
                <Configuracoes />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes/negociacoes" element={
              <ProtectedRoute moduleName="negociacoes_config">
                <ConfiguracaoNegociacoes />
              </ProtectedRoute>
            } />
            
            <Route path="/usuarios" element={
              <ProtectedRoute moduleName="usuarios" adminOnly>
                <Usuarios />
              </ProtectedRoute>
            } />
            <Route path="/imobiliarias" element={
              <ProtectedRoute moduleName="imobiliarias">
                <Imobiliarias />
              </ProtectedRoute>
            } />
            <Route path="/incorporadoras" element={
              <ProtectedRoute moduleName="incorporadoras">
                <Incorporadoras />
              </ProtectedRoute>
            } />
            <Route path="/corretores" element={
              <ProtectedRoute moduleName="corretores">
                <Corretores />
              </ProtectedRoute>
            } />
            <Route path="/forecast" element={
              <ProtectedRoute moduleName="forecast">
                <Forecast />
              </ProtectedRoute>
            } />
            <Route path="/metas-comerciais" element={
              <ProtectedRoute moduleName="forecast">
                <MetasComerciais />
              </ProtectedRoute>
            } />
            <Route path="/negociacoes" element={
              <ProtectedRoute moduleName="negociacoes">
                <Negociacoes />
              </ProtectedRoute>
            } />
            <Route path="/negociacoes/nova" element={
              <ProtectedRoute moduleName="negociacoes">
                <NovaPropostaComercial />
              </ProtectedRoute>
            } />
            {/* Redirect old /propostas to /negociacoes */}
            <Route path="/propostas" element={<Navigate to="/negociacoes" replace />} />
            <Route path="/solicitacoes" element={
              <ProtectedRoute moduleName="solicitacoes" adminOnly>
                <Solicitacoes />
              </ProtectedRoute>
            } />
            
            <Route path="/contratos" element={
              <ProtectedRoute 
                moduleName="contratos" 
                alternativeModules={['contratos_templates', 'contratos_variaveis']}
              >
                <Contratos />
              </ProtectedRoute>
            } />
            <Route path="/tipos-parcela" element={
              <ProtectedRoute moduleName="contratos_tipos_parcela">
                <TiposParcela />
              </ProtectedRoute>
            } />
            <Route path="/comissoes" element={
              <ProtectedRoute moduleName="comissoes">
                <Comissoes />
              </ProtectedRoute>
            } />
            <Route path="/financeiro" element={
              <ProtectedRoute moduleName="financeiro_fluxo">
                <Financeiro />
              </ProtectedRoute>
            } />
            <Route path="/bonificacoes" element={
              <ProtectedRoute moduleName="bonificacoes">
                <Bonificacoes />
              </ProtectedRoute>
            } />
            <Route path="/dre" element={
              <ProtectedRoute moduleName="financeiro_dre">
                <DRE />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute moduleName="relatorios">
                <Relatorios />
              </ProtectedRoute>
            } />
            <Route path="/auditoria" element={
              <ProtectedRoute moduleName="auditoria" adminOnly>
                <Auditoria />
              </ProtectedRoute>
            } />
            {/* Marketing e Criação */}
            <Route path="/marketing/dashboard" element={
              <ProtectedRoute moduleName="projetos_marketing">
                <DashboardMarketing />
              </ProtectedRoute>
            } />
            <Route path="/marketing" element={
              <ProtectedRoute moduleName="projetos_marketing">
                <Marketing />
              </ProtectedRoute>
            } />
            <Route path="/marketing/equipe" element={
              <ProtectedRoute moduleName="projetos_marketing">
                <EquipeMarketing />
              </ProtectedRoute>
            } />
            <Route path="/marketing/etapas" element={
              <ProtectedRoute moduleName="projetos_marketing_config" adminOnly>
                <EtapasTickets />
              </ProtectedRoute>
            } />
            <Route path="/marketing/calendario" element={
              <ProtectedRoute moduleName="projetos_marketing">
                <MarketingCalendario />
              </ProtectedRoute>
            } />
            <Route path="/marketing/:id" element={
              <ProtectedRoute moduleName="projetos_marketing">
                <MarketingDetalhe />
              </ProtectedRoute>
            } />
            <Route path="/marketing/briefings" element={
              <ProtectedRoute moduleName="briefings">
                <Briefings />
              </ProtectedRoute>
            } />
            
            {/* Planejamento */}
            <Route path="/planejamento" element={
              <ProtectedRoute moduleName="planejamento">
                <Planejamento />
              </ProtectedRoute>
            } />
            <Route path="/planejamento/configuracoes" element={
              <ProtectedRoute moduleName="planejamento_config" adminOnly>
                <PlanejamentoConfiguracoes />
              </ProtectedRoute>
            } />
            <Route path="/eventos" element={
              <ProtectedRoute moduleName="eventos">
                <Eventos />
              </ProtectedRoute>
            } />
            <Route path="/eventos/calendario" element={
              <ProtectedRoute moduleName="eventos">
                <EventosCalendarioPage />
              </ProtectedRoute>
            } />
            <Route path="/eventos/:id" element={
              <ProtectedRoute moduleName="eventos">
                <EventoDetalhe />
              </ProtectedRoute>
            } />
            <Route path="/eventos/templates" element={
              <ProtectedRoute moduleName="eventos_templates" adminOnly>
                <EventoTemplates />
              </ProtectedRoute>
            } />

            {/* Portal do Corretor - Layout aninhado */}
            <Route 
              path="/portal-corretor" 
              element={
                <ProtectedRoute moduleName="portal_corretor">
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PortalDashboard />} />
              <Route path="empreendimentos" element={<PortalEmpreendimentos />} />
              <Route path="empreendimentos/:id" element={<PortalEmpreendimentoDetalhe />} />
              <Route path="solicitacoes" element={<PortalSolicitacoes />} />
              <Route path="clientes" element={<PortalClientes />} />
            </Route>

            {/* Portal do Incorporador - Layout aninhado */}
            <Route 
              path="/portal-incorporador" 
              element={
                <ProtectedRoute moduleName="portal_incorporador">
                  <PortalIncorporadorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PortalIncorporadorDashboard />} />
              <Route path="executivo" element={<PortalIncorporadorExecutivo />} />
              <Route path="forecast" element={<PortalIncorporadorForecast />} />
              <Route path="marketing" element={<PortalIncorporadorMarketing />} />
              <Route path="planejamento" element={<PortalIncorporadorPlanejamento />} />
            </Route>
            
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
