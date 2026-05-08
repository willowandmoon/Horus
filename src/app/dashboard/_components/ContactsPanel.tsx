"use client";

import { useEffect, useState } from "react";

interface Contact {
    id: string;
    name: string;
    relation: string;
    phone: string;
}

interface ModalState {
    open: boolean;
    contact: Contact | null;
}

// ── Iconos ────────────────────────────────────────────────────────────────────

function IconPhone() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
        </svg>
    );
}

function IconPencil() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"/>
        </svg>
    );
}

function IconTrash() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
        </svg>
    );
}

function IconPlus() {
    return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
    );
}

function IconPerson() {
    return (
        <svg className="w-4 h-4 text-[#EF233C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
        </svg>
    );
}

function IconHeart() {
    return (
        <svg className="w-4 h-4 text-[#EF233C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
        </svg>
    );
}

// ── Fila de contacto ──────────────────────────────────────────────────────────
// Eliminación en dos pasos (click → confirmar) para evitar borrados accidentales.
function ContactRow({
    contact,
    onEdit,
    onDelete,
    confirmId,
    setConfirmId,
}: {
    contact: Contact;
    onEdit: (c: Contact) => void;
    onDelete: (id: string) => void;
    confirmId: string | null;
    setConfirmId: (id: string | null) => void;
}) {
    const isConfirming = confirmId === contact.id;

    return (
        <div className="flex items-center justify-between py-3 border-b border-[#EDF2F4] last:border-0 group">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#EF233C]/10 flex items-center justify-center shrink-0">
                    <IconPerson />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#EF233C] truncate">{contact.name}</p>
                    <p className="text-xs text-[#8D99AE] truncate">{contact.relation}{contact.relation && " • "}{contact.phone}</p>
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
                {isConfirming ? (
                    <>
                        <span className="text-xs text-[#8D99AE] mr-1">¿Eliminar?</span>
                        <button
                            onClick={() => onDelete(contact.id)}
                            className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                        >
                            Sí
                        </button>
                        <button
                            onClick={() => setConfirmId(null)}
                            className="px-2 py-1 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition-colors"
                        >
                            No
                        </button>
                    </>
                ) : (
                    <>
                        <a
                            href={`tel:${contact.phone.replace(/\s/g, "")}`}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[#8D99AE] hover:text-[#EF233C] hover:bg-[#EF233C]/10 transition-colors"
                            title={`Llamar a ${contact.name}`}
                        >
                            <IconPhone />
                        </a>
                        <button
                            onClick={() => onEdit(contact)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[#8D99AE] hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Editar"
                        >
                            <IconPencil />
                        </button>
                        <button
                            onClick={() => setConfirmId(contact.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[#8D99AE] hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                        >
                            <IconTrash />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Modal de agregar / editar ─────────────────────────────────────────────────

function ContactModal({
    modal,
    onClose,
    onSave,
    saving,
}: {
    modal: ModalState;
    onClose: () => void;
    onSave: (data: { name: string; relation: string; phone: string }) => Promise<void>;
    saving: boolean;
}) {
    const [form, setForm] = useState({ name: "", relation: "", phone: "" });

    useEffect(() => {
        setForm({
            name: modal.contact?.name ?? "",
            relation: modal.contact?.relation ?? "",
            phone: modal.contact?.phone ?? "",
        });
    }, [modal.contact]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim()) return;
        await onSave(form);
    }

    if (!modal.open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-base font-bold text-[#2B2D42] mb-5">
                    {modal.contact ? "Editar contacto" : "Agregar contacto"}
                </h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {/* Nombre */}
                    <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#EF233C] transition-colors">
                        <IconPerson />
                        <input
                            name="name"
                            type="text"
                            placeholder="Nombre completo"
                            value={form.name}
                            onChange={handleChange}
                            required
                            autoFocus
                            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                        />
                    </div>

                    {/* Relación */}
                    <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#EF233C] transition-colors">
                        <IconHeart />
                        <input
                            name="relation"
                            type="text"
                            placeholder="Relación (Familiar, Médico, Amigo…)"
                            value={form.relation}
                            onChange={handleChange}
                            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                        />
                    </div>

                    {/* Teléfono */}
                    <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#EF233C] transition-colors">
                        <IconPhone />
                        <input
                            name="phone"
                            type="tel"
                            placeholder="+57 300 000 0000"
                            value={form.phone}
                            onChange={handleChange}
                            required
                            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                        />
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !form.name.trim() || !form.phone.trim()}
                            className="flex-1 py-2.5 rounded-xl bg-[#EF233C] text-sm font-semibold text-white hover:bg-[#D90429] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Panel principal ───────────────────────────────────────────────────────────

export default function ContactsPanel() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loadError, setLoadError] = useState(false);
    const [modal, setModal]       = useState<ModalState>({ open: false, contact: null });
    const [saving, setSaving]     = useState(false);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    function loadContacts() {
        setLoadError(false);
        fetch("/api/contacts")
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data: unknown) => {
                if (Array.isArray(data)) setContacts(data as Contact[]);
                else setLoadError(true);
            })
            .catch(() => setLoadError(true));
    }

    // Carga inicial de contactos desde el servidor al montar el componente
    useEffect(() => {
        loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function openModal(contact: Contact | null = null) {
        setConfirmId(null);
        setModal({ open: true, contact });
    }

    function closeModal() {
        setModal({ open: false, contact: null });
    }

    async function handleSave(data: { name: string; relation: string; phone: string }) {
        setSaving(true);
        try {
            if (modal.contact) {
                // Editar
                const res = await fetch(`/api/contacts/${modal.contact.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                const updated = await res.json();
                setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            } else {
                // Agregar
                const res = await fetch("/api/contacts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                const created = await res.json();
                setContacts((prev) => [...prev, created]);
            }
            closeModal();
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        await fetch(`/api/contacts/${id}`, { method: "DELETE" });
        setContacts((prev) => prev.filter((c) => c.id !== id));
        setConfirmId(null);
    }

    return (
        <>
            <div className="bg-white rounded-2xl p-5 shadow-sm flex-1">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <IconHeart />
                        <h2 className="text-sm font-bold text-[#2B2D42] uppercase tracking-wide">Contactos personales</h2>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="w-7 h-7 rounded-full bg-[#EF233C] flex items-center justify-center hover:bg-[#D90429] transition-colors"
                        title="Agregar contacto"
                    >
                        <IconPlus />
                    </button>
                </div>

                {loadError ? (
                    <div className="text-center py-6">
                        <p className="text-xs text-red-400 mb-2">No se pudieron cargar los contactos</p>
                        <button onClick={loadContacts} className="text-xs text-[#EF233C] underline">Reintentar</button>
                    </div>
                ) : contacts.length === 0 ? (
                    <p className="text-xs text-[#8D99AE] text-center py-6">
                        No hay contactos. Agrega uno con el botón +
                    </p>
                ) : (
                    contacts.map((c) => (
                        <ContactRow
                            key={c.id}
                            contact={c}
                            onEdit={openModal}
                            onDelete={handleDelete}
                            confirmId={confirmId}
                            setConfirmId={setConfirmId}
                        />
                    ))
                )}
            </div>

            <ContactModal
                modal={modal}
                onClose={closeModal}
                onSave={handleSave}
                saving={saving}
            />
        </>
    );
}
