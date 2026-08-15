import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useRooms } from "../../hooks/useRooms";
import { useAuth } from "../../hooks/useAuth";
import { useNotify } from "../../contexts/NotificationContext";
import { createBooking } from "../../api/bookingApi";
import BookingForm from "../../components/forms/BookingForm";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import { apiErrorMessage } from "../../utils/apiError";

export default function NewBooking() {
  const { rooms, loading } = useRooms();
  const { user } = useAuth();
  const { success, error: toastError } = useNotify();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await createBooking(payload);
      success("Demande envoyée. Le secrétariat général va l'examiner.");
      navigate("/client/reservations");
    } catch (e) {
      toastError(apiErrorMessage(e, "La réservation n'a pas pu être créée (créneau indisponible ?)."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Réservation"
        title="Réserver une salle"
        subtitle="Votre demande sera examinée par le secrétariat général avant validation. Aucun paiement à cette étape."
      />
      {loading ? <Loader /> : (
        <BookingForm
          rooms={rooms}
          user={user}
          initialRoomId={params.get("salle") ?? ""}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </>
  );
}