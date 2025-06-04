'use client';

import * as React from 'react';
import { Card } from "@/components/ui/card";
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { X, Download } from "lucide-react";
import { Exhibit2Report } from '@/lib/db';
import ExcelJS from 'exceljs';

export default function ReportPage() {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [items, setItems] = React.useState<Exhibit2Report[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isFilenameDialogOpen, setIsFilenameDialogOpen] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<Exhibit2Report | null>(null);
    const [editedFilename, setEditedFilename] = React.useState('');
    const itemsPerPage = 50;

    // Fetch report data
    const fetchReportData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/records/report');
            if (!response.ok) throw new Error('Failed to fetch report data');

            const data = await response.json();
            setItems(data);
        } catch (error) {
            console.error('Error fetching report data:', error);
            toast.error('Failed to fetch report data');
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize data
    React.useEffect(() => {
        fetchReportData();
    }, []);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    const handleRemove = async (id: number) => {
        try {
            const response = await fetch(`/api/records/report?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to remove from report');

            const removedItem = items.find(item => item.id === id);
            setItems(prev => prev.filter(item => item.id !== id));

            toast.success('Item removed from report', {
                description: `"${removedItem?.NewFilename || removedItem?.FileName}" has been removed from your report`
            });

            // If we're on the last page and it's now empty, go to previous page
            const newTotalItems = items.length - 1;
            const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
            if (currentPage > newTotalPages && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (error) {
            console.error('Error removing from report:', error);
            toast.error('Failed to remove from report');
        }
    };

    const handleDownload = async () => {
        try {
            // Create a new workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');

            // Define columns with headers and widths
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Type', key: 'type', width: 8 },
                { header: 'IP Address', key: 'ip', width: 18 },
                { header: 'UTC Date', key: 'date', width: 20 },
                { header: 'Filename', key: 'filename', width: 50 }
            ];

            // Add data rows
            items.forEach(item => {
                worksheet.addRow({
                    id: item.id,
                    type: item.Type,
                    ip: item.IP,
                    date: new Date(item.UTC).toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                        timeZone: 'UTC'
                    }),
                    filename: item.NewFilename || item.FileName
                });
            });

            // Style the header row - only cells with data
            const headerRow = worksheet.getRow(1);
            headerRow.height = 20;

            // Style only the header cells that have data (columns 1-5)
            for (let col = 1; col <= 5; col++) {
                const cell = headerRow.getCell(col);
                cell.font = { bold: true, color: { argb: '000000' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'D3D3D3' }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            // Add borders only to cells with data
            worksheet.eachRow((row) => {
                // Only apply borders to the first 5 columns (our data columns)
                for (let col = 1; col <= 5; col++) {
                    const cell = row.getCell(col);
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
            });

            // Auto-fit columns
            worksheet.columns.forEach((column, index) => {
                if (index < 5) { // Only for our data columns
                    let maxLength = 0;

                    worksheet.eachRow((row) => {
                        const cell = row.getCell(index + 1);
                        if (cell.value) {
                            const cellLength = cell.value.toString().length;
                            if (cellLength > maxLength) {
                                maxLength = cellLength;
                            }
                        }
                    });

                    // Set minimum width and add some padding
                    const headerLength = worksheet.getRow(1).getCell(index + 1).value?.toString().length || 0;
                    maxLength = Math.max(maxLength, headerLength);
                    column.width = Math.min(Math.max(maxLength + 2, 10), 60); // Min 10, max 60, +2 for padding
                }
            });

            // Freeze the header row
            worksheet.views = [
                { state: 'frozen', ySplit: 1 }
            ];

            // Generate filename with current timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `Report_${timestamp}.xlsx`;

            // Generate Excel file buffer
            const buffer = await workbook.xlsx.writeBuffer();

            // Create blob and download
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success('Report downloaded successfully!', {
                description: `File saved as ${filename}`
            });
        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error('Failed to download report');
        }
    };

    const handleFilenameClick = (result: Exhibit2Report) => {
        setSelectedFile(result);
        setEditedFilename(result.NewFilename || result.FileName);
        setIsFilenameDialogOpen(true);
    };

    const handleUpdateFilename = async () => {
        if (!editedFilename.trim()) {
            toast.error('Filename cannot be empty');
            return;
        }

        if (selectedFile) {
            try {
                const response = await fetch('/api/records/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: selectedFile.id,
                        newFilename: editedFilename.trim()
                    })
                });

                if (!response.ok) throw new Error('Failed to update filename');

                // Update the local state
                setItems(prev => prev.map(item =>
                    item.id === selectedFile.id
                        ? { ...item, NewFilename: editedFilename.trim() }
                        : item
                ));

                setIsFilenameDialogOpen(false);
                toast.success('Filename updated successfully');
            } catch (error) {
                console.error('Error updating filename:', error);
                toast.error('Failed to update filename');
            }
        }
    };

    return (
        <div className="space-y-4">
            <Toaster position="top-center" richColors />
            <Card className="p-4">
                <div className="flex flex-col h-[600px] relative">
                    {/* Fixed Header with Download Button */}
                    <div className="sticky top-0 z-10">
                        <div className="flex justify-between items-center bg-gradient-to-r from-indigo-50 to-indigo-100 p-2 rounded-t-lg border-b border-indigo-200">
                            <div className="flex-1" />
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-sm bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-600 hover:text-indigo-700"
                                onClick={handleDownload}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Report
                            </Button>
                        </div>
                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-indigo-200">
                                        <TableHead className="h-10 text-indigo-900 font-medium w-16">Type</TableHead>
                                        <TableHead className="h-10 text-indigo-900 font-medium w-32">IP Address</TableHead>
                                        <TableHead className="h-10 text-indigo-900 font-medium w-32">UTC Date</TableHead>
                                        <TableHead className="h-10 text-indigo-900 font-medium">Filename</TableHead>
                                        <TableHead className="h-10 w-[50px] text-indigo-900 font-medium"></TableHead>
                                    </TableRow>
                                </TableHeader>
                            </Table>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-grow overflow-auto">
                        <Table className="table-fixed">
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : currentItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            No items in report
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentItems.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className={item.IsYellow ? "bg-yellow-100 hover:bg-yellow-200" : "hover:bg-gray-50"}
                                        >
                                            <TableCell className="w-16">{item.Type}</TableCell>
                                            <TableCell className="w-32">{item.IP}</TableCell>
                                            <TableCell className="w-32">
                                                {new Date(item.UTC).toLocaleString('en-US', {
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    year: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: false,
                                                    timeZone: 'UTC'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => handleFilenameClick(item)}
                                                    className="text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none"
                                                >
                                                    {item.NewFilename || item.FileName}
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => handleRemove(item.id)}
                                                    className="p-1 hover:bg-indigo-50 rounded-full transition-colors"
                                                >
                                                    <X className="h-4 w-4 text-indigo-500" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination - Static at bottom */}
                    <div className="sticky bottom-0 border-t border-indigo-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
                        <div className="flex items-center justify-between px-4 h-10">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-600 hover:text-indigo-700"
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-indigo-600 font-medium">
                                Page {currentPage} of {totalPages} • {items.length} total records
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || isLoading}
                                className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-600 hover:text-indigo-700"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Filename Edit Dialog */}
            <Dialog open={isFilenameDialogOpen} onOpenChange={setIsFilenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-indigo-900">
                            Edit Filename
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="filename" className="text-sm text-indigo-900 mb-2 block">
                            New Filename
                        </Label>
                        <Input
                            id="filename"
                            value={editedFilename}
                            onChange={(e) => setEditedFilename(e.target.value)}
                            className="h-9 text-sm border-indigo-200 focus:ring-indigo-500"
                            placeholder="Enter new filename"
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="sm:space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setIsFilenameDialogOpen(false);
                                toast.info('Edit cancelled');
                            }}
                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleUpdateFilename}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-sm"
                        >
                            Update Filename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 