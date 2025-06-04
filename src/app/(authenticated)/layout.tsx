'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth-context';

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { logout } = useAuth();

    const handleLogout = () => {
        document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        logout();
        router.push('/');
    };

    const navigation = [
        { name: 'Query', href: '/query' },
        { name: 'Report', href: '/report' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50">
            <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center space-x-6">
                            <h1 className="text-base font-medium text-white">Query App</h1>
                            <nav className="flex space-x-1">
                                {navigation.map((item) => (
                                    <Button
                                        key={item.name}
                                        variant="ghost"
                                        className={`
                                            px-3 py-1.5 text-sm font-medium transition-colors
                                            ${pathname === item.href
                                                ? 'text-white bg-white/20'
                                                : 'text-indigo-100 hover:text-white hover:bg-white/10'
                                            }
                                        `}
                                        onClick={() => router.push(item.href)}
                                    >
                                        {item.name}
                                    </Button>
                                ))}
                            </nav>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="text-indigo-100 hover:text-white hover:bg-white/10 text-sm py-1.5"
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <main>{children}</main>
            </div>
        </div>
    );
} 