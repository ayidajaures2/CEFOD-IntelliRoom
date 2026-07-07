// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import DashboardLayout from './layouts/DashboardLayout';
import PrivateRoute from './components/common/PrivateRoute';

// Client
import ClientDashboard from './pages/client/Dashboard';
import Profile from './pages/client/Profile';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/Profile';
import AdminRooms from './pages/admin/ManageRooms';
import AdminUsers from './pages/admin/ManageUsers';
import AdminSettings from './pages/admin/Settings';

// Réceptionniste
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import ReceptionistBookings from './pages/receptionist/ManageBookings';
import ConversationsList from './pages/receptionist/ConversationsList';
import ConversationDetail from './pages/receptionist/ConversationDetail';

// Caissier
import CashierDashboard from './pages/cashier/CashierDashboard';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Client */}
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bookings/new" element={<div>Nouvelle réservation</div>} />
            <Route path="/my-bookings" element={<div>Mes réservations</div>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/rooms" element={<AdminRooms />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/profile" element={<AdminProfile />} />

            {/* Réceptionniste */}
            <Route path="/receptionist" element={<ReceptionistDashboard />} />
            <Route path="/receptionist/bookings" element={<ReceptionistBookings />} />
            <Route path="/receptionist/bookings/new" element={<div>Nouvelle réservation</div>} />
            <Route path="/receptionist/conversations" element={<ConversationsList />} />
            <Route path="/receptionist/conversations/:id" element={<ConversationDetail />} />
            <Route path="/receptionist/profile" element={<Profile />} />

            {/* Caissier */}
            <Route path="/cashier" element={<CashierDashboard />} />
            <Route path="/cashier/profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;