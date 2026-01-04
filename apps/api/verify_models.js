const fs = require('fs');
const path = require('path');

// 1. Parse Database Schema
const schemaContent = fs.readFileSync('/tmp/db_schema.sql', 'utf8');
const tables = {};
let currentTable = null;

schemaContent.split('\n').forEach(line => {
    const createTableMatch = line.match(/^CREATE TABLE `(\w+)` \(/);
    if (createTableMatch) {
        currentTable = createTableMatch[1];
        tables[currentTable] = [];
    } else if (currentTable && line.match(/^  `(\w+)`/)) {
        const colMatch = line.match(/^  `(\w+)` \w+/);
        if (colMatch) {
            tables[currentTable].push(colMatch[1]);
        }
    } else if (line.startsWith(') ENGINE=')) {
        currentTable = null;
    }
});

// 2. Map Models to Tables and Parse Columns
const modelsDir = '/home/sohaib/Desktop/project/eghata/apps/api/app/Models';
const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts'));

console.log('--- ANALYSIS RESULT ---');

modelFiles.forEach(file => {
    const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
    const className = file.replace('.ts', '');
    
    // Determine table name
    // 1. Check for public static table = 'name'
    const tablePropMatch = content.match(/public static table = '(\w+)'/);
    let tableName = tablePropMatch ? tablePropMatch[1] : null;
    
    // 2. Default to snake_case plural (AdonisJS convention)
    if (!tableName) {
        tableName = className
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .toLowerCase() + 's';
        
        // Handle explicit exceptions or pluralization mismatches if needed
        if (!tables[tableName]) {
             // check irregular plurals
             if (className === 'Feedback' && tables['feedback']) tableName = 'feedback';
             else if (className === 'Inventory' && tables['inventories']) tableName = 'inventories';
             else if (className === 'Auth' && tables['auth']) tableName = 'auth';
             // simple singular check
             else if (tables[className.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()]) {
                 tableName = className.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
             }
        }
    }

    if (!tables[tableName]) {
        return;
    }

    // Parse columns from Model
    const modelColumns = [];
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        // Look for @column decorators
        if (lines[index-1] && lines[index-1].includes('@column')) {
             const colNameMatch = lines[index-1].match(/columnName:\s*'(\w+)'/);
             if (colNameMatch) {
                 modelColumns.push(colNameMatch[1]);
             } else {
                 // matched prop name
                 const propMatch = line.match(/public\s+(\w+)[:?]/);
                 if (propMatch) {
                    // Convert prop name to snake_case for DB comparison
                    const snakeProp = propMatch[1].replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
                    modelColumns.push(snakeProp);
                 }
             }
        }
    });

    // Compare
    // Ignore id, timestamps, deleted_at as they are often handled by inheritance or auto decorators that my regex might miss, 
    // or standard BaseModel traits.
    const dbCols = tables[tableName];
    const missingInModel = dbCols.filter(c => 
        !modelColumns.includes(c) && 
        c !== 'id' && 
        c !== 'created_at' && 
        c !== 'updated_at' && 
        c !== 'deleted_at'
    );
    
    if (missingInModel.length > 0) {
        console.log(`MODEL: ${className}.ts`);
        console.log(`TABLE: ${tableName}`);
        console.log(`MISSING COLUMNS: ${JSON.stringify(missingInModel)}`);
        console.log('-------------------------');
    }
});
