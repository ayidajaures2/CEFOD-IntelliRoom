// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import {
  FiCalendar,
  FiUsers,
  FiHome,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiEye,
  FiDollarSign,
  FiClock,
  FiBarChart2,
  FiShield,
  FiTrash2,
  FiSearch,
  FiEdit,
  FiPlus,
  FiUserPlus,
  FiRefreshCw,
  FiDownload,
  FiMoreVertical,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  ComposedChart,
  RadialBarChart,
  RadialBar,
} from 'recharts';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('bookings');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Vous devez être connecté');
        setLoading(false);
        return;
      }

      const [statsRes, bookingsRes, usersRes, roomsRes, chartRes, occupancyRes, revenueRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/bookings/recent', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/users/recent', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/rooms', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/chart-data', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/occupancy-data', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/revenue-data', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data);
      setRecentUsers(usersRes.data);
      setRooms(roomsRes.data);
      setChartData(chartRes.data);
      setOccupancyData(occupancyRes.data);
      setRevenueData(revenueRes.data);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const filteredBookings = recentBookings.filter(booking => {
    const matchSearch = booking.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        booking.salle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || booking.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (statut) => {
    const config = {
      effectuee: { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Effectuée' },
      en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ En attente' },
      annulee: { bg: 'bg-red-100', text: 'text-red-700', label: '❌ Annulée' },
      validee: { bg: 'bg-blue-100', text: 'text-blue-700', label: '🔵 Validée' },
      terminee: { bg: 'bg-gray-100', text: 'text-gray-700', label: '⚪ Terminée' }
    };
    return config[statut] || config.en_attente;
  };

  const getRoomStatusBadge = (statut) => {
    const config = {
      libre: { bg: 'bg-green-100', text: 'text-green-700', label: '🟢 Libre' },
      reservee: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '🟡 Réservée' },
      occupee: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴 Occupée' }
    };
    return config[statut] || config.libre;
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-700', label: '🛡️ Admin' },
      receptionniste: { bg: 'bg-blue-100', text: 'text-blue-700', label: '👩‍💼 Réceptionniste' },
      caissier: { bg: 'bg-green-100', text: 'text-green-700', label: '💰 Caissier' },
      client: { bg: 'bg-gray-100', text: 'text-gray-700', label: '👤 Client' }
    };
    return config[role] || config.client;
  };

  const COLORS = ['#22c55e', '#eab308', '#ef4444'];
  const CHART_COLORS = ['#f97316', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-900 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center gap-2 mt-1" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}: <span className="font-semibold">{formatter ? formatter(entry.value) : entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculer le taux de croissance (simulé)
  const growthRate = 12.5;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">❌ {error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* EN-TÊTE */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">
            Bienvenue, {user?.prenom} {user?.nom} 👋
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
            <FiTrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">+{growthRate}%</span>
            <span className="text-xs text-green-500">vs mois dernier</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
          </button>
        </div>
      </div>

      {/* STATISTIQUES PRINCIPALES - CARTES MODERNES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <FiArrowUp className="w-3 h-3" /> +12% ce mois
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
              <FiUsers className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Salles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRooms}</p>
              <p className="text-xs text-gray-500 mt-1">{rooms.filter(r => r.statut === 'libre').length} libres</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition">
              <FiHome className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Réservations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
              <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                <FiClock className="w-3 h-3" /> {stats.pendingBookings} en attente
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition">
              <FiCheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.totalRevenue?.toLocaleString() || 0} FCFA
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <FiArrowUp className="w-3 h-3" /> +8% ce mois
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
              <FiDollarSign className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* STATISTIQUES SECONDAIRES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">En attente</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pendingBookings}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <FiClock className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Effectuées</p>
              <p className="text-xl font-bold text-green-600">{stats.completedBookings}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <FiCheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Annulées</p>
              <p className="text-xl font-bold text-red-600">{stats.cancelledBookings}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <FiXCircle className="w-4 h-4 text-red-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Taux d'occupation</p>
              <p className="text-xl font-bold text-blue-600">{stats.occupancyRate}%</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FiTrendingUp className="w-4 h-4 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION GRAPHIQUES PRINCIPALE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique 1: Évolution des réservations */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">📈 Évolution des réservations</h3>
              <p className="text-xs text-gray-500">Nombre de réservations par mois</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Réservations
              </span>
              <button className="text-gray-400 hover:text-gray-600 transition">
                <FiMoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="mois" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip formatter={(v) => v} />} />
              <Area 
                type="monotone" 
                dataKey="reservations" 
                fill="url(#colorReservations)" 
                stroke="#f97316" 
                strokeWidth={2.5}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
                name="Réservations"
              />
              <Line 
                type="monotone" 
                dataKey="reservations" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                name="Réservations"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique 2: Occupation des salles */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">🏠 Occupation</h3>
              <p className="text-xs text-gray-500">État actuel des salles</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={85}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {occupancyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={(v) => v} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-1">
            {occupancyData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-xs text-gray-600">{entry.name}</span>
                <span className="text-xs font-semibold text-gray-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DEUXIÈME LIGNE DE GRAPHIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique 3: Revenus par salle */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">💰 Revenus par salle</h3>
              <p className="text-xs text-gray-500">Total des revenus générés par salle</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600 transition">
              <FiDownload className="w-4 h-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData} layout="vertical" margin={{ top: 5, right: 20, left: 70, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="#f97316" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="salle" stroke="#9ca3af" tick={{ fontSize: 10 }} width={60} />
              <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
              <Bar 
                dataKey="revenus" 
                fill="url(#colorRevenue)" 
                radius={[0, 6, 6, 0]}
                barSize={18}
                name="Revenus"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique 4: Résumé des KPIs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">📊 Résumé</h3>
              <p className="text-xs text-gray-500">Vue d'ensemble</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-50/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FiUsers className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Utilisateurs</p>
                  <p className="text-sm font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium">+12%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-50/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <FiCalendar className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Réservations</p>
                  <p className="text-sm font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium">+8%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-50/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <FiDollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Chiffre d'affaires</p>
                  <p className="text-sm font-bold text-green-600">{stats.totalRevenue?.toLocaleString() || 0} F</p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium">+8%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-50/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FiTrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Occupation</p>
                  <p className="text-sm font-bold text-purple-600">{stats.occupancyRate}%</p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium">+5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ONGLETS - Version simplifiée et plus ergonomique */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 px-4">
          <div className="flex gap-6 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-2 px-1 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === 'bookings'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiCalendar className="w-4 h-4" />
              Réservations
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{recentBookings.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center gap-2 px-1 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === 'rooms'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiHome className="w-4 h-4" />
              Salles
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{rooms.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-1 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiUsers className="w-4 h-4" />
              Utilisateurs
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{recentUsers.length}</span>
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* ONGLET RÉSERVATIONS */}
          {activeTab === 'bookings' && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <p className="text-sm text-gray-500">{recentBookings.length} réservations récentes</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-48"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="effectuee">✅ Effectuées</option>
                    <option value="en_attente">⏳ En attente</option>
                    <option value="annulee">❌ Annulées</option>
                    <option value="validee">🔵 Validées</option>
                    <option value="terminee">⚪ Terminées</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Client</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Salle</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Date</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Heure</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Montant</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Statut</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-8 text-gray-500">Aucune réservation trouvée</td></tr>
                    ) : (
                      filteredBookings.map((booking) => {
                        const status = getStatusBadge(booking.statut);
                        return (
                          <tr key={booking.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-2.5 font-medium text-gray-900">{booking.client}</td>
                            <td className="px-4 py-2.5 text-gray-700">{booking.salle}</td>
                            <td className="px-4 py-2.5 text-gray-700">{booking.date}</td>
                            <td className="px-4 py-2.5 text-gray-700">{booking.heure}</td>
                            <td className="px-4 py-2.5 text-gray-700">
                              {booking.montant > 0 ? `${booking.montant.toLocaleString()} FCFA` : '-'}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Détails">
                                <FiEye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ONGLET SALLES */}
          {activeTab === 'rooms' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">{rooms.length} salles</p>
                <Link to="/admin/rooms" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
                  <FiPlus className="w-4 h-4" /> Gérer les salles
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rooms.map((room) => {
                  const status = getRoomStatusBadge(room.statut);
                  return (
                    <div key={room.id_salle || room.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-sm transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{room.nom_salle || room.libelle || 'Salle'}</h4>
                          <p className="text-xs text-gray-500">{room.type_salle || room.type || 'Type'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-2 space-y-0.5 text-xs text-gray-600">
                        <p>👥 {room.capacite || 0} places</p>
                        <p>📦 {room.equipements || 'Non renseignés'}</p>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"><FiEdit className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"><FiTrash2 className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"><FiEye className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ONGLET UTILISATEURS */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">{recentUsers.length} utilisateurs récents</p>
                <Link to="/admin/users" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
                  <FiUserPlus className="w-4 h-4" /> Gérer les utilisateurs
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Nom</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Prénom</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Email</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Rôle</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Date</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentUsers.map((u) => {
                      const role = getRoleBadge(u.role);
                      return (
                        <tr key={u.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{u.nom}</td>
                          <td className="px-4 py-2.5 text-gray-700">{u.prenom}</td>
                          <td className="px-4 py-2.5 text-gray-700">{u.email}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${role.bg} ${role.text}`}>
                              {role.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">{u.date}</td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"><FiShield className="w-3.5 h-3.5" /></button>
                              <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"><FiTrash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;