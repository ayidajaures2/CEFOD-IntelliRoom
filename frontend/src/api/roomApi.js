// src/api/roomApi.js
import axios from 'axios';

// Données factices en attendant l'API Laravel
const mockRooms = [
  {
    id_salle: 1,
    nom_salle: 'SALLE 3',
    capacite: 35,
    type_salle: 'Réunion',
    description: 'Salle de réunion standard',
    equipements: 'Vidéoprojecteur, climatisation',
    tarifs: [
      { id_tarif: 1, categorie_client: 'org_internationale', prix: 50000, unite: 'jour' },
      { id_tarif: 2, categorie_client: 'admin_ong', prix: 40000, unite: 'jour' },
      { id_tarif: 3, categorie_client: 'association_base', prix: 25000, unite: 'jour' }
    ]
  },
  {
    id_salle: 2,
    nom_salle: 'SALLE 10',
    capacite: 50,
    type_salle: 'Réunion',
    description: 'Grande salle de réunion',
    equipements: 'Vidéoprojecteur, climatisation, sonorisation',
    tarifs: [
      { id_tarif: 4, categorie_client: 'org_internationale', prix: 55000, unite: 'jour' },
      { id_tarif: 5, categorie_client: 'admin_ong', prix: 40000, unite: 'jour' },
      { id_tarif: 6, categorie_client: 'association_base', prix: 30000, unite: 'jour' }
    ]
  },
  {
    id_salle: 3,
    nom_salle: 'SALLE 66',
    capacite: 35,
    type_salle: 'Réunion',
    description: 'Salle équipée',
    equipements: 'Vidéoprojecteur, climatisation',
    tarifs: [
      { id_tarif: 7, categorie_client: 'org_internationale', prix: 55000, unite: 'jour' },
      { id_tarif: 8, categorie_client: 'admin_ong', prix: 40000, unite: 'jour' },
      { id_tarif: 9, categorie_client: 'association_base', prix: 30000, unite: 'jour' }
    ]
  },
  {
    id_salle: 4,
    nom_salle: 'SALLE 16',
    capacite: 40,
    type_salle: 'Réunion',
    description: 'Salle premium à l’heure',
    equipements: 'Vidéoprojecteur, climatisation, tableau interactif',
    tarifs: [
      { id_tarif: 10, categorie_client: 'org_internationale', prix: 55000, unite: 'heure' },
      { id_tarif: 11, categorie_client: 'admin_ong', prix: 40000, unite: 'heure' },
      { id_tarif: 12, categorie_client: 'association_base', prix: 30000, unite: 'heure' }
    ]
  },
  {
    id_salle: 5,
    nom_salle: 'SALLE AMPHITHEATRE SOUMAINE',
    capacite: 150,
    type_salle: 'Amphithéâtre',
    description: 'Grand amphithéâtre',
    equipements: 'Sonorisation, scène, écran géant, climatisation',
    tarifs: [
      { id_tarif: 13, categorie_client: 'org_internationale', prix: 55000, unite: 'heure' },
      { id_tarif: 14, categorie_client: 'admin_ong', prix: 40000, unite: 'heure' },
      { id_tarif: 15, categorie_client: 'association_base', prix: 30000, unite: 'heure' }
    ]
  },
  {
    id_salle: 6,
    nom_salle: 'SALLE MULTIMEDIA',
    capacite: 300,
    type_salle: 'Multimédia',
    description: 'Grande salle multimédia',
    equipements: 'Équipements audiovisuels, sonorisation, vidéoprojecteur',
    tarifs: [
      { id_tarif: 16, categorie_client: 'org_internationale', prix: 50000, unite: 'heure' },
      { id_tarif: 17, categorie_client: 'admin_ong', prix: 30000, unite: 'heure' },
      { id_tarif: 18, categorie_client: 'association_base', prix: 25000, unite: 'heure' }
    ]
  }
];

export const getRooms = async (params = {}) => {
  // Ici vous pourrez plus tard remplacer par un vrai appel axios
  // const response = await axios.get('/api/rooms', { params });
  // return response.data;
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockRooms), 500);
  });
};