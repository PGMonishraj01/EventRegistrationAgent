# AI-Powered Event Registration Agent

This project is a complete decoupled web application consisting of a Java Spring Boot REST backend, a MySQL database, and a responsive HTML5/CSS3/Vanilla JavaScript frontend. It includes user authentication, an AI-powered assistant (recommender, planning consultant, and quotation generator), dynamic chat history recall, and a global dark theme.

## 📂 Project Structure

```
EventRegistration/
├── db/
│   └── schema.sql                # MySQL Schema creation script
├── frontend/                     # HTML5, CSS3, and JavaScript Frontend
│   ├── auth.html                 # Login, Sign Up, & Forgot Password page
│   ├── index.html                # Main interactive chat & history dashboard
│   ├── css/
│   │   └── styles.css            # Stylesheet containing design system, grids, and dark theme variables
│   └── js/
│       ├── auth.js               # Frontend authentication fetch routing & state logic
│       ├── dashboard.js          # Main page profile dropdown and login guards
│       ├── chat.js               # AI Chat interface, messaging & custom markdown parser
│       ├── theme.js              # Theme switcher logic with localStorage persistence
│       └── history.js            # History card loading and dynamic session recall
└── backend/                      # Spring Boot Maven Project
    ├── pom.xml                   # Maven dependencies and build configuration
    └── src/
        └── main/
            ├── java/
            │   └── com/
            │       └── eventagent/
            │           ├── EventAgentApplication.java    # Application entry point
            │           ├── config/
            │           │   └── CorsConfig.java            # Global CORS policy for separated clients
            │           ├── controller/
            │           │   ├── AuthController.java        # Authentication endpoints
            │           │   ├── AgentController.java       # AI chatbot endpoint
            │           │   └── HistoryController.java     # User history database endpoints
            │           ├── dto/
            │           │   ├── AuthRequest.java           # Login / Forgot DTO
            │           │   ├── RegisterRequest.java       # Signup DTO
            │           │   ├── ChatRequest.java           # Input message DTO
            │           │   └── ChatResponse.java          # Output message DTO with history metadata
            │           ├── entity/
            │           │   ├── User.java                  # User persistent model mapping
            │           │   └── EventHistory.java          # User session history persistent model mapping
            │           ├── repository/
            │           │   ├── UserRepository.java        # User database operations
            │           │   └── HistoryRepository.java     # EventHistory database operations
            │           └── service/
            │               ├── AuthService.java           # Registration, login, & password recovery services
            │               ├── AgentService.java          # Keyword parsing & event recommendation engine services
            │               └── HistoryService.java        # History save/retrieve orchestration services
            └── resources/
                └── application.properties                # Database and Spring Boot configurations
```

---

## 🛠️ Setup Instructions

### 1. Database Setup
1. Log into your local MySQL server.
2. Execute the DDL script located in [db/schema.sql](file:///c:/Users/pgmon/Desktop/EventRegistration/db/schema.sql) to create the database schema:
   ```bash
   mysql -u root -p < db/schema.sql
   ```
   *Note: If your MySQL user is not `root` or has a password other than `password`, make sure to update the credentials in the next step.*

### 2. Configure Backend
1. Open the [application.properties](file:///c:/Users/pgmon/Desktop/EventRegistration/backend/src/main/resources/application.properties) file in `backend/src/main/resources/`.
2. Modify database connection details if necessary:
   ```properties
   spring.datasource.username=your_mysql_username
   spring.datasource.password=your_mysql_password
   ```

### 3. Run Backend Server
1. Navigate to the `backend/` folder.
2. Build the Maven project:
   ```bash
   mvn clean package
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   The backend will start and listen on port `8080` (e.g., `http://localhost:8080`).

### 4. Run Frontend Client
Since the frontend is a fully decoupled static client communicating with REST APIs via CORS:
1. Open the `frontend/` folder.
2. Double-click [frontend/auth.html](file:///c:/Users/pgmon/Desktop/EventRegistration/frontend/auth.html) to run it directly in a web browser.
3. Register an account, log in, and begin chatting with the Event Registration Agent!

---

## 🔗 Sample API Requests & Responses

### 1. User Registration
* **Endpoint**: `POST /api/auth/signup`
* **Request Body**:
  ```json
  {
    "fullName": "Alice Smith",
    "email": "alice@gmail.com",
    "phoneNumber": "9876543210",
    "password": "securepassword123",
    "industry": "Technology"
  }
  ```
* **Response Body (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "User registered successfully!",
    "user": {
      "id": 1,
      "fullName": "Alice Smith",
      "email": "alice@gmail.com",
      "phoneNumber": "9876543210",
      "password": null,
      "industry": "Technology"
    }
  }
  ```

### 2. User Login
* **Endpoint**: `POST /api/auth/login`
* **Request Body**:
  ```json
  {
    "email": "alice@gmail.com",
    "password": "securepassword123"
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Login successful!",
    "user": {
      "id": 1,
      "fullName": "Alice Smith",
      "email": "alice@gmail.com",
      "phoneNumber": "9876543210",
      "password": null,
      "industry": "Technology"
    }
  }
  ```

### 3. AI Chat Query (Triggering Event Recommendations)
* **Endpoint**: `POST /api/agent/chat`
* **Headers**: `X-User-Id: 1`
* **Request Body**:
  ```json
  {
    "message": "Can you suggest some events to host today?"
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "response": "### 📅 AI Event Recommendations for 2026-07-04 (Summer Season)\n\nBased on today's season, here are three creative event ideas tailored for you:\n\n1. **Summer Coding Bootcamp**\n...",
    "title": "Seasonal Event Suggestions (Summer)",
    "type": "RECOMMENDATION",
    "historyId": 1
  }
  ```

### 4. Fetch User History Log
* **Endpoint**: `GET /api/history/1`
* **Response Body (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "title": "Seasonal Event Suggestions (Summer)",
      "type": "RECOMMENDATION",
      "createdAt": "2026-07-04T22:05:00"
    }
  ]
  ```

### 5. Fetch History Record Details
* **Endpoint**: `GET /api/history/details/1`
* **Response Body (200 OK)**:
  ```json
  {
    "id": 1,
    "title": "Seasonal Event Suggestions (Summer)",
    "type": "RECOMMENDATION",
    "content": "### 📅 AI Event Recommendations for 2026-07-04 (Summer Season)\n\nBased on today's season, here are three creative event ideas tailored for you:\n\n1. **Summer Coding Bootcamp**\n...",
    "createdAt": "2026-07-04T22:05:00"
  }
  ```
