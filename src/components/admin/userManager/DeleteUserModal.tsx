import { Trash2 } from "lucide-react";

interface Props {
  userName: string
  onCancel: () => void
  onConfirm: () => void
  isDeleting: boolean
}

export const DeleteUserModal = ({ userName, onCancel, onConfirm, isDeleting }: Props) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-[420px] shadow-2xl">

        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="text-red-500"/>
          <h3 className="text-lg font-bold text-white">
            Elimina utente
          </h3>
        </div>

        <p className="text-slate-400 mb-6">
          Sei sicuro di voler eliminare <span className="text-white font-bold">{userName}</span>?
          Questa operazione è irreversibile.
        </p>

        <div className="flex justify-end gap-3">

          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
          >
            Annulla
          </button>

          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white"
          >
            {isDeleting ? "Eliminazione..." : "Elimina"}
          </button>

        </div>

      </div>
    </div>
  )
}