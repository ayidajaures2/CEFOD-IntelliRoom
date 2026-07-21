import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import PrivateRoute from "./components/common/PrivateRoute";
import { ROLES } from "./utils/constants";

// Public
import Home from "./pages/public/Home";
import Rooms from "./pages/public/Rooms";
import RoomDetail from "./pages/public/RoomDetail";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Chatbot from "./pages/public/Chatbot";
import RealTimeDisplay from "./pages/public/RealTimeDisplay";

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

// Caissier
import CashierDashboard from "./pages/cashier/CashierDashboard";
import CashierPayments from "./pages/cashier/Invoices";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageRooms from "./pages/admin/ManageRooms";
import ManageUsers from "./pages/admin/ManageUsers";
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
        <Route path="/salles/:id" element={<RoomDetail />} />
        <Route path="/chatbot" element={<Chatbot />} />
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
          <Route path="/reception/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Espace caissier */}
      <Route element={<PrivateRoute roles={[ROLES.CAISSIER, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/caisse" element={<CashierDashboard />} />
          <Route path="/caisse/paiements" element={<CashierPayments />} />
          <Route path="/caisse/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Espace administrateur */}
      <Route element={<PrivateRoute roles={[ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/salles" element={<ManageRooms />} />
          <Route path="/admin/utilisateurs" element={<ManageUsers />} />
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
