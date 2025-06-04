import sql, { config as SQLConfig } from 'mssql';
import 'dotenv/config';

// Debug logging for environment variables
console.log('Environment variables check:', {
    hasUser: !!process.env.DB_USER,
    hasPassword: !!process.env.DB_PASSWORD,
    hasServer: !!process.env.DB_SERVER,
    hasDatabase: !!process.env.DB_NAME,
    server: process.env.DB_SERVER,
});

// Validate required environment variables
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
}

// Database configuration
const dbConfig: SQLConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER!,
    database: process.env.DB_NAME || 'S3TranactionDB',
    options: {
        encrypt: false, // Force to false as that's what works for you
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 30000,
        enableArithAbort: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    port: 1433, // Explicit port specification - critical for connection
};

// Global connection pool
let pool: sql.ConnectionPool | null = null;

// Interface for Exhibit2Report table
export interface Exhibit2Report {
    id: number;
    DId: number | null;
    Type: string;
    IP: string;
    UTC: Date;
    FileName: string;
    NewFilename: string | null;
    Hash: string;
    IsReport: boolean;
    IsYellow: boolean;
    IPType: string | null;
}

// Query interface for filtering records
export interface QueryFilters {
    filename: string;
    startDate: string | null;
    endDate: string | null;
}

// Parameter type for database queries
interface QueryParameters {
    [key: string]: string | Date | number | boolean;
}

// Get connection pool with detailed error logging and retry logic
const getPool = async (retryCount = 3): Promise<sql.ConnectionPool> => {
    try {
        if (!pool) {
            console.log('Initializing database connection pool with config:', {
                server: dbConfig.server,
                database: dbConfig.database,
                user: dbConfig.user,
                port: dbConfig.port,
                options: {
                    encrypt: dbConfig.options?.encrypt,
                    trustServerCertificate:
                        dbConfig.options?.trustServerCertificate,
                    connectTimeout: dbConfig.options?.connectTimeout,
                },
            });

            // Strategy 1: Try with direct config and explicit port (PROVEN TO WORK)
            try {
                console.log(
                    'Attempting connection with config object and explicit port...'
                );
                const newPool = await sql.connect({
                    ...dbConfig,
                    port: 1433, // Explicit port that worked in our tests
                });
                pool = newPool;
                console.log(
                    'Database connection successful with config object and port'
                );
                return pool;
            } catch (configError) {
                console.error(
                    'Connection with config object failed:',
                    configError instanceof Error
                        ? configError.message
                        : configError
                );
            }
            // Strategy 2: Try with Named Pipes
            try {
                console.log('Attempting connection with Named Pipes...');

                // Try first with instance name
                try {
                    console.log(
                        'Attempting connection with Named Pipes using SQLEXPRESS instance...'
                    );
                    const namedPipesConfigWithInstance = {
                        user: dbConfig.user,
                        password: dbConfig.password,
                        server: dbConfig.server,
                        database: dbConfig.database,
                        options: {
                            encrypt: false,
                            trustServerCertificate: true,
                            connectTimeout: 60000, // Longer timeout for Named Pipes
                            instanceName: 'MSSQLSERVER', // Using SQLEXPRESS as seen in your configuration
                        },
                    };
                    console.log('Named Pipes config with instance:', {
                        ...namedPipesConfigWithInstance,
                        password: '****',
                    });
                    const newPool = await sql.connect(
                        namedPipesConfigWithInstance
                    );
                    pool = newPool;
                    console.log(
                        'Database connection successful with Named Pipes (instance method)'
                    );
                    return pool;
                } catch (instanceError) {
                    console.error(
                        'Connection with Named Pipes (instance method) failed:',
                        instanceError instanceof Error
                            ? instanceError.message
                            : instanceError
                    );
                }

                // Try with explicit pipe path format
                try {
                    console.log(
                        'Attempting connection with explicit Named Pipes path...'
                    );
                    // Standard Named Pipes format for SQL Server Express
                    const namedPipesConfig = {
                        user: dbConfig.user,
                        password: dbConfig.password,
                        server: `\\\\${dbConfig.server}\\pipe\\MSSQL$SQLEXPRESS\\sql\\query`,
                        database: dbConfig.database,
                        options: {
                            encrypt: false,
                            trustServerCertificate: true,
                            connectTimeout: 60000, // Longer timeout for Named Pipes
                        },
                    };
                    console.log('Named Pipes explicit path config:', {
                        ...namedPipesConfig,
                        password: '****',
                        server: namedPipesConfig.server,
                    });
                    const newPool = await sql.connect(namedPipesConfig);
                    pool = newPool;
                    console.log(
                        'Database connection successful with Named Pipes (explicit path)'
                    );
                    return pool;
                } catch (explicitPathError) {
                    console.error(
                        'Connection with Named Pipes (explicit path) failed:',
                        explicitPathError instanceof Error
                            ? explicitPathError.message
                            : explicitPathError
                    );
                }

                // Try with connection string format
                try {
                    console.log(
                        'Attempting connection with Named Pipes connection string...'
                    );
                    const namedPipesConnString = `Server=\\\\${dbConfig.server}\\pipe\\MSSQL$SQLEXPRESS\\sql\\query;Database=${dbConfig.database};User Id=${dbConfig.user};Password=${dbConfig.password};TrustServerCertificate=true;`;
                    console.log(
                        'Named Pipes connection string:',
                        namedPipesConnString.replace(
                            /(Password=)[^;]+/,
                            '$1****'
                        )
                    );
                    const newPool = await sql.connect(namedPipesConnString);
                    pool = newPool;
                    console.log(
                        'Database connection successful with Named Pipes (connection string)'
                    );
                    return pool;
                } catch (connStringError) {
                    console.error(
                        'Connection with Named Pipes (connection string) failed:',
                        connStringError instanceof Error
                            ? connStringError.message
                            : connStringError
                    );
                }
                console.error('All Named Pipes connection attempts failed');
            } catch (namedPipeError) {
                console.error(
                    'Connection with Named Pipes failed:',
                    namedPipeError instanceof Error
                        ? namedPipeError.message
                        : namedPipeError
                );
            }

            // Strategy 3: Try with explicit TCP port
            try {
                console.log('Attempting connection with explicit TCP port...');
                const tcpConfig = {
                    user: dbConfig.user,
                    password: dbConfig.password,
                    server: dbConfig.server,
                    database: dbConfig.database,
                    options: {
                        encrypt: false,
                        trustServerCertificate: true,
                    },
                    port: 1433, // Default SQL Server port
                };
                console.log('TCP config:', {
                    ...tcpConfig,
                    password: '****',
                });
                const newPool = await sql.connect(tcpConfig);
                pool = newPool;
                console.log(
                    'Database connection successful with explicit TCP port'
                );
                return pool;
            } catch (tcpError) {
                console.error(
                    'Connection with explicit TCP port failed:',
                    tcpError instanceof Error ? tcpError.message : tcpError
                );
            }

            // Strategy 3: Try with connection string
            if (process.env.DB_CONNECTION_STRING) {
                try {
                    console.log(
                        'Attempting connection with connection string...'
                    );
                    const newPool = await sql.connect(
                        process.env.DB_CONNECTION_STRING
                    );
                    pool = newPool;
                    console.log(
                        'Database connection successful with connection string'
                    );
                    return pool;
                } catch (connStringError) {
                    console.error(
                        'Connection with connection string failed:',
                        connStringError instanceof Error
                            ? connStringError.message
                            : connStringError
                    );
                }
            }

            // Strategy 4: Try with TCP connection string (PROVEN TO WORK)
            try {
                console.log(
                    'Attempting connection with TCP connection string...'
                );
                const tcpConnString = `Server=tcp:${dbConfig.server},1433;Database=${dbConfig.database};User Id=${dbConfig.user};Password=${dbConfig.password};TrustServerCertificate=true;Connection Timeout=30;`;
                console.log(
                    'TCP connection string:',
                    tcpConnString.replace(/(Password=)[^;]+/, '$1****')
                );

                const newPool = await sql.connect(tcpConnString);
                pool = newPool;
                console.log(
                    'Database connection successful with TCP connection string'
                );
                return pool;
            } catch (tcpConnStringError) {
                console.error(
                    'Connection with TCP connection string failed:',
                    tcpConnStringError instanceof Error
                        ? tcpConnStringError.message
                        : tcpConnStringError
                );
                throw new Error('All connection methods failed');
            }
        }

        if (!pool) {
            throw new Error('Failed to initialize connection pool');
        }

        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        if (err instanceof Error) {
            console.error('Error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name,
            });
        }

        // Retry logic
        if (retryCount > 0) {
            console.log(
                `Retrying connection... (${retryCount} attempts remaining)`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
            return getPool(retryCount - 1);
        }

        throw new Error(
            'Unable to connect to the database after multiple attempts. Please check your connection settings.'
        );
    }
};

// Test database connection
export async function testConnection(): Promise<boolean> {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT 1 as testConnection');
        return result.recordset[0].testConnection === 1;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}

// Query records based on filters
export async function queryRecords(
    filters: QueryFilters
): Promise<Exhibit2Report[]> {
    const pool = await getPool();
    let query = `
        SELECT Id as id, DId, Type, IP, UTC, FileName, NewFilename, Hash, IsReport, IsYellow, IPType
        FROM Exhibit2Report
        WHERE IsReport = 0
    `;

    const conditions: string[] = [];
    const parameters: QueryParameters = {};

    if (filters.filename) {
        conditions.push('FileName LIKE @filename');
        parameters.filename = `%${filters.filename}%`;
    }

    if (filters.startDate) {
        conditions.push('UTC >= @startDate');
        parameters.startDate = filters.startDate; // Use string directly, let SQL Server parse it
        console.log('Start date filter:', filters.startDate);
    }

    if (filters.endDate) {
        conditions.push('UTC <= @endDate');
        parameters.endDate = filters.endDate; // Use string directly, let SQL Server parse it
        console.log('End date filter:', filters.endDate);
    }

    if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY UTC ASC';

    console.log('Final SQL query:', query);
    console.log('Query parameters:', parameters);

    const request = pool.request();
    for (const [key, value] of Object.entries(parameters)) {
        request.input(key, value);
    }

    try {
        const result = await request.query(query);
        console.log('Query result count:', result.recordset.length);
        if (result.recordset.length > 0) {
            console.log('Sample record:', result.recordset[0]);
        }
        return result.recordset;
    } catch (error) {
        console.error('Error executing query:', error);
        console.error('Query was:', query);
        console.error('Parameters were:', parameters);
        throw error;
    }
}

// Get transactions for a specific filename
export async function getTransactions(
    filename: string
): Promise<Exhibit2Report[]> {
    const pool = await getPool();
    const request = pool.request();
    request.input('filename', sql.NVarChar, filename);

    const query = `
        SELECT Id as id, DId, Type, IP, UTC, FileName, NewFilename, Hash, IsReport, IsYellow, IPType
        FROM Exhibit2Report
        WHERE FileName = @filename
        ORDER BY UTC ASC
    `;

    try {
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('Error getting transactions:', error);
        throw error;
    }
}

// Get all transactions for a specific IP address
export async function getTransactionsByIP(
    ip: string
): Promise<Exhibit2Report[]> {
    const pool = await getPool();
    const request = pool.request();
    request.input('ip', sql.NVarChar, ip);

    const query = `
        SELECT Id as id, DId, Type, IP, UTC, FileName, NewFilename, Hash, IsReport, IsYellow, IPType
        FROM Exhibit2Report
        WHERE IP = @ip
        ORDER BY UTC ASC
    `;

    console.log('Executing query for IP transactions:', query);
    console.log('IP parameter:', ip);

    try {
        const result = await request.query(query);
        console.log(
            'Query result:',
            result.recordset.length,
            'transactions found'
        );
        return result.recordset;
    } catch (error) {
        console.error('Error getting transactions by IP:', error);
        throw error;
    }
}

// Update filename and mark as report
export async function addToReport(
    id: number,
    newFilename: string
): Promise<void> {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.BigInt, id);
    request.input('newFilename', sql.NVarChar, newFilename);

    const query = `
        UPDATE Exhibit2Report
        SET NewFilename = @newFilename,
            IsReport = 1
        WHERE id = @id
    `;

    try {
        await request.query(query);
    } catch (error) {
        console.error('Error adding to report:', error);
        throw error;
    }
}

// Get all report records
export async function getReportRecords(): Promise<Exhibit2Report[]> {
    const pool = await getPool();

    const query = `
        SELECT Id as id, DId, Type, IP, UTC, FileName, NewFilename, Hash, IsReport, IsYellow, IPType
        FROM Exhibit2Report
        WHERE IsReport = 1
        ORDER BY UTC ASC
    `;

    try {
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Error getting report records:', error);
        throw error;
    }
}

// Remove from report
export async function removeFromReport(id: number): Promise<void> {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.BigInt, id);

    const query = `
        UPDATE Exhibit2Report
        SET IsReport = 0
        WHERE id = @id
    `;

    try {
        await request.query(query);
    } catch (error) {
        console.error('Error removing from report:', error);
        throw error;
    }
}
