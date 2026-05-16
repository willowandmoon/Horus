
import { getHistoryUseCase } from "@/src/application/historyMedical/getHistory";
import { createHistoryUseCase } from "@/src/application/historyMedical/createHistory";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }
  const data = await getHistoryUseCase(userId);
  return Response.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await createHistoryUseCase(body);

    return Response.json({
      message: "History created successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    return new Response("Error creating history", { status: 500 });
  }
}
