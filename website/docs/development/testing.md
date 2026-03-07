---
sidebar_position: 3
title: Testing Guide
description: Comprehensive testing guide for V-COMM including unit, integration, and E2E tests
keywords: [testing, unit tests, integration tests, e2e, jest, testing-library]
tags: [development, testing]
---

# Testing Guide

## Overview

This guide covers V-COMM's testing philosophy, strategies, and best practices. We maintain high code quality through comprehensive testing at multiple levels.

## Testing Pyramid

```
        /\
       /  \
      / E2E \         - 10% (End-to-end tests)
     /--------\
    /          \
   / Integration \     - 20% (Integration tests)
  /--------------\
 /                \
/     Unit Tests    \  - 70% (Unit tests)
/--------------------\
```

## Test Organization

### Directory Structure

```
src/
├── modules/
│   └── users/
│       ├── users.service.ts
│       ├── users.repository.ts
│       └── __tests__/
│           ├── unit/
│           │   ├── users.service.test.ts
│           │   └── users.repository.test.ts
│           └── integration/
│               └── users.integration.test.ts
├── tests/
│   ├── e2e/
│   │   ├── auth.e2e.test.ts
│   │   └── messages.e2e.test.ts
│   ├── fixtures/
│   └── utils/
└── jest.config.js
```

## Unit Testing

### Basic Unit Test

```typescript
// users.service.test.ts
import { UserService } from '../users.service';
import { UserRepository } from '../users.repository';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Create mock repository
    repository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn()
    } as any;

    service = new UserService(repository);
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      };
      repository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.getById('1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(repository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null when user not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getById('999');

      // Assert
      expect(result).toBeNull();
      expect(repository.findById).toHaveBeenCalledWith('999');
    });
  });
});
```

### Testing with TypeScript

```typescript
// Test async functions
it('should create user with hashed password', async () => {
  const dto: CreateUserDTO = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  };

  const result = await service.create(dto);

  expect(result).toBeDefined();
  expect(result.id).toBeDefined();
  expect(result.password).not.toBe(dto.password);
});

// Test error cases
it('should throw ValidationError when email is already registered', async () => {
  repository.findByEmail.mockResolvedValue({
    id: '1',
    email: 'john@example.com'
  });

  const dto: CreateUserDTO = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  };

  await expect(service.create(dto)).rejects.toThrow(ValidationError);
});

// Test custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toHaveStatus(code: number): R;
    }
  }
}

expect.extend({
  toBeValidEmail(received: string) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass,
      message: () => pass ? 'Email is valid' : 'Email is invalid'
    };
  }
});
```

### Mocking

```typescript
// Mock external dependencies
jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock repositories
const mockRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
};

// Configure mock behavior
mockRepository.findById.mockResolvedValue(mockUser);
mockRepository.findById.mockRejectedValue(new Error('Not found'));

// Partial mocking
jest.spyOn(UserService, 'validateEmail').mockImplementation((email) => {
  return email === 'valid@example.com';
});

// Restore mocks
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
```

## Integration Testing

### API Integration Tests

```typescript
// auth.integration.test.ts
import request from 'supertest';
import { app } from '../../app';
import { createTestUser } from '../fixtures/users';

describe('Authentication API', () => {
  let testUser: any;

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
    testUser = await createTestUser({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  afterAll(async () => {
    // Cleanup
    await cleanupTestDatabase();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('id');
    });

    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid credentials');
    });
  });
});
```

### Database Integration Tests

```typescript
// users.repository.integration.test.ts
import { Pool } from 'pg';
import { UserRepository } from '../users.repository';

describe('UserRepository Integration', () => {
  let repository: UserRepository;
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL
    });
    repository = new UserRepository(pool);

    // Run migrations
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  });

  afterAll(async () => {
    await pool.query('DROP TABLE users');
    await pool.end();
  });

  describe('create', () => {
    it('should create user in database', async () => {
      const user = await repository.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password'
      });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');

      // Verify in database
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
      expect(result.rows).toHaveLength(1);
    });
  });
});
```

## End-to-End Testing

### Playwright E2E Tests

```typescript
// auth.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should login user', async ({ page }) => {
    // Navigate to login
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);

    // Fill credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });

  test('should logout user', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Logout
    await page.click('button:has-text("Logout")');

    // Verify redirect to home
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Login')).toBeVisible();
  });
});
```

### API E2E Tests

```typescript
// messages.e2e.test.ts
import request from 'supertest';
import { createTestUser, createTestChannel } from '../fixtures';

describe('Messages E2E', () => {
  let authToken: string;
  let user: any;
  let channel: any;

  beforeAll(async () => {
    user = await createTestUser();
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: user.email,
        password: user.password
      });

    authToken = loginResponse.body.token;
    channel = await createTestChannel(user.id);
  });

  describe('Message Creation and Retrieval', () => {
    it('should create and retrieve message', async () => {
      // Create message
      const createResponse = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          channelId: channel.id,
          content: 'Hello, world!'
        })
        .expect(201);

      const messageId = createResponse.body.id;

      // Retrieve message
      const getResponse = await request(app)
        .get(`/api/v1/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.content).toBe('Hello, world!');
      expect(getResponse.body.userId).toBe(user.id);
    });
  });
});
```

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/types/**'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000
};
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true
  }
});
```

## Test Fixtures

```typescript
// tests/fixtures/users.ts
import { faker } from '@faker-js/faker';
import { hashPassword } from '@/utils/crypto';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

export async function createTestUser(
  overrides: Partial<TestUser> = {}
): Promise<TestUser> {
  const password = overrides.password || faker.internet.password(12);
  const hashedPassword = await hashPassword(password);

  const user = await db.query(
    `INSERT INTO users (email, password, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, password, name`,
    [
      overrides.email || faker.internet.email(),
      hashedPassword,
      overrides.name || faker.person.fullName()
    ]
  );

  return {
    ...user.rows[0],
    password // Return unhashed password for testing
  };
}

export function createTestUsers(count: number): TestUser[] {
  return Array.from({ length: count }, () => ({
    email: faker.internet.email(),
    password: faker.internet.password(),
    name: faker.person.fullName()
  }));
}
```

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- users.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="authentication"

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run specific E2E test
npm run test:e2e -- auth.e2e.test.ts
```

## Test Best Practices

### General Guidelines

1. **Test behavior, not implementation**
2. **Write tests before code (TDD) when possible**
3. **Keep tests independent and isolated**
4. **Use descriptive test names**
5. **AAA pattern: Arrange, Act, Assert**

### Test Data

```typescript
// ✅ Good - Use fixtures or factories
const user = await createTestUser();
const channel = await createTestChannel(user.id);

// ❌ Avoid - Hardcoded test data
const user = { id: '1', email: 'test@test.com', name: 'Test' };
```

### Test Isolation

```typescript
// ✅ Good - Isolated tests
describe('UserService', () => {
  beforeEach(() => {
    // Fresh state for each test
    jest.clearAllMocks();
  });
});

// ❌ Avoid - Shared state
let testUser: any;
beforeAll(async () => {
  testUser = await createTestUser();
});
```

## Coverage Goals

| Component | Lines | Branches | Functions |
|-----------|-------|----------|-----------|
| Core Services | 85% | 80% | 85% |
| API Controllers | 75% | 70% | 75% |
| Repositories | 80% | 75% | 80% |
| Utilities | 90% | 85% | 90% |
| **Overall** | **80%** | **75%** | **80%** |

## See Also

- [Development Setup](./setup)
- [Coding Standards](./coding-standards)
- [Contributing Guide](../contributing)
- [API Reference](../api/index)