import { useState } from "react";
import { useRooms } from "../../hooks/useRooms";
import { createRoom, updateRoom, deleteRoom, updateRoomPrices } from "../../api/roomApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import Modal from "../../components/common/Modal";
import RoomForm from "../../components/forms/RoomForm";
import { apiErrorMessage } from "../../utils/apiError";

export default function ManageRooms() {
  const { rooms, loading, reload } = useRooms();
  const { success, error: toastError } = useNotify();
  const [editing, setEditing] = useState(null);   // salle en édition
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const save = async (payload) => {
    setSubmitting(true);
    const { tarifs, ...room } = payload;
    try {
      let roomId = editing?.id_salle;
      if (editing) {
        await updateRoom(roomId, room);
      } else {
        const { data } = await createRoom(room);
        const created = data.data ?? data.salle ?? data;
        roomId = created?.id_salle;
      }
      // Grille tarifaire via la route dédiée PUT /admin/rooms/{id}/prices
      if (roomId && tarifs?.length) {
        try { await updateRoomPrices(roomId, tarifs); }
        catch { toastError("Salle enregistrée, mais la grille tarifaire n'a pas pu être sauvegardée."); }
      }
      success(editing ? "Salle mise à jour." : "Salle créée.");
      setEditing(null);
      setCreating(false);
      reload();
    } catch (e) {
      toastError(apiErrorMessage(e, "Enregistrement impossible."));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (room) => {
    if (!window.confirm(`Supprimer « ${room.nom_salle} » ? Cette action est définitive.`)) return;
    try {
      await deleteRoom(room.id_salle);
      success("Salle supprimée.");
      reload();
    } catch (e) {
      // 409 renvoyé par le backend si des réservations/tarifs sont liés (CLAUDE.md §6)
      toastError(apiErrorMessage(e, "Suppression impossible : des réservations sont liées à cette salle."));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Salles & tarifs"
        actions={<button className="btn-primary" onClick={() => setCreating(true)}>Ajouter une salle</button>}
      />

      {loading && <Loader />}
      {!loading && rooms.length === 0 && (
        <EmptyState title="Aucune salle" hint="Créez la première salle du catalogue."
          action={<button className="btn-primary" onClick={() => setCreating(true)}>Ajouter une salle</button>} />
      )}

      {rooms.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>Salle</th><th>Type</th><th>Capacité</th><th>Statut actuel</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id_salle}>
                  <td className="font-medium">{r.nom_salle}</td>
                  <td className="text-ink/60">{r.type_salle}</td>
                  <td>{r.capacite} places</td>
                  <td><StatutBadge statut={r.statut_effectif ?? r.statut} /></td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => setEditing(r)}>Modifier</button>
                      <button className="btn-ghost px-3 py-1.5 text-xs text-accent-dark" onClick={() => remove(r)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating || Boolean(editing)} wide title={editing ? `Modifier « ${editing.nom_salle} »` : "Nouvelle salle"}
        onClose={() => { setCreating(false); setEditing(null); }}>
        <RoomForm key={editing?.id_salle ?? "new"} initial={editing} onSubmit={save} submitting={submitting} />
      </Modal>
    </>
  );
}
