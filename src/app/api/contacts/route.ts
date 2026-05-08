// API de contactos personales de emergencia.
// Almacenamiento temporal en data/db.json — reemplazar por DB real en producción.
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Deshabilita la caché de Next.js para que siempre lea el archivo actualizado
export const dynamic = "force-dynamic";

// process.cwd() apunta a la raíz del proyecto independientemente del entorno de ejecución
const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface Contact {
    id: string;
    name: string;
    relation: string;
    phone: string;
}

interface Db {
    contacts: Contact[];
    profileExtras?: Record<string, unknown>;
}

async function readDb(): Promise<Db> {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as Db;
}

async function writeDb(db: Db) {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// GET /api/contacts — devuelve todos los contactos
export async function GET() {
    const db = await readDb();
    return NextResponse.json(db.contacts);
}

// POST /api/contacts — crea un nuevo contacto con UUID generado en servidor
export async function POST(req: NextRequest) {
    const { name, relation, phone } = await req.json();
    if (!name?.trim() || !phone?.trim()) {
        return NextResponse.json({ error: "Nombre y teléfono son requeridos" }, { status: 400 });
    }
    const db = await readDb();
    const contact: Contact = { id: randomUUID(), name: name.trim(), relation: relation?.trim() ?? "", phone: phone.trim() };
    db.contacts.push(contact);
    await writeDb(db);
    return NextResponse.json(contact, { status: 201 });
}
