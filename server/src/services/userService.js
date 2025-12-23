import bcrypt from 'bcryptjs';

// In-memory user store for MVP
// In production, use a real database
const users = new Map();

// Initialize with some default users
// Password: "password123" for all default users
const defaultUsers = [
  {
    username: 'agent.smith',
    password: '$2a$10$7HiI8/sPdlQ.hBg/Id.rm.fIfehqEFXeka4WVWzHP4DU//BfL/HGu', // password123
    agentName: 'Agent Smith',
    role: 'agent'
  },
  {
    username: 'agent.jones',
    password: '$2a$10$7HiI8/sPdlQ.hBg/Id.rm.fIfehqEFXeka4WVWzHP4DU//BfL/HGu', // password123
    agentName: 'Agent Jones',
    role: 'agent'
  },
  {
    username: 'admin',
    password: '$2a$10$7HiI8/sPdlQ.hBg/Id.rm.fIfehqEFXeka4WVWzHP4DU//BfL/HGu', // password123
    agentName: 'Admin User',
    role: 'admin'
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

