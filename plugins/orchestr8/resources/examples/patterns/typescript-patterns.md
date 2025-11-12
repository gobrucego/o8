---
id: typescript-patterns
category: example
tags: [typescript, patterns, error-handling, async, testing]
relatedAgents: [pattern-learner, typescript-core]
useWhen:
  - Implementing TypeScript patterns and conventions
  - Establishing error handling standards
  - Creating async/await patterns
estimatedTokens: 750
---

# TypeScript Pattern Examples

Common TypeScript patterns discovered in production codebases.

## Error Handling Patterns

### 1. Custom Error Hierarchy

```typescript
// Base error
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific errors
class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, `${resource} with id ${id} not found`);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}
```

### 2. Error Handling Middleware

```typescript
// Centralized error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Unexpected errors
  logger.error('Unexpected error', { error: err });
  return res.status(500).json({
    error: 'Internal server error',
  });
});
```

### 3. Service Layer Try-Catch Pattern

```typescript
// ✅ Good - Proper error handling
async function getUser(id: string): Promise<User> {
  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User', id);
    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Database error', { error, userId: id });
    throw new AppError(500, 'Failed to get user');
  }
}

// ❌ Bad - Missing error handling
async function getUser(id: string): Promise<User> {
  return await db.user.findUnique({ where: { id } });
}

// ❌ Bad - Swallowing errors
async function getUser(id: string): Promise<User | null> {
  try {
    return await db.user.findUnique({ where: { id } });
  } catch (error) {
    return null; // Silent failure!
  }
}
```

## Data Validation Patterns

### Zod Validation Pattern

```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

// Infer type
type User = z.infer<typeof UserSchema>;

// Validate
const user = UserSchema.parse(req.body);
```

## Async Patterns

### Promise-based with async/await

**Convention**:
- Use async/await (not .then/.catch)
- Always handle errors with try/catch
- Return promises from services
- Use Promise.all for parallel operations

```typescript
// ✅ Good - Follows pattern
async function getUser(id: string): Promise<User> {
  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');
    return user;
  } catch (error) {
    logger.error('Failed to get user', { id, error });
    throw error;
  }
}

// ❌ Bad - Doesn't follow pattern
function getUser(id: string) {
  return db.user.findUnique({ where: { id } })
    .then(user => {
      if (!user) throw new Error('Not found');
      return user;
    })
    .catch(error => {
      console.log(error);
      throw error;
    });
}
```

## Testing Patterns

### 1. AAA Pattern (Arrange-Act-Assert)

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Act
      const user = await userService.createUser(userData);

      // Assert
      expect(user.email).toBe(userData.email);
      expect(user.id).toBeDefined();
    });

    it('should throw ValidationError for invalid email', async () => {
      // Arrange
      const userData = {
        email: 'invalid',
        password: 'password123',
      };

      // Act & Assert
      await expect(
        userService.createUser(userData)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### 2. Mocking Strategy

```typescript
// Mock external dependencies
jest.mock('../database');
jest.mock('../email-service');

// Use factories for test data
const createUserData = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'password123',
  ...overrides,
});

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 3. Test Factories

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export const createUserData = (overrides: Partial<User> = {}): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  createdAt: new Date(),
  ...overrides,
});

// Usage in tests
const user = createUserData({ email: 'specific@example.com' });
```

## API Design Patterns

### 1. RESTful Conventions

```
GET    /api/v1/users          → List users
GET    /api/v1/users/:id      → Get user
POST   /api/v1/users          → Create user
PUT    /api/v1/users/:id      → Update user (full)
PATCH  /api/v1/users/:id      → Update user (partial)
DELETE /api/v1/users/:id      → Delete user
```

### 2. Request/Response Format

```typescript
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Success Response
{
  "data": {
    "id": "123",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}

// Error Response
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 3. Pagination Pattern

```typescript
// Request
GET /api/v1/users?page=2&limit=20&sort=createdAt:desc

// Response
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "links": {
    "first": "/api/v1/users?page=1&limit=20",
    "prev": "/api/v1/users?page=1&limit=20",
    "next": "/api/v1/users?page=3&limit=20",
    "last": "/api/v1/users?page=8&limit=20"
  }
}
```

## Best Practices

### DO ✅

1. **Use TypeScript Strict Mode**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

2. **Validate All Inputs**
   - Use Zod for runtime validation
   - Never trust external data
   - Validate at boundaries (API, config, external services)

3. **Handle Errors Explicitly**
   - Use try-catch for async operations
   - Create custom error types
   - Log errors with context

4. **Document Why, Not What**
   ```typescript
   // ✅ Good: Explains reasoning
   // We use soft delete to maintain referential integrity
   // and allow data recovery within 30 days
   user.deletedAt = new Date();

   // ❌ Bad: States the obvious
   // Set deletedAt to current date
   user.deletedAt = new Date();
   ```
