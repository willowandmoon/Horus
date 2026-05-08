import { updateHistoryUseCase } from "@/src/application/historyMedical/updateHistory";
import { deleteHistoryUseCase } from "@/src/application/historyMedical/deleteHistory";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const result = await updateHistoryUseCase(id, body);

    return Response.json({
      message: "History updated successfully",
      data: result
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);

    return Response.json(
    {
        error: String(error)
    },
    {
        status: 500
    }
    );
    }
}

export async function DELETE(
        req: Request,
        { params }: { params: Promise<{ id: string }> }
    ) {
        try {
            const { id } = await params;

            const reult = await deleteHistoryUseCase(id);

            return Response.json({
                message: "History deleted successfully",
                data: reult
            });
        }catch (error){
            console.error("DELETE ERROR:", error);

            return Response.json(
                {
                    error: String(error)
                },
                {
                    status: 500
                }
            );
        }
    }