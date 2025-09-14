# 📚 API Documentation

## Authentication Endpoints

### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### User Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

## Contest Endpoints

### Get Contest Details
```http
GET /api/contests/{contestId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "name": "Weekly Programming Challenge",
  "description": "A challenging contest with algorithmic problems",
  "startTime": "2024-01-20T09:00:00Z",
  "endTime": "2024-01-20T12:00:00Z",
  "problems": [
    {
      "id": 1,
      "title": "Two Sum",
      "difficulty": "EASY",
      "timeLimit": 2,
      "memoryLimit": 256
    }
  ]
}
```

### Join Contest
```http
POST /api/contests/{contestId}/join
Authorization: Bearer {token}
```

### Get Leaderboard
```http
GET /api/contests/{contestId}/leaderboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "user": {
        "id": 1,
        "username": "alice"
      },
      "score": 300,
      "solvedProblems": 3,
      "totalTime": "01:45:30"
    }
  ]
}
```

## Submission Endpoints

### Submit Code
```http
POST /api/submissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "problemId": 1,
  "contestId": 1,
  "code": "public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here\n    }\n}",
  "language": "JAVA"
}
```

**Response:**
```json
{
  "submissionId": 123,
  "status": "PENDING",
  "submittedAt": "2024-01-20T10:15:00Z",
  "language": "JAVA"
}
```

### Get Submission Status
```http
GET /api/submissions/{submissionId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "submissionId": 123,
  "status": "ACCEPTED",
  "result": "All test cases passed",
  "score": 100,
  "executionTime": 150,
  "memoryUsed": 45,
  "submittedAt": "2024-01-20T10:15:00Z"
}
```

## Supported Programming Languages

| Language | File Extension | Execution Command |
|----------|----------------|-------------------|
| Java | `.java` | `javac Main.java && java Main` |
| Python | `.py` | `python3 solution.py` |
| C++ | `.cpp` | `g++ -o solution solution.cpp && ./solution` |
| C | `.c` | `gcc -o solution solution.c && ./solution` |
| JavaScript | `.js` | `node solution.js` |
| Go | `.go` | `go run solution.go` |
| Rust | `.rs` | `rustc solution.rs && ./solution` |

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "timestamp": "2024-01-20T10:15:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid input parameters",
  "path": "/api/submissions"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
