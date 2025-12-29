import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateUsersFromExcel() {
  try {
    console.log('📊 Reading Excel file...');
    
    // Read the Excel file
    const excelPath = join(__dirname, '../../../Calling data.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Found ${data.length} rows in Excel file`);

    // Extract unique Lead_Owner values
    const leadOwners = new Set();
    data.forEach(row => {
      const owner = row['Lead_Owner'] || row['Lead Owner'] || row['lead_owner'] || row['owner'];
      if (owner && typeof owner === 'string' && owner.trim()) {
        leadOwners.add(owner.trim());
      }
    });

    console.log(`👥 Found ${leadOwners.size} unique Lead Owners`);

    // Generate password hash for "123"
    const passwordHash = await bcrypt.hash('123', 10);
    console.log('🔐 Generated password hash for "123"');

    // Create user objects
    const users = [];
    for (const owner of leadOwners) {
      // Create username from owner name (lowercase, replace spaces with dots)
      const username = owner.toLowerCase().replace(/\s+/g, '.');
      
      users.push({
        username,
        password: passwordHash,
        agentName: owner,
        role: 'agent'
      });
    }

    // Sort by username
    users.sort((a, b) => a.username.localeCompare(b.username));

    // Generate JavaScript file for userService
    const jsContent = `import bcrypt from 'bcryptjs';

// Auto-generated from Lead_Owner column in Excel
// All users have password: 123
// Generated on: ${new Date().toISOString()}

// In-memory user store for MVP
const users = new Map();

// Users generated from Lead_Owner column
const defaultUsers = ${JSON.stringify(users, null, 2)};

// Initialize users
defaultUsers.forEach(user => {
  users.set(user.username, user);
});

class UserService {
  async authenticate(username, password) {
    const user = users.get(username);
    
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByUsername(username) {
    const user = users.get(username);
    if (!user) return null;
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createUser(username, password, agentName, role = 'agent') {
    if (users.has(username)) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      username,
      password: hashedPassword,
      agentName,
      role
    };

    users.set(username, user);
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  getAllAgents() {
    const agents = [];
    users.forEach(user => {
      if (user.role === 'agent' || user.role === 'admin') {
        const { password: _, ...userWithoutPassword } = user;
        agents.push(userWithoutPassword);
      }
    });
    return agents;
  }
}

export default new UserService();
`;

    // Write to userService.js
    const userServicePath = join(__dirname, '../services/userService.js');
    writeFileSync(userServicePath, jsContent, 'utf8');
    console.log('✅ Updated userService.js');

    // Generate user list file for reference
    const userListContent = `# Generated Users from Lead_Owner Column
# Generated on: ${new Date().toISOString()}
# Total Users: ${users.length}
# Default Password: 123

${users.map((user, index) => `
${index + 1}. ${user.agentName}
   Username: ${user.username}
   Password: 123
   Role: ${user.role}
`).join('\n')}

---

## Login Instructions

1. Go to http://localhost:5173
2. Enter your username (lowercase, spaces replaced with dots)
3. Enter password: 123
4. Click "Sign In"

## Example:
If your name in Lead_Owner column is: "John Doe"
Username: john.doe
Password: 123
`;

    const userListPath = join(__dirname, '../../../GENERATED_USERS.txt');
    writeFileSync(userListPath, userListContent, 'utf8');
    console.log('✅ Created GENERATED_USERS.txt');

    // Also create a JSON version
    const userListJson = users.map(({ password, ...rest }) => rest);
    const jsonPath = join(__dirname, '../../../GENERATED_USERS.json');
    writeFileSync(jsonPath, JSON.stringify(userListJson, null, 2), 'utf8');
    console.log('✅ Created GENERATED_USERS.json');

    console.log('\n🎉 SUCCESS!');
    console.log(`\n📋 Summary:`);
    console.log(`   - Found ${leadOwners.size} unique Lead Owners`);
    console.log(`   - Created ${users.length} user accounts`);
    console.log(`   - All passwords set to: 123`);
    console.log(`   - Updated: server/src/services/userService.js`);
    console.log(`   - Created: GENERATED_USERS.txt`);
    console.log(`   - Created: GENERATED_USERS.json`);
    console.log(`\n✨ You can now login with any Lead Owner name!`);
    console.log(`   Example: If Lead Owner is "Sarah Smith"`);
    console.log(`   Username: sarah.smith`);
    console.log(`   Password: 123\n`);

    return users;

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
generateUsersFromExcel();

