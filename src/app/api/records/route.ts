import { NextResponse } from 'next/server';
import { queryRecords, addToReport, removeFromReport } from '@/lib/db';

// GET /api/records?caseNumber=&startDate=&endDate=
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const caseNumber = searchParams.get('caseNumber') || '';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        console.log('API received filters:', {
            caseNumber,
            startDate,
            endDate,
        });

        const records = await queryRecords({
            filename: caseNumber,
            startDate,
            endDate,
        });

        console.log('Records returned from DB:', records.length);
        if (records.length > 0) {
            console.log('First record date:', records[0].UTC);
            console.log('First record IsYellow:', records[0].IsYellow);
        }

        return NextResponse.json(records);
    } catch (error) {
        console.error('Error fetching records:', error);
        return NextResponse.json(
            { error: 'Failed to fetch records' },
            { status: 500 }
        );
    }
}

// POST /api/records/report
export async function POST(request: Request) {
    try {
        const { id, newFilename } = await request.json();

        if (!id || !newFilename) {
            return NextResponse.json(
                { error: 'ID and new filename are required' },
                { status: 400 }
            );
        }

        await addToReport(id, newFilename);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding to report:', error);
        return NextResponse.json(
            { error: 'Failed to add to report' },
            { status: 500 }
        );
    }
}

// DELETE /api/records/report?id=
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        await removeFromReport(parseInt(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing from report:', error);
        return NextResponse.json(
            { error: 'Failed to remove from report' },
            { status: 500 }
        );
    }
}
