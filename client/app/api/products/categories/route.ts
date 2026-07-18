import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET() {
  try {
    const url = `${API_URL}/api/products/categories`;
    console.log('Fetching categories from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Categories response:', { status: response.status, success: data.success });
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching categories:', errorMessage);
    console.error('API_URL:', API_URL);
    return NextResponse.json(
      { success: false, message: `Failed to fetch categories: ${errorMessage}` },
      { status: 500 }
    );
  }
}
