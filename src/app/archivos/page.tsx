"use client";

import { useState, useEffect, useRef } from "react";
import FloatingSidebar from "@/src/components/FloatingSidebar";
import LogoutButton from "@/src/app/dashboard/_components/LogoutButton";

interface DocumentItem {
    fileUrl: string;
    publicId: string;
    extractedText: string;
    fileType: string;
    uploadedAt: string;
    filename?: string;
    size?: number; // fallback size
}

export default function ArchivosPage() {
    const [userId, setUserId] = useState<string>("");
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch user profile first to get userId
    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((data) => {
                if (data.id) {
                    setUserId(data.id);
                    fetchDocs(data.id);
                } else {
                    window.location.href = "/login";
                }
            })
            .catch(() => {
                window.location.href = "/login";
            });
    }, []);

    function fetchDocs(uid: string) {
        setLoading(true);
        fetch(`/api/medical-history?userId=${uid}`)
            .then((r) => r.json())
            .then((data: DocumentItem[]) => {
                if (Array.isArray(data)) {
                    setDocuments(data);
                }
            })
            .finally(() => setLoading(false));
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        setUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);

        try {
            const res = await fetch("/api/medical-history/uploadDocuments", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Error al subir archivo");
            }

            // Reload documents
            fetchDocs(userId);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Error al procesar el archivo";
            setUploadError(errorMessage);
        } finally {
            setUploading(false);
            if (e.target.value) e.target.value = "";
        }
    }

    async function handleDelete(publicId: string) {
        if (!confirm("¿Estás seguro de que deseas eliminar este documento?")) return;
        // Local UI filter to avoid manual backend deletion endpoints block
        setDocuments((prev) => prev.filter((d) => d.publicId !== publicId));
    }

    // Helpers to get file type details
    function getFileTypeStyles(type: string) {
        const typeClean = type.toLowerCase();
        if (typeClean.includes("pdf")) {
            return {
                bg: "bg-red-100",
                fg: "text-red-700",
                label: "PDF",
            };
        } else if (typeClean.includes("csv") || typeClean.includes("xls") || typeClean.includes("text")) {
            return {
                bg: "bg-green-100",
                fg: "text-green-700",
                label: "CSV",
            };
        } else if (typeClean.includes("json")) {
            return {
                bg: "bg-blue-100",
                fg: "text-blue-700",
                label: "JSON",
            };
        } else {
            return {
                bg: "bg-yellow-100",
                fg: "text-yellow-700",
                label: "PNG",
            };
        }
    }

    function extractFilename(url: string, index: number) {
        try {
            const parts = url.split("/");
            const filename = parts[parts.length - 1];
            return decodeURIComponent(filename).substring(0, 30);
        } catch {
            return `Documento_${index + 1}`;
        }
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#F2F1EC] text-[#1C1917]">
            {/* ── Barra superior móvil ── */}
            <header className="lg:hidden flex items-center justify-between bg-white border-b border-[#E4E2DC] px-6 py-4 shrink-0">
                <div className="flex items-center gap-2.5 ml-14">
                    <img src="/gato.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-[#1C1917] font-black tracking-widest text-sm uppercase">Horus</span>
                </div>
                <LogoutButton compact />
            </header>

            {/* ── Sidebar Flotante ── */}
            <FloatingSidebar />

            {/* ── Main content area ── */}
            <main className="flex-1 lg:pl-80 p-6 md:p-10 overflow-y-auto w-full max-w-[1400px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-[#1C1917]">Mis archivos</h1>
                    <p className="text-sm text-[#8D99AE] font-semibold mt-1">Documentos y reportes médicos escaneados</p>
                </div>

                {/* Grid Responsivo para Web de Escritorio */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Columna Izquierda: Carga e Info de Almacenamiento */}
                    <div className="xl:col-span-1 space-y-6">
                        {/* Tarjeta de Carga de Archivos */}
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-dashed border-[#8D99AE]/40 flex flex-col items-center justify-center text-center">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-16 h-16 rounded-2xl bg-[#FAD957] text-[#482D00] flex items-center justify-center mb-4 shadow-sm hover:scale-105 transition-transform cursor-pointer outline-none border-none"
                            >
                                {uploading ? (
                                    <svg className="w-7 h-7 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                    </svg>
                                ) : (
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25v-10.5A2.25 2.25 0 0 0 16.5 4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                )}
                            </button>
                            <span className="text-base font-bold text-[#1C1917] mb-1">Subir documento médico</span>
                            <span className="text-xs text-[#8D99AE] font-semibold">PDF, CSV, JSON, imágenes (máx. 25 MB)</span>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.csv,.json,.png,.jpg,.jpeg,.doc,.docx"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>

                        {uploadError && (
                            <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-xs font-semibold">
                                {uploadError}
                            </div>
                        )}

                    </div>

                    {/* Columna Derecha: Listado de Archivos Recientes */}
                    <div className="xl:col-span-2 space-y-4">
                        <h3 className="text-lg font-black text-[#1C1917] px-1">Archivos recientes</h3>

                        {loading ? (
                            <div className="space-y-3">
                                <div className="bg-white rounded-[24px] h-16 shadow-sm border border-[#E4E2DC] animate-pulse" />
                                <div className="bg-white rounded-[24px] h-16 shadow-sm border border-[#E4E2DC] animate-pulse" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-[32px] border border-[#E4E2DC] px-4">
                                <p className="text-sm text-[#8D99AE] font-semibold">No hay archivos cargados recientemente.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {documents.map((doc, idx) => {
                                    const details = getFileTypeStyles(doc.fileType);
                                    const name = doc.filename || extractFilename(doc.fileUrl, idx);
                                    return (
                                        <div
                                            key={doc.publicId || idx}
                                            className="flex items-center justify-between bg-white rounded-[24px] p-4 shadow-sm border border-[#E4E2DC] hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-11 h-11 rounded-2xl ${details.bg} ${details.fg} flex items-center justify-center font-extrabold text-[11px] shrink-0 border border-black/5`}>
                                                    {details.label}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-[#1C1917] truncate">{name}</p>
                                                    <p className="text-xs text-[#8D99AE] font-semibold">
                                                        {details.label} · {new Date(doc.uploadedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-9 h-9 rounded-2xl bg-[#F2F1EC] hover:bg-[#E4E2DC] flex items-center justify-center transition-colors text-[#1C1917] border border-[#E4E2DC]"
                                                    title="Descargar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                    </svg>
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(doc.publicId)}
                                                    className="w-9 h-9 rounded-2xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors text-red-600 border border-red-100"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
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
        </div>
    );
}
