"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import FloatingSidebar from "@/src/components/FloatingSidebar";

interface DocumentItem {
    fileUrl: string;
    publicId: string;
    extractedText: string;
    fileType: string;
    uploadedAt: string;
    filename?: string;
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pdf: {
        label: "PDF",
        color: "text-red-700",
        bg: "bg-red-50 border-red-100",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
        ),
    },
    image: {
        label: "Imagen",
        color: "text-purple-700",
        bg: "bg-purple-50 border-purple-100",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
        ),
    },
    word: {
        label: "Word",
        color: "text-blue-700",
        bg: "bg-blue-50 border-blue-100",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
        ),
    },
    json: {
        label: "JSON",
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-100",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
        ),
    },
    text: {
        label: "Texto",
        color: "text-green-700",
        bg: "bg-green-50 border-green-100",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
        ),
    },
    other: {
        label: "Archivo",
        color: "text-[#8D99AE]",
        bg: "bg-[#F2F1EC] border-[#E4E2DC]",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
            </svg>
        ),
    },
};

function getTypeMeta(fileType: string) {
    const t = (fileType ?? "").toLowerCase();
    if (t.includes("pdf")) return TYPE_META.pdf;
    if (t.includes("png") || t.includes("jpg") || t.includes("jpeg") || t.includes("gif") || t.includes("webp") || t.includes("image")) return TYPE_META.image;
    if (t.includes("doc") || t.includes("word")) return TYPE_META.word;
    if (t.includes("json")) return TYPE_META.json;
    if (t.includes("text") || t.includes("txt") || t.includes("csv")) return TYPE_META.text;
    return TYPE_META.other;
}

function safeDate(raw: string | undefined | null): string {
    if (!raw) return "—";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function getFilename(doc: DocumentItem): string {
    if (doc.filename && doc.filename.trim()) return doc.filename;
    try {
        const segments = (doc.publicId ?? doc.fileUrl ?? "").split("/");
        const last = segments[segments.length - 1] ?? "";
        return decodeURIComponent(last) || "Documento";
    } catch {
        return "Documento";
    }
}

export default function ArchivosPage() {
    const [userId, setUserId] = useState<string>("");
    const [docs, setDocs] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<DocumentItem | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocs = useCallback((uid: string) => {
        setLoading(true);
        fetch(`/api/medical-history?userId=${uid}`)
            .then((r) => r.json())
            .then((data) => {
                const documents: DocumentItem[] = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.documents)
                    ? data.documents
                    : [];
                setDocs(documents);
            })
            .catch(() => setError("No se pudieron cargar los documentos."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((data) => {
                if (data?.id) {
                    setUserId(data.id);
                    fetchDocs(data.id);
                } else {
                    window.location.href = "/login";
                }
            })
            .catch(() => {
                window.location.href = "/login";
            });
    }, [fetchDocs]);

    async function upload(file: File) {
        if (!userId) return;
        setUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        try {
            const res = await fetch("/api/medical-history/uploadDocuments", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.error ?? "Error al subir el archivo");
            }
            fetchDocs(userId);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al procesar el archivo");
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(publicId: string) {
        if (!confirm("¿Eliminar este documento? Esta acción no se puede deshacer.")) return;
        setDocs((prev) => prev.filter((d) => d.publicId !== publicId));
        try {
            await fetch(`/api/medical-history?publicId=${encodeURIComponent(publicId)}&userId=${encodeURIComponent(userId)}`, {
                method: "DELETE",
            });
        } catch {
            // optimistic — already removed from UI
        }
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) upload(file);
        e.target.value = "";
    }

    function onDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) upload(file);
    }

    const lastUploaded = docs.reduce<string | null>((acc, d) => {
        if (!acc) return d.uploadedAt ?? null;
        return new Date(d.uploadedAt) > new Date(acc) ? d.uploadedAt : acc;
    }, null);

    return (
        <div className="min-h-screen bg-[#F2F1EC] text-[#1C1917]">
            <FloatingSidebar />

            <main className="lg:pl-72 px-5 pt-8 pb-16 max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="mb-8 pl-0 lg:pl-2">
                    <h1 className="text-3xl font-black font-display text-[#1C1917] tracking-tight">Mis archivos</h1>
                    <p className="text-sm text-[#8D99AE] font-semibold mt-1">Documentos y reportes médicos digitalizados</p>
                </div>

                {/* Stats row */}
                {docs.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-8">
                        <div className="flex items-center gap-3 bg-white border border-[#E4E2DC] rounded-2xl px-5 py-3 shadow-sm">
                            <span className="w-9 h-9 rounded-xl bg-[#FDF2B2] flex items-center justify-center text-lg">📁</span>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#8D99AE]">Total</p>
                                <p className="text-xl font-black text-[#1C1917] leading-none">{docs.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white border border-[#E4E2DC] rounded-2xl px-5 py-3 shadow-sm">
                            <span className="w-9 h-9 rounded-xl bg-[#E3F2FD] flex items-center justify-center text-lg">🗓️</span>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#8D99AE]">Último subido</p>
                                <p className="text-sm font-black text-[#1C1917] leading-none">{safeDate(lastUploaded)}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left: Upload zone */}
                    <div className="xl:col-span-1 space-y-4">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className={`relative cursor-pointer rounded-[28px] border-2 border-dashed p-8 flex flex-col items-center justify-center text-center transition-all duration-200 select-none
                                ${dragOver
                                    ? "border-[#FAD957] bg-[#FDF2B2]/60 scale-[1.01]"
                                    : "border-[#E4E2DC] bg-white hover:border-[#FAD957] hover:bg-[#FEFDF8]"
                                }`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors
                                ${dragOver ? "bg-[#FAD957] text-[#482D00]" : "bg-[#F2F1EC] text-[#8D99AE]"}`}
                            >
                                {uploading ? (
                                    <svg className="w-7 h-7 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25v-10.5A2.25 2.25 0 0 0 17.25 4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                )}
                            </div>
                            <p className="text-sm font-black text-[#1C1917] mb-1">
                                {uploading ? "Procesando documento..." : dragOver ? "Suelta aquí" : "Subir documento"}
                            </p>
                            <p className="text-xs text-[#8D99AE] font-semibold">
                                {uploading ? "Extrayendo texto con IA..." : "PDF, imagen, Word, JSON, TXT · máx 25 MB"}
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.json,.txt,.csv"
                                className="hidden"
                                onChange={onFileChange}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-xs font-semibold flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Tip card */}
                        <div className="bg-[#FDF2B2] border border-[#FAD957]/40 rounded-[24px] px-5 py-4">
                            <p className="text-xs font-black text-[#5C4D04] uppercase tracking-widest mb-1">IA activa</p>
                            <p className="text-sm font-semibold text-[#5C4D04] leading-relaxed">
                                Cada archivo que subas es procesado automáticamente para extraer su contenido y hacerlo consultable desde el asistente médico.
                            </p>
                        </div>
                    </div>

                    {/* Right: Document grid */}
                    <div className="xl:col-span-2">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#8D99AE] mb-4 px-1">Documentos recientes</h2>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-white rounded-[24px] h-24 shadow-sm border border-[#E4E2DC] animate-pulse" />
                                ))}
                            </div>
                        ) : docs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center bg-white border border-[#E4E2DC] rounded-[28px] py-16 px-6">
                                <span className="text-5xl mb-4">📂</span>
                                <p className="text-base font-black text-[#1C1917] mb-1">Sin documentos aún</p>
                                <p className="text-sm text-[#8D99AE] font-semibold max-w-xs">
                                    Sube tu primer documento médico usando el panel de la izquierda.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {docs.map((doc, idx) => {
                                    const meta = getTypeMeta(doc.fileType);
                                    const name = getFilename(doc);
                                    return (
                                        <div
                                            key={doc.publicId || idx}
                                            className="group relative bg-white rounded-[24px] border border-[#E4E2DC] shadow-sm hover:shadow-md transition-all duration-200 p-4 flex gap-4 items-start overflow-hidden"
                                        >
                                            {/* Type badge */}
                                            <div className={`w-12 h-12 rounded-2xl border flex-shrink-0 flex items-center justify-center ${meta.bg} ${meta.color}`}>
                                                {meta.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} border ${meta.bg.replace("bg-", "border-")}`}>
                                                        {meta.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-[#1C1917] truncate leading-tight">{name}</p>
                                                <p className="text-[11px] text-[#8D99AE] font-semibold mt-0.5">{safeDate(doc.uploadedAt)}</p>
                                                {doc.extractedText && (
                                                    <p className="text-[11px] text-[#8D99AE] mt-1 line-clamp-2 leading-relaxed">
                                                        {doc.extractedText.slice(0, 120)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions — visible on hover */}
                                            <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Descargar"
                                                    className="w-8 h-8 rounded-xl bg-[#F2F1EC] hover:bg-[#E4E2DC] border border-[#E4E2DC] flex items-center justify-center text-[#1C1917] transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                    </svg>
                                                </a>
                                                <button
                                                    onClick={() => setPreview(doc)}
                                                    title="Vista previa"
                                                    className="w-8 h-8 rounded-xl bg-[#F2F1EC] hover:bg-[#E4E2DC] border border-[#E4E2DC] flex items-center justify-center text-[#1C1917] transition-colors cursor-pointer"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.publicId)}
                                                    title="Eliminar"
                                                    className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center text-red-600 transition-colors cursor-pointer"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Preview modal */}
            {preview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/40 backdrop-blur-sm"
                    onClick={() => setPreview(null)}
                >
                    <div
                        className="bg-white rounded-[28px] border border-[#E4E2DC] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E2DC]">
                            <div className="min-w-0">
                                <p className="text-sm font-black text-[#1C1917] truncate">{getFilename(preview)}</p>
                                <p className="text-xs text-[#8D99AE] font-semibold">{safeDate(preview.uploadedAt)}</p>
                            </div>
                            <button
                                onClick={() => setPreview(null)}
                                className="w-9 h-9 rounded-full bg-[#F2F1EC] hover:bg-[#E4E2DC] flex items-center justify-center transition-colors cursor-pointer border-none ml-4 shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6">
                            {preview.extractedText ? (
                                <div className="bg-[#F2F1EC] rounded-[20px] p-5">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-[#8D99AE] mb-3">Texto extraído</p>
                                    <p className="text-sm text-[#1C1917] leading-relaxed whitespace-pre-wrap font-medium">
                                        {preview.extractedText}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <span className="text-4xl mb-3">📄</span>
                                    <p className="text-sm font-bold text-[#1C1917]">Sin texto extraído</p>
                                    <p className="text-xs text-[#8D99AE] font-semibold mt-1">Este archivo no contiene texto procesable.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
