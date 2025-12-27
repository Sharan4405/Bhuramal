import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization');
    const body = await request.json();
    
    console.log('Order status update request:', {
      orderId: params.id,
      status: body.status,
      hasToken: !!token
    });
    
    const response = await fetch(`${API_URL}/api/orders/${params.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Backend response:', {
      status: response.status,
      success: data.success,
      message: data.message
    });
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
