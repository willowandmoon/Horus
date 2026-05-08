// API de contactos — operaciones sobre un contacto específico (PUT, DELETE).
// params es una Promise en Next.js 15+: debe awaitearse antes de leer el id.
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

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

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { name, relation, phone } = await req.json();
    const db = await readDb();
    const idx = db.contacts.findIndex((c) => c.id === id);
    if (idx === -1) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    db.contacts[idx] = { id, name: name.trim(), relation: relation?.trim() ?? "", phone: phone.trim() };
    await writeDb(db);
    return NextResponse.json(db.contacts[idx]);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const db = await readDb();
    const idx = db.contacts.findIndex((c) => c.id === id);
    if (idx === -1) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    db.contacts.splice(idx, 1);
    await writeDb(db);
    return NextResponse.json({ ok: true });
}
