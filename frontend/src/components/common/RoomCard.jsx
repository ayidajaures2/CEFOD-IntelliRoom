// src/components/common/RoomCard.jsx
import { Link } from 'react-router-dom';

function RoomCard({ room }) {
  const lowestPrice = room.tarifs?.reduce((min, t) => (t.prix < min ? t.prix : min), Infinity) || 0;

  return (
    <div className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition bg-white">
      <div className="p-5">
        <h3 className="text-xl font-semibold mb-2">{room.nom_salle}</h3>
        <p className="text-gray-600 mb-2">Capacité : {room.capacite} personnes</p>
        <p className="text-gray-600 mb-4">Type : {room.type_salle}</p>
        <div className="flex justify-between items-center">
          <span className="text-blue-600 font-bold">
            À partir de {lowestPrice.toLocaleString()} FCFA
          </span>
          <Link
            to={`/rooms/${room.id_salle}`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            Détails
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RoomCard;