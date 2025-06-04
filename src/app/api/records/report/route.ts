import { NextResponse } from 'next/server';
import { addToReport, removeFromReport, getReportRecords } from '@/lib/db';

// GET /api/records/report
export async function GET() {
    try {
        console.log('Fetching report records...');
        const records = await getReportRecords();
        console.log('Report records found:', records.length);
        return NextResponse.json(records);
    } catch (error) {
        console.error('Error fetching report records:', error);
        return NextResponse.json(
            { error: 'Failed to fetch report records' },
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

        console.log('Adding to report:', { id, newFilename });
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

        console.log('Removing from report:', id);
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
