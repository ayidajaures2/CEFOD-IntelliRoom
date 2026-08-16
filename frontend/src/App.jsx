import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import PrivateRoute from "./components/common/PrivateRoute";
import { ROLES } from "./utils/constants";

// Public
import Home from "./pages/public/Home";
import Rooms from "./pages/public/Rooms";
import Services from "./pages/public/Services";
import RoomDetail from "./pages/public/RoomDetail";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Chatbot from "./pages/public/Chatbot";
import RealTimeDisplay from "./pages/public/RealTimeDisplay";
import About from "./pages/public/About";

// Client
import ClientDashboard from "./pages/client/Dashboard";
import NewBooking from "./pages/client/NewBooking";
import MyBookings from "./pages/client/MyBookings";
import ClientInvoices from "./pages/client/Invoices";
import InvoiceDetail from "./pages/client/InvoiceDetail";
import ClientConversation from "./pages/client/Conversation";
import Profile from "./pages/common/Profile";

// Réceptionniste
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import ManageBookings from "./pages/receptionist/ManageBookings";
import ConversationsList from "./pages/receptionist/ConversationsList";
import ConversationDetail from "./pages/receptionist/ConversationDetail";
import ReceptionistInvoices from "./pages/receptionist/Invoices";
import ReceptionistClients from "./pages/receptionist/Clients";

// SG (Secrétariat Général)
import SgDashboard from "./pages/sg/SgDashboard";
import SgManageBookings from "./pages/sg/ManageBookings";
import SgClients from "./pages/sg/Clients";

// Comptabilité
import ComptabiliteDashboard from "./pages/accounting/ComptabiliteDashboard";
import ValidatePayments from "./pages/accounting/ValidatePayments";
import ComptabiliteInvoices from "./pages/accounting/Invoices";

// Caissier
import CashierDashboard from "./pages/cashier/CashierDashboard";
import CashierPayments from "./pages/cashier/Invoices";
import CashierInvoices from "./pages/cashier/CashierInvoices"; // ✅ AJOUT

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageRooms from "./pages/admin/ManageRooms";
import ManageServices from "./pages/admin/ManageServices";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminInvoices from "./pages/admin/Invoices";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

export default function App() {
  return (
    <Routes>
      {/* Écran d'affichage plein écran (hors gabarit) */}
      <Route path="/affichage" element={<RealTimeDisplay />} />

      {/* Site public */}
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="/salles" element={<Rooms />} />
        <Route path="/services" element={<Services />} />
        <Route path="/salles/:id" element={<RoomDetail />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/a-propos" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Espace client */}
      <Route element={<PrivateRoute roles={[ROLES.CLIENT]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/client/reserver" element={<NewBooking />} />
          <Route path="/client/reservations" element={<MyBookings />} />
          <Route path="/client/factures" element={<ClientInvoices />} />
          <Route path="/client/factures/:id" element={<InvoiceDetail />} />
          <Route path="/client/messages" element={<ClientConversation />} />
          <Route path="/client/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Espace réceptionniste */}
      <Route element={<PrivateRoute roles={[ROLES.RECEPTIONNISTE, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/reception" element={<ReceptionistDashboard />} />
          <Route path="/reception/reservations" element={<ManageBookings />} />
          <Route path="/reception/conversations" element={<ConversationsList />} />
          <Route path="/reception/conversations/:id" element={<ConversationDetail />} />
          <Route path="/reception/factures" element={<ReceptionistInvoices />} />
          <Route path="/reception/clients" element={<ReceptionistClients />} />
          <Route path="/reception/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Espace SG (Secrétariat Général) — pas de messagerie client, c'est le
          rôle exclusif de la réception. Le SG se concentre sur la validation
          des demandes de réservation. */}
      <Route element={<PrivateRoute roles={[ROLES.SG, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/sg" element={<SgDashboard />} />
          <Route path="/sg/reservations" element={<SgManageBookings />} />
          <Route path="/sg/clients" element={<SgClients />} />
          <Route path="/sg/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Espace Comptabilité */}
      <Route element={<PrivateRoute roles={[ROLES.COMPTABILITE, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/comptabilite" element={<ComptabiliteDashboard />} />
          <Route path="/comptabilite/paiements" element={<ValidatePayments />} />
          <Route path="/comptabilite/factures" element={<ComptabiliteInvoices />} />
          <Route path="/comptabilite/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Espace caissier */}
      <Route element={<PrivateRoute roles={[ROLES.CAISSIER, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/caisse" element={<CashierDashboard />} />
          <Route path="/caisse/paiements" element={<CashierPayments />} />
          <Route path="/caisse/factures" element={<CashierInvoices />} />
          <Route path="/caisse/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Espace administrateur */}
      <Route element={<PrivateRoute roles={[ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/salles" element={<ManageRooms />} />
          <Route path="/admin/services" element={<ManageServices />} />
          <Route path="/admin/utilisateurs" element={<ManageUsers />} />
          <Route path="/admin/factures" element={<AdminInvoices />} />
          <Route path="/admin/rapports" element={<Reports />} />
          <Route path="/admin/parametres" element={<Settings />} />
          <Route path="/admin/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Repli */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}