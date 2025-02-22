import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('Received request to /api/ask:', req.body);
  const { question } = await req.json();

  if (!question) {
    return NextResponse.json({ error: 'No question provided' }, { status: 400 });
  }

  try {
    console.log('Fetching from Flask at http://localhost:5000/ask');
    const response = await fetch('http://localhost:5000/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
    }
    const data = await response.json();
    console.log('Response from Flask:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Flask:', error);
    return NextResponse.json({ error: `Failed to reach Alphonse: ${(error as Error).message}` }, { status: 500 });
  }
}