import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logout berhasil' });
  response.cookies.delete('desdig_auth_session');
  response.cookies.delete('opensid_auth_session');
  return response;
}
