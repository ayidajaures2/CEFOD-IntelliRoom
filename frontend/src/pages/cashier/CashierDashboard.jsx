// src/pages/cashier/CashierDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiCreditCard, FiCheckCircle, FiClock, FiDollarSign } from 'react-icons/fi';

function CashierDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingPayments: 0,
    validatedPayments: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        pendingPayments: 4,
        validatedPayments: 12,
        totalRevenue: 350000
      });
      setPendingPayments([
        { id: 1, client: 'Jean Dupont', salle: 'SALLE 3', montant: 50000, mode: 'Mobile Money' },
        { id: 2, client: 'Marie Kone', salle: 'SALLE 10', montant: 55000, mode: 'Espèces' },
        { id: 3, client: 'Amadou Diop', salle: 'SALLE 16', montant: 40000, mode: 'Mobile Money' },
        { id: 4, client: 'Fatou Ndiaye', salle: 'SALLE 66', montant: 55000, mode: 'Espèces' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  const handleValidatePayment = (id) => {
    alert(`Paiement #${id} validé !`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Tableau de bord Caissier
        </h1>
        <p className="text-gray-600 mt-1">Bienvenue, {user?.prenom} {user?.nom}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paiements en attente</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingPayments}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FiClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paiements validés</p>
              <p className="text-3xl font-bold text-green-600">{stats.validatedPayments}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total encaissé</p>
              <p className="text-3xl font-bold text-orange-500">
                {stats.totalRevenue.toLocaleString()} FCFA
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiDollarSign className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Paiements en attente</h2>
          <span className="text-sm text-gray-500">{pendingPayments.length} en attente</span>
        </div>
        <div className="p-6">
          {pendingPayments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun paiement en attente</p>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.client}</p>
                    <p className="text-sm text-gray-500">{payment.salle} - {payment.mode}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-orange-500">
                      {payment.montant.toLocaleString()} FCFA
                    </span>
                    <button
                      onClick={() => handleValidatePayment(payment.id)}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      Valider
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 text-center">
          <Link to="/cashier/invoices" className="text-orange-500 hover:text-orange-600 font-medium">
            Voir l'historique des paiements →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CashierDashboard;