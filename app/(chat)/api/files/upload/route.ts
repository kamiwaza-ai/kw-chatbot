// app/(chat)/api/files/upload/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json(
    { 
      error: 'File uploads are temporarily disabled while we upgrade our storage system. This feature will return soon!' 
    }, 
    { 
      status: 503 // Service Unavailable 
    }
  );
}