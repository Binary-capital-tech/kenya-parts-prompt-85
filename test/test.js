// Supabase + Gemini AI Integration
// Query all tables using natural language

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Configuration
const SUPABASE_URL = 'https://tlgjxxsscuyrauopinoz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZ2p4eHNzY3V5cmF1b3Bpbm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMDk1NzQsImV4cCI6MjA3MzY4NTU3NH0.d3V1ZdSUronzivRV5MlJSU0dFkfHzFKhk-Qgtfikgd0';
const GEMINI_API_KEY = 'AIzaSyAHLT1SXxArQIq5xZYJ4biplFhEch9OZkQ';

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Get all table names from Supabase using REST API
async function getAllTables() {
  try {
    // Query the PostgREST metadata endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // The root endpoint returns OpenAPI spec with all available tables
    const schema = await response.json();
    
    // Extract table names from the paths
    const tables = [];
    if (schema.paths) {
      for (const path in schema.paths) {
        // Paths are in format "/{tablename}"
        const tableName = path.replace('/', '');
        if (tableName && !tableName.includes('{')) {
          tables.push(tableName);
        }
      }
    }
    
    return tables.length > 0 ? tables : null;
  } catch (error) {
    console.log('Error discovering tables:', error.message);
    
    // Fallback: Try common Supabase storage tables
    console.log('\nTrying alternative method...');
    try {
      // Try to list tables by attempting queries
      const commonTables = ['users', 'profiles', 'posts', 'items', 'products', 'orders'];
      const existingTables = [];
      
      for (const table of commonTables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
          existingTables.push(table);
        }
      }
      
      return existingTables.length > 0 ? existingTables : null;
    } catch (e) {
      return null;
    }
  }
}

// Query a specific table
async function queryTable(tableName, options = {}) {
  try {
    let query = supabase.from(tableName).select('*');
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error querying table ${tableName}:`, error.message);
    return null;
  }
}

// Use Gemini to analyze table data
async function analyzeWithGemini(tableName, data) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      apiVersion: "v1"
    });

    const prompt = `Analyze this data from the "${tableName}" table and provide:
1. A brief summary of what this table contains
2. Key insights from the data
3. Any patterns or notable observations

Table: ${tableName}
Data: ${JSON.stringify(data, null, 2)}

Keep the response concise and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing with Gemini:', error.message);
    return null;
  }
}

// Natural language query using Gemini
async function naturalLanguageQuery(question, tableSchemas) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      apiVersion: "v1"
    });

    const prompt = `Given these database tables: ${JSON.stringify(tableSchemas, null, 2)}

User question: "${question}"

Respond with a JSON object containing:
{
  "table": "table_name_to_query",
  "explanation": "brief explanation of what data to look for"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Error with natural language query:', error.message);
    return null;
  }
}

// Main function to query all tables
async function queryAllTables(tableNames, limit = 5) {
  console.log('🔍 Querying all tables in Supabase...\n');
  
  const results = {};
  
  for (const tableName of tableNames) {
    console.log(`\n📊 Querying table: ${tableName}`);
    console.log('─'.repeat(50));
    
    const data = await queryTable(tableName, { limit });
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} records (showing up to ${limit})`);
      results[tableName] = data;
      
      // Analyze with Gemini
      console.log('\n🤖 Gemini Analysis:');
      const analysis = await analyzeWithGemini(tableName, data);
      if (analysis) {
        console.log(analysis);
      }
    } else {
      console.log('No data found or table is empty');
    }
  }
  
  return results;
}

// Interactive mode - ask questions about your data
async function interactiveMode(tableNames) {
  console.log('\n💬 Interactive Mode');
  console.log('Ask questions about your database in natural language!\n');
  
  // Example question
  const question = "What tables contain user information?";
  console.log(`Question: ${question}\n`);
  
  const tableSchemas = tableNames.map(name => ({ name }));
  const suggestion = await naturalLanguageQuery(question, tableSchemas);
  
  if (suggestion) {
    console.log('Gemini suggests querying:', suggestion.table);
    console.log('Reason:', suggestion.explanation);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Supabase + Gemini Integration\n');
  
  // Test Gemini connection
  console.log('Testing Gemini API...');
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      apiVersion: "v1"
    });
    const result = await model.generateContent("Say hello!");
    const response = await result.response;
    console.log('✅ Gemini API connected!\n');
  } catch (error) {
    console.log('❌ Gemini API error:', error.message);
    return;
  }
  
  // Discover tables automatically
  console.log('🔍 Discovering tables in your Supabase database...\n');
  let tableNames = await getAllTables();
  
  if (!tableNames || tableNames.length === 0) {
    console.log('❌ Could not auto-discover tables.');
    console.log('Please check your Supabase dashboard and manually add table names to the script.\n');
    console.log('Example:');
    console.log('const tableNames = ["users", "posts", "comments"];');
    return;
  }
  
  console.log(`✅ Found ${tableNames.length} tables:`, tableNames.join(', '));
  console.log('');
  
  // Query all tables
  const results = await queryAllTables(tableNames, 5);
  
  // Show summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  
  for (const [tableName, data] of Object.entries(results)) {
    if (data && data.length > 0) {
      console.log(`\n${tableName}: ${data.length} records`);
      console.log('Sample columns:', Object.keys(data[0]).join(', '));
    }
  }
  
  // Interactive question answering
  if (tableNames.length > 0) {
    await interactiveMode(tableNames);
  }
  
  console.log('\n✅ Complete!');
  console.log(`\nQueried ${tableNames.length} tables from your Supabase database.`);
}

// Run the script
main().catch(console.error);