import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { question } = await req.json();

  if (!question) {
    return NextResponse.json({ error: 'No question provided' }, { status: 400 });
  }

  try {
    const response = await fetch('http://localhost:5000/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reach Alphonse' }, { status: 500 });
  }
}