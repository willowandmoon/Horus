import { NextResponse } from 'next/server';
import { createHistory } from '@/src/application/historyMedical/createHistory';
import { getHistoryByUserId } from '@/src/application/historyMedical/getHistory';
import { HistoryMedicalCreate } from '@/src/types/historyMedical';

export async function POST(request: Request) {
  try {
    const body: HistoryMedicalCreate = await request.json();
    const newHistory = await createHistory(body);
    return NextResponse.json(newHistory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'userId query param is required' },
        { status: 400 }
      );
    }
    const histories = await getHistoryByUserId(userId);
    return NextResponse.json(histories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
