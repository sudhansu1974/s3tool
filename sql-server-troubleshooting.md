# SQL Server Connection Troubleshooting Guide

Since you can connect to your SQL Server database from your ASP.NET Core application but not from your Next.js application, here's a troubleshooting guide to help you identify and fix the issues:

## 1. Compare Connection Strings

### ASP.NET Core Connection String
In your ASP.NET Core application, find your connection string in:
- `appsettings.json`
- `appsettings.Development.json`
- Or wherever you've defined it

Copy the exact connection string that works.

### Next.js Connection
Update your .env file with the EXACT same values:

```
DB_USER="the_exact_username_from_aspnet_core"
DB_PASSWORD="the_exact_password_from_aspnet_core"
DB_SERVER="the_exact_server_from_aspnet_core"
DB_NAME="the_exact_database_from_aspnet_core"
DB_ENCRYPT="false"
DB_CONNECTION_STRING="the_exact_connection_string_from_aspnet_core"
```

## 2. Check for Connection String Format Differences

ASP.NET Core and Node.js SQL drivers might have slight differences in connection string formats.

Common differences:
- Case sensitivity (User ID vs UserId)
- Parameter names (Initial Catalog vs Database)
- Boolean values (true/false vs True/False)

## 3. Check SQL Server Authentication Mode

Make sure SQL Server is configured for:
- Mixed Mode Authentication (SQL Server + Windows Authentication)
- The 'sa' user is enabled
- The SQL Server instance allows remote connections
- The correct TCP/IP port is open (default is 1433)

## 4. Network and Firewall Issues

- Make sure your firewall allows connections to SQL Server
- Check if you need to specify a specific port in the connection string
- Verify that SQL Server Browser service is running (if using named instances)

## 5. Debugging Connection

Create a debug script to test your connection with different settings:

```javascript
// debug-connection.js
const sql = require('mssql');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testConnection(config) {
  try {
    console.log('\nAttempting to connect with config:', {
      ...config,
      password: '****' // Mask password
    });
    
    await sql.connect(config);
    const result = await sql.query`SELECT 1 as testResult`;
    
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log('Test query result:', result.recordset);
    return true;
  } catch (err) {
    console.error('❌ CONNECTION FAILED!');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    if (err.originalError) {
      console.error('Original error:', err.originalError.message);
    }
    return false;
  } finally {
    await sql.close();
  }
}

// Menu to test different connection options
async function showMenu() {
  console.log('\n=== SQL SERVER CONNECTION TESTER ===');
  console.log('1. Test with .env values');
  console.log('2. Test with custom connection string');
  console.log('3. Test with Windows Authentication');
  console.log('4. Test with IP Address instead of hostname');
  console.log('5. Test with different TLS/encryption settings');
  console.log('6. Exit');
  
  rl.question('\nSelect an option: ', async (option) => {
    switch (option) {
      case '1':
        await testConnection({
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          server: process.env.DB_SERVER,
          database: process.env.DB_NAME,
          options: {
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: true
          }
        });
        showMenu();
        break;
      
      case '2':
        rl.question('Enter your connection string: ', async (connString) => {
          await testConnection(connString);
          showMenu();
        });
        break;
      
      case '3':
        await testConnection({
          server: process.env.DB_SERVER,
          database: process.env.DB_NAME,
          options: {
            encrypt: false,
            trustServerCertificate: true,
            integratedSecurity: true
          }
        });
        showMenu();
        break;
      
      case '4':
        rl.question('Enter SQL Server IP address: ', async (ip) => {
          await testConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: ip,
            database: process.env.DB_NAME,
            options: {
              encrypt: false,
              trustServerCertificate: true
            }
          });
          showMenu();
        });
        break;
      
      case '5':
        console.log('\nTesting different encryption settings:');
        
        // Test 1: No encryption
        console.log('\n--- TEST 1: No Encryption ---');
        await testConnection({
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          server: process.env.DB_SERVER,
          database: process.env.DB_NAME,
          options: {
            encrypt: false,
            trustServerCertificate: true
          }
        });
        
        // Test 2: With encryption
        console.log('\n--- TEST 2: With Encryption ---');
        await testConnection({
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          server: process.env.DB_SERVER,
          database: process.env.DB_NAME,
          options: {
            encrypt: true,
            trustServerCertificate: true
          }
        });
        
        // Test 3: With strict TLS
        console.log('\n--- TEST 3: With Strict TLS ---');
        await testConnection({
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          server: process.env.DB_SERVER,
          database: process.env.DB_NAME,
          options: {
            encrypt: true,
            trustServerCertificate: false
          }
        });
        
        showMenu();
        break;
      
      case '6':
        console.log('Goodbye!');
        rl.close();
        process.exit(0);
        break;
      
      default:
        console.log('Invalid option!');
        showMenu();
    }
  });
}

// Start the program
require('dotenv').config();
showMenu();
```

Run this script to interactively test different connection scenarios:

```
node debug-connection.js
```

## 6. Common Solution Approaches

1. Try using a direct connection string instead of a config object:
   ```javascript
   await sql.connect('Server=yourserver;Database=yourdb;User Id=sa;Password=yourpass;Encrypt=false;TrustServerCertificate=true;');
   ```

2. Try using Windows Authentication if available:
   ```javascript
   await sql.connect({
     server: 'yourserver',
     database: 'yourdb',
     options: {
       encrypt: false,
       trustServerCertificate: true,
       integratedSecurity: true
     }
   });
   ```

3. Try connecting to SQL Server directly (bypassing any DNS issues):
   ```javascript
   await sql.connect({
     user: 'sa',
     password: 'yourpass',
     server: '192.168.1.x', // Use the actual IP address
     database: 'yourdb',
     options: {
       encrypt: false,
       trustServerCertificate: true
     }
   });
   ```

## 7. If All Else Fails

Consider using a compatible ORM or query builder that might handle the connection differently:
- Prisma
- TypeORM
- Sequelize
- Knex.js

These might use different connection strategies that could work better with your SQL Server setup.

Hope this helps you resolve your database connection issues!
