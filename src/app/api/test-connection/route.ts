import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
    try {
        const isConnected = await testConnection();
        if (isConnected) {
            return NextResponse.json({
                status: 'success',
                message: 'Database connection successful',
            });
        } else {
            return NextResponse.json(
                { status: 'error', message: 'Database connection failed' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error testing connection:', error);
        const errorMessage =
            error instanceof Error
                ? `Database connection test failed: ${error.message}`
                : 'Database connection test failed';

        return NextResponse.json(
            { status: 'error', message: errorMessage },
            { status: 500 }
        );
    }
}
