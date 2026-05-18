import { NextResponse } from 'next/server';
import { getHistory } from '@../../../src/application/historyMedical/getHistory';
import { updateHistory } from '@../../../src/application/historyMedical/updateHistory';
import { deleteHistory } from '@../../../src/application/historyMedical/deleteHistory';
import { HistoryMedicalUpdate } from '@../../../src/types/historyMedical';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const history = await getHistory(id);
    if (!history) {
      return NextResponse.json({ error: 'History not found' }, { status: 404 });
    }
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: HistoryMedicalUpdate = await request.json();
    const updatedHistory = await updateHistory(id, body);
    if (!updatedHistory) {
      return NextResponse.json({ error: 'History not found' }, { status: 404 });
    }
    return NextResponse.json(updatedHistory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const success = await deleteHistory(id);
    if (!success) {
      return NextResponse.json({ error: 'History not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'History deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}