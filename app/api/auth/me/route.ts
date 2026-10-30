import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('opensid_auth_session');

  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const user = JSON.parse(sessionCookie.value);
    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
