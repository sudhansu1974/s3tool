'use client';

import * as React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Exhibit2Report } from '@/lib/db';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DateTimeFields = {
    month: string;
    day: string;
    year: string;
    hours: string;
    minutes: string;
    seconds: string;
};

const YEARS = Array.from({ length: 4 }, (_, i) => (2022 + i).toString());

const formatInput = (value: string, type: 'date' | 'time'): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    if (type === 'date') {
        // Format as MM/DD
        if (numbers.length >= 3) {
            return numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
        } else if (numbers.length >= 2) {
            return numbers.slice(0, 2) + (numbers.length > 2 ? '/' : '');
        }
        return numbers;
    } else {
        // Format as HH:MM:SS
        if (numbers.length >= 5) {
            return numbers.slice(0, 2) + ':' + numbers.slice(2, 4) + ':' + numbers.slice(4, 6);
        } else if (numbers.length >= 3) {
            return numbers.slice(0, 2) + ':' + numbers.slice(2, 4);
        } else if (numbers.length >= 2) {
            return numbers.slice(0, 2) + (numbers.length > 2 ? ':' : '');
        }
        return numbers;
    }
};

const SimpleInput = React.memo(({
    placeholder,
    className,
    onValueChange,
    type = 'text',
    maxLength,
    initialValue = ''
}: {
    placeholder: string;
    className?: string;
    onValueChange: (value: string) => void;
    type?: 'date' | 'time' | 'text';
    maxLength?: number;
    initialValue?: string;
}) => {
    const [value, setValue] = React.useState(initialValue);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Update local state when initialValue changes, but avoid unnecessary updates
    React.useEffect(() => {
        if (initialValue !== value) {
            setValue(initialValue);
        }
    }, [initialValue]);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;

        if (type === 'date' || type === 'time') {
            newValue = formatInput(newValue, type);
        }

        setValue(newValue);
        onValueChange(newValue);
    }, [type, onValueChange]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow backspace, delete, tab, escape, enter, left arrow, right arrow, up arrow, down arrow, home, end
        if ([8, 9, 27, 13, 46, 37, 39, 38, 40, 35, 36].indexOf(e.keyCode) !== -1 ||
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
            (e.keyCode === 65 && e.ctrlKey) ||
            (e.keyCode === 67 && e.ctrlKey) ||
            (e.keyCode === 86 && e.ctrlKey) ||
            (e.keyCode === 88 && e.ctrlKey) ||
            (e.keyCode === 90 && e.ctrlKey)) {
            return;
        }

        // For date and time inputs, only allow numbers
        if (type === 'date' || type === 'time') {
            if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        }
    }, [type]);

    return (
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`flex h-8 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        />
    );
});

SimpleInput.displayName = 'SimpleInput';

const DateTimeInput = React.memo(({
    dateType,
    label,
    filters,
    setFilters
}: {
    dateType: 'startDate' | 'endDate';
    label: string;
    filters: {
        startDate: DateTimeFields;
        endDate: DateTimeFields;
        caseNumber: string;
        fromName: string;
        toName: string;
        department: string;
        disposition: string;
    };
    setFilters: React.Dispatch<React.SetStateAction<{
        startDate: DateTimeFields;
        endDate: DateTimeFields;
        caseNumber: string;
        fromName: string;
        toName: string;
        department: string;
        disposition: string;
    }>>;
}) => {
    const date = filters[dateType];

    const handleDateChange = React.useCallback((value: string) => {
        const parts = value.split('/');
        const month = parts[0] || '';
        const day = parts[1] || '';

        setFilters(prev => ({
            ...prev,
            [dateType]: {
                ...prev[dateType],
                month: month,
                day: day
            }
        }));
    }, [dateType, setFilters]);

    const handleTimeChange = React.useCallback((value: string) => {
        const parts = value.split(':');
        const hours = parts[0] || '';
        const minutes = parts[1] || '';
        const seconds = parts[2] || '';

        setFilters(prev => ({
            ...prev,
            [dateType]: {
                ...prev[dateType],
                hours: hours,
                minutes: minutes,
                seconds: seconds
            }
        }));
    }, [dateType, setFilters]);

    const handleYearChange = React.useCallback((value: string) => {
        setFilters(prev => ({
            ...prev,
            [dateType]: {
                ...prev[dateType],
                year: value
            }
        }));
    }, [dateType, setFilters]);

    // Format current values for display
    const currentDateValue = date.month || date.day
        ? `${date.month || ''}/${date.day || ''}`.replace(/\/$/, '')
        : '';

    const currentTimeValue = date.hours || date.minutes || date.seconds
        ? `${date.hours || ''}:${date.minutes || ''}:${date.seconds || ''}`.replace(/:+$/, '')
        : '';

    return (
        <div className="space-y-1">
            <Label className="text-sm">{label}</Label>
            <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1">
                    <SimpleInput
                        placeholder="MM/DD"
                        className="text-center text-sm"
                        onValueChange={handleDateChange}
                        type="date"
                        maxLength={5}
                        initialValue={currentDateValue}
                    />
                    <Select
                        value={date.year}
                        onValueChange={handleYearChange}
                    >
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent>
                            {YEARS.map((year) => (
                                <SelectItem key={year} value={year}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <SimpleInput
                        placeholder="HH:MM:SS"
                        className="text-center text-sm"
                        onValueChange={handleTimeChange}
                        type="time"
                        maxLength={8}
                        initialValue={currentTimeValue}
                    />
                </div>
            </div>
        </div>
    );
});

DateTimeInput.displayName = 'DateTimeInput';

export default function QueryPage() {
    // Load saved filters from localStorage
    const loadSavedFilters = () => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('queryFilters');
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (error) {
                console.error('Error loading saved filters:', error);
            }
        }
        return {
            startDate: { month: '', day: '', year: '', hours: '', minutes: '', seconds: '' },
            endDate: { month: '', day: '', year: '', hours: '', minutes: '', seconds: '' },
            caseNumber: '',
            fromName: '',
            toName: '',
            department: '',
            disposition: ''
        };
    };

    const [filters, setFilters] = React.useState<{
        startDate: DateTimeFields;
        endDate: DateTimeFields;
        caseNumber: string;
        fromName: string;
        toName: string;
        department: string;
        disposition: string;
    }>(loadSavedFilters());

    const [currentPage, setCurrentPage] = React.useState(1);
    const [results, setResults] = React.useState<Exhibit2Report[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isTransactionsLoading, setIsTransactionsLoading] = React.useState(false);
    const [transactions, setTransactions] = React.useState<Exhibit2Report[]>([]);
    const itemsPerPage = 50;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentResults = results.slice(startIndex, endIndex);
    const totalPages = Math.ceil(results.length / itemsPerPage);

    const [selectedFile, setSelectedFile] = React.useState<Exhibit2Report | null>(null);
    const [isFilenameDialogOpen, setIsFilenameDialogOpen] = React.useState(false);
    const [isTransactionsDialogOpen, setIsTransactionsDialogOpen] = React.useState(false);
    const [editedFilename, setEditedFilename] = React.useState('');

    // Save filters to localStorage whenever they change
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('queryFilters', JSON.stringify(filters));
            } catch (error) {
                console.error('Error saving filters:', error);
            }
        }
    }, [filters]);

    // Clear all filters and localStorage
    const clearAllFilters = () => {
        const emptyFilters = {
            caseNumber: '',
            fromName: '',
            toName: '',
            department: '',
            disposition: '',
            startDate: {
                day: '',
                month: '',
                year: '',
                hours: '',
                minutes: '',
                seconds: ''
            },
            endDate: {
                day: '',
                month: '',
                year: '',
                hours: '',
                minutes: '',
                seconds: ''
            }
        };
        setFilters(emptyFilters);
        // Clear localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('queryFilters');
        }
        toast.info('All filters cleared and saved preferences reset');
    };

    const formatDateTime = (date: DateTimeFields, isEndDate: boolean = false) => {
        if (!date.day || !date.month || !date.year) return null;

        const year = date.year;
        const month = date.month.toString().padStart(2, '0');
        const day = date.day.toString().padStart(2, '0');

        // If all time components are present, use them
        if (date.hours && date.minutes && date.seconds) {
            const hours = date.hours.toString().padStart(2, '0');
            const minutes = date.minutes.toString().padStart(2, '0');
            const seconds = date.seconds.toString().padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }

        // If no time is provided, set default times
        if (isEndDate) {
            // End date defaults to 23:59:59.997
            return `${year}-${month}-${day} 23:59:59.997`;
        } else {
            // Start date defaults to 00:00:00
            return `${year}-${month}-${day} 00:00:00`;
        }
    };

    const validateFilters = (
        filename: string,
        startDate: string | null,
        endDate: string | null
    ): boolean => {
        // Check if at least filename OR date range is provided
        const hasFilename = filename.trim().length > 0;
        const hasStartDate = !!startDate;
        const hasEndDate = !!endDate;

        // If neither filename nor dates are provided
        if (!hasFilename && !hasStartDate && !hasEndDate) {
            toast.error('Please enter either a filename or date range');
            return false;
        }

        // If only one date is provided
        if ((hasStartDate && !hasEndDate) || (!hasStartDate && hasEndDate)) {
            toast.error('Please enter both start and end dates');
            return false;
        }

        // If both dates are provided, validate them
        if (hasStartDate && hasEndDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start > end) {
                toast.error('Start date must be before or equal to end date');
                return false;
            }
        }

        return true;
    };

    const handleSearch = async () => {
        try {
            const startDateTime = formatDateTime(filters.startDate, false);
            const endDateTime = formatDateTime(filters.endDate, true);

            // Debug logging
            console.log('Search filters:', filters);
            console.log('Formatted start date:', startDateTime);
            console.log('Formatted end date:', endDateTime);

            // Validate filters
            if (!validateFilters(filters.caseNumber, startDateTime, endDateTime)) {
                return;
            }

            setIsLoading(true);
            const searchParams = new URLSearchParams();
            if (filters.caseNumber) searchParams.append('caseNumber', filters.caseNumber);
            if (startDateTime) searchParams.append('startDate', startDateTime);
            if (endDateTime) searchParams.append('endDate', endDateTime);

            console.log('Search URL:', `/api/records?${searchParams.toString()}`);

            const response = await fetch(`/api/records?${searchParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch records');

            const data = await response.json();

            // Debug logging for response data
            console.log('Response data:', data);
            console.log('First record IsYellow:', data[0]?.IsYellow);

            setResults(data);
            setCurrentPage(1);

            // Show feedback about the search
            if (data.length === 0) {
                toast.info('No records found for the given criteria');
            } else {
                toast.success(`Found ${data.length} record${data.length === 1 ? '' : 's'}`);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            toast.error('Failed to fetch records');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewTransactions = async (result: Exhibit2Report) => {
        try {
            setIsTransactionsDialogOpen(true);
            setIsTransactionsLoading(true);
            const response = await fetch(`/api/records/transactions?filename=${encodeURIComponent(result.FileName)}`);
            if (!response.ok) throw new Error('Failed to fetch transactions');

            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Failed to fetch transactions');
        } finally {
            setIsTransactionsLoading(false);
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

                if (!response.ok) throw new Error('Failed to add to report');

                setResults(prev => prev.filter(item => item.id !== selectedFile.id));
                setIsFilenameDialogOpen(false);
                toast.success('File added to report successfully', {
                    description: `The file has been renamed to "${editedFilename.trim()}" and added to your report`
                });
            } catch (error) {
                console.error('Error adding to report:', error);
                toast.error('Failed to add to report');
            }
        }
    };

    // Handle keyboard events
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    return (
        <div
            className="container mx-auto p-4 space-y-4"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <Toaster />
            {/* Filters section */}
            <Card className="p-4">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-indigo-900">Search Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search Filename */}
                        <div className="space-y-1">
                            <Label htmlFor="caseNumber" className="text-sm">Search filename</Label>
                            <Input
                                id="caseNumber"
                                placeholder="Enter filename..."
                                value={filters.caseNumber}
                                onChange={(e) => setFilters(prev => ({ ...prev, caseNumber: e.target.value }))}
                                className="h-8 text-sm"
                            />
                        </div>

                        {/* Start Date */}
                        <DateTimeInput
                            dateType="startDate"
                            label="Start Date"
                            filters={filters}
                            setFilters={setFilters}
                        />

                        {/* End Date */}
                        <DateTimeInput
                            dateType="endDate"
                            label="End Date"
                            filters={filters}
                            setFilters={setFilters}
                        />

                        {/* Buttons */}
                        <div className="flex items-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={clearAllFilters}
                                className="h-8 text-sm border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            >
                                Clear Filters
                            </Button>
                            <Button
                                onClick={handleSearch}
                                className="h-8 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-sm"
                            >
                                Filter
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Results section */}
            <Card className="p-4">
                <div className="flex flex-col h-[600px] relative">
                    {/* Fixed Header */}
                    <div className="sticky top-0 z-10">
                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-indigo-200">
                                        <TableHead className="h-10 text-indigo-900 font-medium w-16">Type</TableHead>
                                        <TableHead className="h-10 text-indigo-900 font-medium w-32">IP Address</TableHead>
                                        <TableHead className="h-10 text-indigo-900 font-medium w-32">UTC Date</TableHead>
                                        <TableHead className="h-10 text-indigo-900 font-medium">Filename</TableHead>
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
                                        <TableCell colSpan={4} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : currentResults.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            No records found
                                        </TableCell>
                                    </TableRow>
                                ) : currentResults.map((result) => (
                                    <TableRow
                                        key={result.id}
                                        className={result.IsYellow ? "bg-yellow-100 hover:bg-yellow-200" : "hover:bg-gray-50"}
                                    >
                                        <TableCell className="w-16">{result.Type}</TableCell>
                                        <TableCell className="w-32">
                                            <button
                                                onClick={() => handleViewTransactions(result)}
                                                className="text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none font-medium"
                                                title="Click to view transactions"
                                            >
                                                {result.IP}
                                            </button>
                                        </TableCell>
                                        <TableCell className="w-32">
                                            {new Date(result.UTC).toLocaleString('en-US', {
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
                                                onClick={() => handleFilenameClick(result)}
                                                className="text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none"
                                            >
                                                {result.NewFilename || result.FileName}
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
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
                                Page {currentPage} of {totalPages} • {results.length} total records
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
                <DialogContent className="bg-white border border-gray-200 shadow-xl">
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
                                toast.info('Addition cancelled');
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
                            Add to Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transactions Dialog */}
            <Dialog open={isTransactionsDialogOpen} onOpenChange={(open) => {
                setIsTransactionsDialogOpen(open);
                if (!open) {
                    setTransactions([]);
                    setIsTransactionsLoading(false);
                }
            }}>
                <DialogContent className="max-w-5xl bg-white border border-gray-200 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-indigo-900 pr-8">
                            All Transactions for Filename
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="relative">
                            <div className="sticky top-0 z-10 bg-white border rounded-t-lg">
                                <Table className="table-fixed">
                                    <TableHeader>
                                        <TableRow className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
                                            <TableHead className="h-10 text-indigo-900 font-medium w-16">ID</TableHead>
                                            <TableHead className="h-10 text-indigo-900 font-medium w-16">Type</TableHead>
                                            <TableHead className="h-10 text-indigo-900 font-medium w-40">IP Address</TableHead>
                                            <TableHead className="h-10 text-indigo-900 font-medium w-44">UTC Date</TableHead>
                                            <TableHead className="h-10 text-indigo-900 font-medium">Hash</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                </Table>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto bg-white border-x border-b rounded-b-lg">
                                <Table className="table-fixed">
                                    <TableBody>
                                        {isTransactionsLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8">
                                                    Loading transactions...
                                                </TableCell>
                                            </TableRow>
                                        ) : transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                    No transactions found
                                                </TableCell>
                                            </TableRow>
                                        ) : transactions.map((transaction, index) => (
                                            <TableRow
                                                key={transaction.id}
                                                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${transaction.IsYellow ? 'bg-yellow-100' : ''}`}
                                            >
                                                <TableCell className="font-mono w-16">{transaction.id}</TableCell>
                                                <TableCell className="font-mono w-16">{transaction.Type}</TableCell>
                                                <TableCell className="font-mono w-40">{transaction.IP}</TableCell>
                                                <TableCell className="font-mono w-44">
                                                    {new Date(transaction.UTC).toLocaleString('en-US', {
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
                                                <TableCell className="font-mono">{transaction.Hash}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setIsTransactionsDialogOpen(false)}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-sm"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 