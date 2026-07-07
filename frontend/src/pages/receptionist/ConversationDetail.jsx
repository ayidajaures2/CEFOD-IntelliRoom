// frontend/src/pages/receptionist/ConversationDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import { FiArrowLeft, FiSend } from 'react-icons/fi';

function ConversationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversation();
  }, [id]);

  const fetchConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/receptionist/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversation(response.data.conversation);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/receptionist/conversations/${id}/messages`, 
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      fetchConversation();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/receptionist/conversations')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold">
            {conversation?.client?.charAt(0) || 'C'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{conversation?.client || 'Client'}</h2>
            <p className="text-sm text-gray-500">
              {conversation?.status || 'En ligne'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun message</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.expediteur === 'receptionniste' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    msg.expediteur === 'receptionniste'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.contenu}</p>
                  <p className={`text-xs mt-1 ${msg.expediteur === 'receptionniste' ? 'text-orange-100' : 'text-gray-400'}`}>
                    {new Date(msg.date_envoi).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
        >
          <FiSend className="w-5 h-5" />
          {sending ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
}

export default ConversationDetail;