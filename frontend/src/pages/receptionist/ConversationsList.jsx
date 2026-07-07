// frontend/src/pages/receptionist/ConversationsList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import { FiSearch, FiMessageSquare, FiClock, FiEye } from 'react-icons/fi';

function ConversationsList() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/receptionist/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des conversations');
      setLoading(false);
      console.error(err);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.sujet?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💬 Messages</h1>
          <p className="text-gray-600 mt-1">Consultez et gérez les discussions avec les clients</p>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiMessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>Aucune conversation trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                to={`/receptionist/conversations/${conv.id}`}
                className="block p-4 hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold">
                      {conv.client?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{conv.client}</p>
                        <span className="text-xs text-gray-500">{conv.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{conv.last_message}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiMessageSquare className="w-3 h-3" />
                          {conv.messages_count} messages
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {conv.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="text-orange-500 hover:text-orange-600 p-2 rounded-lg hover:bg-orange-50 transition">
                    <FiEye className="w-5 h-5" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationsList;