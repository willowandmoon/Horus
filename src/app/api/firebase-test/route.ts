import { db } from "@/src/infrastucture/database/firebase";

export async function GET() {
  try {

    const result = await db.collection("test").add({
      name: "Valeria",
      createdAt: new Date()
    });

    return Response.json({
      message: "Firebase connected successfully",
      id: result.id
    });

  } catch (error) {

    console.error(error);

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