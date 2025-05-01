# Tactology Take-Home Test Project

This is a NestJS application built with GraphQL, TypeORM, and PostgreSQL. It provides CRUD operations for Departments and Sub-Departments, along with user authentication.

## Prerequisites

- Node.js (v20 or later recommended)
- npm (v10 or later recommended) or yarn
- A PostgreSQL database (e.g., local, Docker, Supabase, Neon)
- (Optional but Recommended) NestJS CLI installed globally:
  ```bash
  npm i -g @nestjs/cli
  ```

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd tactology_test
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

## Configuration

1.  Create a `.env` file in the root directory.
2.  Edit the `.env` file and set the `DATABASE_URL` variable to your PostgreSQL connection string.
3.  Add `JWT_SECRET` to your `.env` file. Generate a strong, random secret.

    Example `.env`:

    ```properties
    # PostgreSQL Config
    DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require"

    # Application Config
    PORT=3001
    NODE_ENV=development

    # JWT Secret (REQUIRED)
    JWT_SECRET=YOUR_SUPER_SECRET_RANDOM_STRING_HERE
    ```

    _Replace placeholders with your actual database credentials and generate a secure JWT secret._

## Running the Application Locally

1.  Start the development server:
    ```bash
    npm run start:dev
    # or
    yarn start:dev
    ```
2.  The GraphQL Playground (Apollo Sandbox) will be available locally at `http://localhost:3001/graphql`.

## Deployed Backend

The application is deployed and accessible at:

- **Backend URL:** [https://department-manager-n4vu.onrender.com](https://department-manager-n4vu.onrender.com)
- **GraphQL Playground:** [https://department-manager-n4vu.onrender.com/graphql](https://department-manager-n4vu.onrender.com/graphql)

_Note: The deployed instance uses a free tier, so it might take a moment to wake up on the first request._

## API Endpoints (GraphQL)

The GraphQL endpoint is `/graphql` (relative to the base URL, either local or deployed).

**Standard Response Format:**

Most API operations (excluding the paginated `departments` query) return a standardized response object:

```typescript
{
  success: boolean; // true for success, false for error
  message: string;  // Descriptive message (e.g., "Operation successful", "Resource not found")
  code: number;     // HTTP status code (e.g., 200, 201, 404, 500)
  data?: T | null;  // The actual data payload (type varies) or null on error/no data
}
```

**Paginated Response Format (for `departments` query):**

```typescript
{
  items: [Department]; // Array of department objects for the current page
  meta: {
    totalItems: number; // Total number of departments available
    itemCount: number; // Number of departments on the current page
    itemsPerPage: number; // The limit used for this request
    totalPages: number; // Total number of pages available
    currentPage: number; // The current page number
  }
}
```

**Note:** All Department and Sub-Department operations require authentication. You must first use the `login` mutation to obtain an access token and include it in the `Authorization` header of subsequent requests as a Bearer token (e.g., `Authorization: Bearer <your_access_token>`).

### Authentication

**1. Create User (for testing/setup)**

- **Mutation:**
  ```graphql
  mutation CreateUser($createUserInput: CreateUserDto!) {
    createUser(createUserInput: $createUserInput) {
      success
      message
      code
      data # Returns boolean
    }
  }
  ```
- **Variables:**
  ```json
  {
    "createUserInput": {
      "username": "testuser",
      "password": "password123"
    }
  }
  ```
- **Expected Output (Success):**
  ```json
  {
    "data": {
      "createUser": {
        "success": true,
        "message": "User created successfully",
        "code": 201,
        "data": true
      }
    }
  }
  ```
- **Expected Output (Failure Example - User Exists):**
  ```json
  {
    "data": {
      "createUser": {
        "success": false,
        "message": "User already exists", // Or similar error message
        "code": 500, // Or appropriate error code like 409 Conflict
        "data": false
      }
    }
  }
  ```

**2. Login**

- **Mutation:**
  ```graphql
  mutation Login($loginInput: LoginDto!) {
    login(loginInput: $loginInput) {
      success
      message
      code
      data {
        # Contains token and user info
        access_token
        username
        userId
      }
    }
  }
  ```
- **Variables:**
  ```json
  {
    "loginInput": {
      "username": "testuser",
      "password": "password123"
    }
  }
  ```
- **Expected Output (Success):**
  ```json
  {
    "data": {
      "login": {
        "success": true,
        "message": "Login successful",
        "code": 200,
        "data": {
          "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "username": "testuser",
          "userId": 1
        }
      }
    }
  }
  ```
- **Expected Output (Failure Example - Invalid Credentials):**
  ```json
  {
    "data": {
      "login": {
        "success": false,
        "message": "Invalid credentials",
        "code": 401,
        "data": null
      }
    }
  }
  ```

### Departments

_(Requires Authentication - Include `Authorization: Bearer <token>` header)_

**1. Get All Departments (Paginated)**

- **Query:**
  ```graphql
  query Departments($limit: Int, $page: Int) {
    departments(limit: $limit, page: $page) {
      items {
        id
        name
        # Add other fields from Department entity as needed
        subDepartments {
          id
          name
        }
      }
      meta {
        totalItems
        itemCount
        itemsPerPage
        totalPages
        currentPage
      }
    }
  }
  ```
- **Variables (Optional):**
  - `limit`: Number of items per page (default: 10)
  - `page`: Page number to retrieve (default: 1)
  ```json
  {
    "limit": 5,
    "page": 2
  }
  ```
- **Expected Output (Success):**
  ```json
  {
    "data": {
      "departments": {
        "items": [
          {
            "id": 6,
            "name": "Department F",
            "subDepartments": []
          },
          {
            "id": 7,
            "name": "Department G",
            "subDepartments": []
          }
          // ... up to 5 items for page 2
        ],
        "meta": {
          "totalItems": 25,
          "itemCount": 5,
          "itemsPerPage": 5,
          "totalPages": 5,
          "currentPage": 2
        }
      }
    }
  }
  ```

**2. Get Department by ID**

- **Query:**
  ```graphql
  query Department($id: Int!) {
    # ID should be Int based on resolver
    department(id: $id) {
      success
      message
      code
      data {
        # Single department object or null
        id
        name
        createdAt
        updatedAt
        # subDepartments { id name }
      }
    }
  }
  ```
- **Variables:**
  ```json
  {
    "id": 1
  }
  ```
- **Expected Output (Success):**
  ```json
  {
    "data": {
      "department": {
        "success": true,
        "message": "Department retrieved successfully",
        "code": 200,
        "data": {
          "id": 1,
          "name": "Engineering",
          "subDepartments": [{ "id":2 "name": "Software" },...],
          "createdAt": "2025-05-01T10:00:00.000Z",
          "updatedAt": "2025-05-01T10:05:00.000Z"
        }
      }
    }
  }
  ```
- **Expected Output (Not Found):**
  ```json
  {
    "data": {
      "department": {
        "success": false,
        "message": "Department not found",
        "code": 404,
        "data": null
      }
    }
  }
  ```

**3. Create Department**

- **Mutation:**
  ```graphql
  mutation CreateDepartment($payload: CreateDepartmentInput!) {
    createDepartment(payload: $payload) {
      code
      message
      success
      data {
        id
        name
        subDepartments {
          id
          name
        }
      }
    }
  ```
- **Variables:**

  ````json
  {
    "payload": {
      "name": "Sales"
    }
  }
  ``` or

  ```json
  {
  "payload": {
    "subDepartments": [
      {
        "name": null
      }
    ],
    "name": "department 1"
  }
  } ```
  ````

- **Expected Output (Success):**
  ```json
  {
    "data": {
      "createDepartment": {
        "success": true,
        "message": "Department created successfully",
        "code": 201,
        "data": {
          "id": 3,
          "name": "Sales"
        }
      }
    }
  }
  ```
- **Expected Output with subdepartments:**
  ```json
  {
    "data": {
      "createDepartment": {
        "success": true,
        "message": "Department created successfully",
        "code": 201,
        "data": {
          "id": 3,
          "name": "department 1",
          "subDepartments": [
            {
              "id": 2,
              "name": "subdepartment 1"
            }
          ]
        }
      }
    }
  }
  ```

**4. Update Department**

- **Mutation:**
  ```graphql
  mutation UpdateDepartment($payload: UpdateDepartmentInput!) {
    updateDepartment(payload: $payload) {
      success
      message
      code
      data {
        # Updated department object
        id
        name
      }
    }
  }
  ```
- **Variables:**
  ```json
  {
    "payload": {
      "id": 3,
      "name": "Global Sales"
    }
  }
  ```
- **Expected Output (Success):**
  ```json
  {
    "data": {
      "updateDepartment": {
        "success": true,
        "message": "Department updated successfully",
        "code": 200,
        "data": {
          "id": 3,
          "name": "Global Sales"
        }
      }
    }
  }
  ```

**5. Delete Department**

- **Mutation:**
  ```graphql
  mutation DeleteDepartment($id: Int!) {
    # ID should be Int
    deleteDepartment(id: $id) {
      success
      message
      code
      data # Returns boolean
    }
  }
  ```
- **Variables:**
  ```json
  {
    "id": 3
  }
  ```
- **Expected Output (Success):**
  ```json
  {
    "data": {
      "deleteDepartment": {
        "success": true,
        "message": "Department deleted successfully",
        "code": 200,
        "data": true
      }
    }
  }
  ```
- **Expected Output (Not Found):**
  ```json
  {
    "data": {
      "deleteDepartment": {
        "success": false,
        "message": "Department not found or could not be deleted",
        "code": 404,
        "data": false
      }
    }
  }
  ```

### Sub-Departments (Bonus)

_(Requires Authentication - Include `Authorization: Bearer <token>` header)_

**1. Create Sub-Department**

- **Mutation:**
  ```graphql
  mutation CreateSubDepartment($payload: CreateSubDepartmentInput!) {
    createSubDepartment(payload: $payload) {
      success
      message
      code
      data {
        # Created sub-department object
        id
        name
        parentId
      }
    }
  }
  ```
- **Variables:**
  ```json
  {
    "payload": {
      "name": "Regional Sales",
      "parentId": 3
    }
  }
  ```
- **Expected Output (Success):**
  ```json
  {
    "data": {
      "createSubDepartment": {
        "success": true,
        "message": "Sub-department created successfully",
        "code": 201,
        "data": {
          "id": 4,
          "name": "Regional Sales",
          "parentId": 3
        }
      }
    }
  }
  ```

**2. Update Sub-Department**

- **Mutation:**
  ```graphql
  mutation UpdateSubDepartment($payload: UpdateSubDepartmentInput!) {
    updateSubDepartment(payload: $payload) {
      success
      message
      code
      data {
        # Updated sub-department object
        id
        name
        parentId
      }
    }
  }
  ```
- **Variables:**
  ```json
  {
    "payload": {
      "id": 4,
      "name": "East Coast Sales"
    }
  }
  ```
- **Expected Output (Success):**
  ```json
  {
    "data": {
      "updateSubDepartment": {
        "success": true,
        "message": "Sub-department updated successfully",
        "code": 200,
        "data": {
          "id": 4,
          "name": "East Coast Sales",
          "parentId": 3
        }
      }
    }
  }
  ```

**3. Delete Sub-Department**

- **Mutation:**
  ```graphql
  mutation DeleteSubDepartment($id: Int!) {
    # ID should be Int
    deleteSubDepartment(id: $id) {
      success
      message
      code
      data # Returns boolean
    }
  }
  ```
- **Variables:**
  ```json
  {
    "id": 4
  }
  ```
- **Expected Output (Success):**
  ```json
  {
    "data": {
      "deleteSubDepartment": {
        "success": true,
        "message": "Sub-department deleted successfully",
        "code": 200,
        "data": true
      }
    }
  }
  ```
- **Expected Output (Not Found):**
  ```json
  {
    "data": {
      "deleteSubDepartment": {
        "success": false,
        "message": "Sub-department not found or could not be deleted",
        "code": 404,
        "data": false
      }
    }
  }
  ```

## Running Tests

```bash
npm run test
```

## License

MIT
