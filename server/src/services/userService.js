import bcrypt from 'bcryptjs';

// Auto-generated from Lead_Owner column in Excel
// All users have password: 123
// Generated on: 2025-12-29T07:05:39.534Z

// In-memory user store for MVP
const users = new Map();

// Users generated from Lead_Owner column
const defaultUsers = [
  {
    "username": "amisha",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Amisha",
    "role": "agent"
  },
  {
    "username": "anil",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Anil",
    "role": "agent"
  },
  {
    "username": "anjali",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Anjali",
    "role": "agent"
  },
  {
    "username": "gauri",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Gauri",
    "role": "agent"
  },
  {
    "username": "jyotsna",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Jyotsna",
    "role": "agent"
  },
  {
    "username": "manideep",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Manideep",
    "role": "agent"
  },
  {
    "username": "megha",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Megha",
    "role": "agent"
  },
  {
    "username": "milan",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Milan",
    "role": "agent"
  },
  {
    "username": "miloni",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Miloni",
    "role": "agent"
  },
  {
    "username": "nikita",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Nikita",
    "role": "agent"
  },
  {
    "username": "prachi",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Prachi",
    "role": "agent"
  },
  {
    "username": "pushpalata",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Pushpalata",
    "role": "agent"
  },
  {
    "username": "rachana",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Rachana",
    "role": "agent"
  },
  {
    "username": "radheyshyam",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Radheyshyam",
    "role": "agent"
  },
  {
    "username": "sahil",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Sahil",
    "role": "agent"
  },
  {
    "username": "sanaya",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Sanaya",
    "role": "agent"
  },
  {
    "username": "vipul",
    "password": "$2a$10$e/EEy572aOvkpTK.yuhII.t8c7.VAkZs6kcd0avTek2d9AUi0NFfW",
    "agentName": "Vipul",
    "role": "agent"
  }
];

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
