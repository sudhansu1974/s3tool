import { NextResponse } from 'next/server';
import { getTransactions } from '@/lib/db';

// GET /api/records/transactions?filename=
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json(
                { error: 'Filename is required' },
                { status: 400 }
            );
        }

        console.log('Fetching transactions for filename:', filename);
        const transactions = await getTransactions(filename);

        console.log('Transactions found:', transactions.length);
        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}
