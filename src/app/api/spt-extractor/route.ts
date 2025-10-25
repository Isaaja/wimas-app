import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file)
      return NextResponse.json(
        { error: "File PDF tidak ditemukan" },
        { status: 400 }
      );

    const payload = new FormData();
    payload.append("pdf", file);

    // Panggil Python service (localhost untuk development)
    const pythonServiceUrl =
      process.env.PYTHON_SERVICE_URL || "http://192.168.1.7:8000";
    const res = await fetch(`${pythonServiceUrl}/process-pdf`, {
      method: "POST",
      body: payload,
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
