// src/pages/public/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRooms } from '../../api/roomApi';
import RoomCard from '../../components/common/RoomCard';

function Home() {
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRooms({ limit: 3 })
      .then(data => setFeaturedRooms(data.slice(0, 3)))
      .catch(error => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-black h-16 text-white p-4">
        <div className="container mx-auto">
          
          <Link to="/" className="text-xl font-bold">
            CEFOD IntelliRoom
          </Link>

          <div className="float-right mr-4">
            <Link to="/login" className=" w-10 text-white px-8 py-3 my-5 rounded-lg font-semibold hover:text-orange-500 transition shadow-md hover:shadow-orange-400">
              Se connecter
            </Link>
          </div>
        </div>
      </nav>
      {/* HERO SECTION avec logo */}
      <section className=" text-black border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-xl mx-auto text-center">
            <img src="/small-logo-white.jpeg" alt="CEFOD IntelliRoom" className="h-40  mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4" >
              CEFOD Intell<span className="text-orange-500">i</span>Room
            </h1>
            <p className="text-xl md:text-2xl mb-6">
              Rapidité, simplicité et efficacité dans la gestion intelligente des réservations.
            </p>
            <div className="flex  sm:flex-row gap-4 justify-center">
              
              <Link
                to="/register"
                className=" border-black  text-black px-6 py-3 rounded-lg font-semibold border-2  hover:text-white hover:bg-black transition"
              >
                Créer un compte
              </Link>
              
            </div>
          </div>
        </div>
      </section>

{/* Présentation du CEFOD */}
      <section className="py-16 bg-gray-200">
        <div className="container  mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">A propos du CEFOD</h2>
          <p className="text-xl text-justify font-mono md:text-2xl mb-6">
              Créé en 1967 et reconnu d’utilité publique, Le <span className="font-bold">CEFOD</span> (Centre d’Étude et de Formation pour le Développement) est une institution de référence au Tchad dans les domaines de la formation, de la recherche, de la documentation et du développement. Grâce à ses départements spécialisés et à son expertise reconnue, le CEFOD accompagne les acteurs publics, privés et associatifs dans leurs projets et initiatives. Engagé pour la promotion du savoir, de l’innovation et du développement durable, il contribue activement au progrès intellectuel, économique et social du Tchad.
            </p>

            <h2 className="text-2xl font-bold text-center mb-12">Principaux services</h2>
          <div className="grid lg:grid-cols-5 md:grid-cols-3 gap-8">
            
            <div className="text-center rounded-xl p-6 bg-white  shadow-md hover: transition-all duration-300 hover:shadow-[0_0_12px_#f97316]">
              <div className="text-5xl mb-3">📅</div>
              <h3 className="text-xl font-semibold mb-2">Location des salles</h3>
              <p className="text-gray-600">Une large varité de salles mise à la disposition des usagers.</p>
            </div>
            <div className="text-center rounded-xl p-6 bg-white  shadow-md hover: transition-all duration-300 hover:shadow-[0_0_12px_#f97316]">
              <div className="text-5xl mb-3">🟢🔴</div>
              <h3 className="text-xl font-semibold mb-2">Formations</h3>
              <p className="text-gray-600">Des formations professionnelles et universitaires.</p>
            </div>
            <div className="text-center rounded-xl p-6 bg-white  shadow-md hover: transition-all duration-300 hover:shadow-[0_0_12px_#f97316]">
              <div className="text-5xl mb-3">🤖</div>
              <h3 className="text-xl font-semibold mb-2">Recherches</h3>
              <p className="text-gray-600">Des Etudes et recherches axées sur le Développement.</p>
            </div>
            <div className="text-center rounded-xl p-6 bg-white  shadow-md hover: transition-all duration-300 hover:shadow-[0_0_12px_#f97316]">
              <div className="text-5xl mb-3">🤖</div>
              <h3 className="text-xl font-semibold mb-2">Edition</h3>
              <p className="text-gray-600">Une maison d'édition et de production médiatique.</p>
            </div>
            <div className="text-center rounded-xl p-6 bg-white  shadow-md hover: transition-all duration-300 hover:shadow-[0_0_12px_#f97316]">
              <div className="text-5xl mb-3">🤖</div>
              <h3 className="text-xl font-semibold mb-2">Bibliothèque</h3>
              <p className="text-gray-600">Un espace bibliothèque moderne et accessible.</p>
            </div>
          </div>
        </div>
      </section>
 
      {/* SERVICES / AVANTAGES */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Présentation de la plateforme CEFOD IntelliRoom</h2>
          <p className="text-xl text-center md:text-2xl mb-6">
              CEFOD IntelliRoom est une plateforme de gestion intelligente des réservations de salles, conçue pour offrir une expérience utilisateur fluide et efficace. Grâce à son interface intuitive, les utilisateurs peuvent facilement réserver des salles, consulter leur disponibilité en temps réel et bénéficier d'un chatbot intelligent pour répondre à leurs questions. Que vous soyez un étudiant, un professionnel ou un organisateur d'événements, CEFOD IntelliRoom simplifie la gestion de vos réservations et optimise l'utilisation des ressources du CEFOD.
            </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg hover:border-orange-300 transition duration-300">
              <div className=" m-28 mt-3 mb-3"><img src="calendar-check-svgrepo-com.svg" alt="Réservation simplifiée" /></div>
              <h3 className="text-xl font-semibold mb-2">Réservation simplifiée</h3>
              <p className="text-gray-600">Réservez une salle en quelques clics, 24h/24, 7j/7.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg hover:border-orange-300 transition duration-300">
              <div className=" m-28 mt-3 mb-3"><img src="monitor-svgrepo-com.svg" alt="Affichage temps réel" /></div>
              <h3 className="text-xl font-semibold mb-2">Affichage temps réel</h3>
              <p className="text-gray-600">Consultez en direct la disponibilité des salles.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg hover:border-orange-300 transition duration-300">
              <div className=" m-28 mt-3 mb-3"><img src="chat-check-svgrepo-com.svg" alt="Chatbot intelligent" /></div>
              <h3 className="text-xl font-semibold mb-2">Chatbot intelligent</h3>
              <p className="text-gray-600">Obtenez des réponses instantanées à vos questions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* APERÇU DES SALLES */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nos salles les plus demandées</h2>
          {loading ? (
            <div className="text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRooms.map(room => (
                <RoomCard key={room.id_salle} room={room} />
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/rooms"
              
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:text-black transition shadow-md hover:shadow-orange-300"
            >
              Voir toutes les salles →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-gray-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à optimiser la gestion de vos salles ?</h2>
          <p className="text-xl mb-6">Rejoignez-nous dès maintenant et simplifiez vos réservations.</p>
          
        </div>
      </section>
      <footer>
        <div className="container mx-auto px-4 py-6 text-center text-gray-500">
          &copy; {new Date().getFullYear()} <a href="https://www.linkedin.com/company/centre-d-etudes-et-de-formation-pour-le-d%C3%A9veloppement-cefod/" className="text-orange-500 hover:underline">CEFOD</a> IntelliRoom. Tous droits réservés.
          
        </div>
      </footer>
      

    </div>
  );
}

export default Home;