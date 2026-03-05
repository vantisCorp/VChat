---
sidebar_position: 2
title: Coding Standards
description: V-COMM coding standards and best practices for developers
keywords: [coding standards, style guide, best practices, conventions]
tags: [development, standards]
---

# Coding Standards

## Overview

This document defines the coding standards and best practices for V-COMM development. Following these standards ensures consistent, maintainable, and high-quality code across the project.

## TypeScript Guidelines

### Naming Conventions

```typescript
// Variables and functions: camelCase
const userName = 'john_doe';
const userCount = 100;

function getUserById(id: string): User {
  // ...
}

// Classes, interfaces, types: PascalCase
class UserService {}
interface UserRepository {}
type UserRole = 'admin' | 'user' | 'guest';

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;

// Enum members: PascalCase
enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Banned = 'banned'
}

// Files: kebab-case
// user-service.ts
// auth-middleware.ts
// types.ts
```

### Type Definitions

```typescript
// Prefer interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Use type for unions, intersections, and mapped types
type UserRole = 'admin' | 'user' | 'guest';
type UserWithRole = User & { role: UserRole };
type UserKeys = keyof User;

// Avoid 'any' - use 'unknown' when type is truly unknown
function parseJson(input: string): unknown {
  return JSON.parse(input);
}

// Use generics for reusable code
function getById<T>(id: string, collection: T[]): T | undefined {
  return collection.find(item => (item as any).id === id);
}

// Use 'readonly' for immutable data
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}

// Use 'as const' for literal types
const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard'
} as const;
```

### Error Handling

```typescript
// Use custom error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Handle errors explicitly
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      throw new APIError(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      // Re-throw known errors
      throw error;
    }
    
    // Wrap unknown errors
    throw new NetworkError('Failed to fetch user', { cause: error });
  }
}

// Use Result pattern for expected failures
type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

function validateEmail(email: string): Result<string, string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email format' };
  }
  
  return { success: true, value: email.toLowerCase() };
}
```

### Async/Await

```typescript
// Prefer async/await over .then()
// ✅ Good
async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ❌ Avoid
function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`)
    .then(response => response.json());
}

// Handle promise rejections
async function fetchAllUsers(): Promise<User[]> {
  const results = await Promise.allSettled([
    fetch('/api/users/1'),
    fetch('/api/users/2'),
    fetch('/api/users/3')
  ]);
  
  const successes = results
    .filter((r): r is PromiseFulfilledResult<Response> => 
      r.status === 'fulfilled'
    )
    .map(r => r.value);
  
  return Promise.all(successes.map(r => r.json()));
}
```

## Code Organization

### File Structure

```
src/
├── modules/
│   ├── users/
│   │   ├── index.ts           # Module exports
│   │   ├── users.service.ts   # Business logic
│   │   ├── users.controller.ts # HTTP handlers
│   │   ├── users.repository.ts # Data access
│   │   ├── users.types.ts     # Type definitions
│   │   ├── users.test.ts      # Tests
│   │   └── __mocks__/
│   │       └── users.repository.mock.ts
│   └── auth/
│       └── ...
├── common/
│   ├── middleware/
│   ├── utils/
│   └── types/
└── config/
```

### Module Pattern

```typescript
// users.service.ts
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly cache: CacheService
  ) {}
  
  async getById(id: string): Promise<User | null> {
    // Check cache first
    const cached = await this.cache.get<User>(`user:${id}`);
    if (cached) return cached;
    
    // Fetch from repository
    const user = await this.repository.findById(id);
    if (user) {
      await this.cache.set(`user:${id}`, user, 3600);
    }
    
    return user;
  }
}

// users.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
}
```

### Import Organization

```typescript
// 1. Node built-ins
import { createServer } from 'http';
import { randomBytes } from 'crypto';

// 2. External packages
import express from 'express';
import { z } from 'zod';
import { Pool } from 'pg';

// 3. Internal packages (absolute paths)
import { config } from '@/config';
import { Logger } from '@/common/logger';
import { middleware } from '@/common/middleware';

// 4. Relative imports
import { UserService } from './users.service';
import { UserRepository } from './users.repository';
import type { User, CreateUserDTO } from './users.types';

// 5. Types (type-only imports)
import type { Request, Response } from 'express';
```

## Code Quality

### Functions

```typescript
// Functions should do one thing
// ✅ Good
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}

function validateUser(user: CreateUserDTO): ValidationResult {
  const errors: string[] = [];
  
  if (!validateEmail(user.email)) {
    errors.push('Invalid email');
  }
  
  if (!validatePassword(user.password)) {
    errors.push('Password must be at least 8 characters');
  }
  
  return { valid: errors.length === 0, errors };
}

// ❌ Avoid - doing too many things
function validateAndCreateUser(user: CreateUserDTO): User {
  if (!validateEmail(user.email)) {
    throw new Error('Invalid email');
  }
  // ... more validation and creation logic
}

// Use default parameters
function greet(name: string, greeting: string = 'Hello'): string {
  return `${greeting}, ${name}!`;
}

// Use early returns
function processUser(user: User | null): string {
  if (!user) {
    return 'No user found';
  }
  
  if (!user.active) {
    return 'User is inactive';
  }
  
  return `Processing ${user.name}`;
}
```

### Comments and Documentation

```typescript
/**
 * Creates a new user in the system.
 * 
 * @param dto - The user data to create
 * @returns The created user with generated ID
 * @throws {ValidationError} If the email is already registered
 * @throws {DatabaseError} If the database operation fails
 * 
 * @example
 * ```typescript
 * const user = await userService.create({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'securePassword123'
 * });
 * ```
 */
async function create(dto: CreateUserDTO): Promise<User> {
  // Implementation
}

// Use inline comments sparingly
const MAX_RETRIES = 3; // Maximum number of retry attempts for API calls

// TODO comments should include ticket number
// TODO(#123): Implement password strength validation
// FIXME(#456): Handle race condition in user creation
```

## Testing Standards

### Test Organization

```typescript
// users.test.ts
describe('UserService', () => {
  let service: UserService;
  let repository: MockUserRepository;
  
  beforeEach(() => {
    repository = new MockUserRepository();
    service = new UserService(repository);
  });
  
  describe('getById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = { id: '1', name: 'John' };
      repository.findById.mockResolvedValue(mockUser);
      
      // Act
      const result = await service.getById('1');
      
      // Assert
      expect(result).toEqual(mockUser);
    });
    
    it('should return null when user not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);
      
      // Act
      const result = await service.getById('999');
      
      // Assert
      expect(result).toBeNull();
    });
  });
});
```

### Test Naming

```typescript
// Use descriptive test names
// ✅ Good
it('should return 401 when token is expired', () => {});
it('should create user with hashed password', () => {});
it('should throw ValidationError when email is invalid', () => {});

// ❌ Avoid
it('works', () => {});
it('test user', () => {});
```

## Security Best Practices

### Input Validation

```typescript
// Always validate and sanitize input
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['user', 'admin']).optional()
});

async function createUser(input: unknown): Promise<User> {
  const validated = createUserSchema.parse(input);
  // ...
}
```

### Secure Coding

```typescript
// Never log sensitive data
// ❌ Avoid
console.log('User login:', { email, password });

// ✅ Good
console.log('User login:', { email });

// Use parameterized queries
// ❌ Avoid - SQL injection risk
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Good - Parameterized
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [email]);

// Use secure random for tokens
// ❌ Avoid
const token = Math.random().toString(36);

// ✅ Good
const token = crypto.randomBytes(32).toString('hex');
```

## Performance Guidelines

### Efficient Database Queries

```typescript
// Select only needed fields
// ✅ Good
const users = await db.query(
  'SELECT id, name, email FROM users WHERE active = $1',
  [true]
);

// ❌ Avoid
const users = await db.query('SELECT * FROM users');

// Use indexes
// CREATE INDEX idx_users_email ON users(email);

// Batch operations
async function createMany(users: CreateUserDTO[]): Promise<User[]> {
  const values = users.map((u, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(',');
  const params = users.flatMap(u => [u.name, u.email, u.password]);
  
  const query = `
    INSERT INTO users (name, email, password)
    VALUES ${values}
    RETURNING *
  `;
  
  return db.query(query, params);
}
```

### Caching

```typescript
// Use caching for expensive operations
class CachedUserService {
  private cache = new LRUCache<string, User>({ max: 1000 });
  
  async getById(id: string): Promise<User | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;
    
    const user = await this.repository.findById(id);
    if (user) {
      this.cache.set(id, user);
    }
    
    return user;
  }
}
```

## Git Commit Standards

### Commit Messages

```
<type>(<scope>): <description>

[optional body]

[optional footer]

# Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting (no code change)
refactor: Code refactoring
test:     Adding tests
chore:    Maintenance tasks

# Examples:
feat(auth): add OAuth2 support for Google login
fix(api): resolve race condition in message delivery
docs(readme): update installation instructions
refactor(users): extract validation logic to separate module
test(auth): add integration tests for MFA flow
```

### Branch Naming

```
feature/issue-123-add-password-reset
fix/issue-456-message-delivery-race
docs/api-documentation-update
refactor/user-service-cleanup
```

## ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
};
```

## See Also

- [Development Setup](./setup)
- [Testing Guide](./testing)
- [Contributing Guide](../contributing)
- [Security Best Practices](../security/best-practices)