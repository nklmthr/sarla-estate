# Sarla Tea Estates CRM

A comprehensive Customer Relationship Management (CRM) system built with Spring Boot and React for managing tea estate operations, employee management, work assignments, and reporting.

> **📢 NEW**: Application now runs on a single port! Frontend and backend both accessible at http://localhost:8080

## Features

- **Employee Management**: Create, update, and manage employee information
- **Work Activity Tracking**: Define and track various work activities
- **Work Assignment Management**: Assign work to employees and track completion
- **Operation Scheduling**: Schedule and manage tea estate operations
- **Salary Management**: Track employee salaries and payments
- **Reporting**: Generate reports for upcoming assignments, payments, and more
- **RESTful API**: Well-structured REST endpoints for all operations
- **React Frontend**: Modern, responsive UI with Material-UI
- **Single Port Deployment**: Frontend and backend served on port 8080
- **Security**: Spring Security integration with JWT support
- **Database**: MySQL with JPA/Hibernate
- **Logging**: Comprehensive logging with SLF4J
- **Exception Handling**: Global exception handling with custom error responses

## Technology Stack

### Backend
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **Spring Security**
- **MySQL 8.0+**
- **Lombok**
- **Maven**
- **JWT (JSON Web Tokens)**

### Frontend
- **React 18.2**
- **TypeScript 4.9**
- **Material-UI (MUI) 5.14**
- **React Router 6.20**
- **Axios**

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+ (or access to MySQL cloud instance)
- Node.js 18+ and npm (automatically installed by Maven during build)
- IDE (IntelliJ IDEA, Eclipse, or VS Code)

## Getting Started

### Quick Start (Recommended)

The easiest way to build and run the application:

```bash
# Make scripts executable (first time only)
chmod +x build-and-run.sh

# Build and run everything
./build-and-run.sh
```

This will:
1. Build the React frontend
2. Build the Spring Boot backend
3. Package everything into a single JAR
4. Start the application on http://localhost:8080

**That's it!** The frontend and API are both available on port 8080.

### Manual Setup

#### 1. Clone the Repository

```bash
cd /Users/i344377/SAPDevelop/nklmthr/github/
git clone <your-repository-url>
cd sarla-tea-estates-crm
```

#### 2. Database Configuration

The application is configured to connect to MySQL. Update credentials in `src/main/resources/application.properties` if needed:

```properties
spring.datasource.url=jdbc:mysql://your-host:3306/sarla_estate?useSSL=true&requireSSL=true
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

#### 3. Build the Application

```bash
# Full build (includes React frontend)
mvn clean package -DskipTests
```

This Maven build will:
- Install Node.js and npm
- Install React dependencies
- Build the React frontend
- Copy React build to Spring Boot resources
- Build the Spring Boot backend
- Package everything into a single JAR

#### 4. Run the Application

```bash
# Run the packaged JAR
java -jar target/sarla-tea-estates-crm-1.0.0.jar
```

Or use Maven:

```bash
mvn spring-boot:run
```

#### 5. Access the Application

- **Frontend**: http://localhost:8080
- **API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/api/health

## API Endpoints

### Health Check
```
GET /api/health
```

### Employee Management
```
GET    /api/employees           # Get all employees
GET    /api/employees/{id}      # Get employee by ID
POST   /api/employees           # Create new employee
PUT    /api/employees/{id}      # Update employee
DELETE /api/employees/{id}      # Delete employee
```

### Work Activities
```
GET    /api/work-activities     # Get all work activities
GET    /api/work-activities/{id}  # Get work activity by ID
POST   /api/work-activities     # Create work activity
PUT    /api/work-activities/{id}  # Update work activity
DELETE /api/work-activities/{id}  # Delete work activity
```

### Work Assignments
```
GET    /api/work-assignments                    # Get all assignments
GET    /api/work-assignments/{id}              # Get assignment by ID
GET    /api/work-assignments/date/{date}       # Get assignments by date
POST   /api/work-assignments                   # Create assignment
PUT    /api/work-assignments/{id}              # Update assignment
DELETE /api/work-assignments/{id}              # Delete assignment
POST   /api/work-assignments/{id}/complete     # Mark assignment complete
```

### Operation Schedules
```
GET    /api/operation-schedules     # Get all schedules
POST   /api/operation-schedules     # Create schedule
PUT    /api/operation-schedules/{id}  # Update schedule
DELETE /api/operation-schedules/{id}  # Delete schedule
```

### Employee Salaries
```
GET    /api/employee-salaries                          # Get all salaries
GET    /api/employee-salaries/employee/{employeeId}    # Get by employee
GET    /api/employee-salaries/date-range?start={date}&end={date}  # Get by date range
POST   /api/employee-salaries                          # Create salary record
```

### Reports
```
GET    /api/reports/upcoming-assignments?days={n}     # Upcoming assignments
GET    /api/reports/payment?start={date}&end={date}   # Payment report
```

## Project Structure

```
sarla-tea-estates-crm/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── api/                # API client and service calls
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components
│   │   ├── types/              # TypeScript type definitions
│   │   └── App.tsx             # Main app component
│   ├── public/                 # Static assets
│   └── package.json            # Frontend dependencies
│
├── src/                        # Backend Spring Boot application
│   ├── main/
│   │   ├── java/
│   │   │   └── com/sarlatea/crm/
│   │   │       ├── config/          # Configuration (CORS, Security, SPA)
│   │   │       ├── controller/      # REST API controllers
│   │   │       ├── dto/             # Data Transfer Objects
│   │   │       ├── exception/       # Custom exceptions
│   │   │       ├── model/           # JPA entities
│   │   │       ├── repository/      # JPA repositories
│   │   │       ├── service/         # Business logic
│   │   │       └── SarlaTeaEstatesCrmApplication.java
│   │   └── resources/
│   │       ├── application.properties      # Main configuration
│   │       ├── application-dev.properties  # Dev environment
│   │       └── application-prod.properties # Production environment
│   └── test/
│       └── java/                # Test classes
│
├── target/                      # Build output
│   ├── classes/static/          # Built React app (auto-generated)
│   └── sarla-tea-estates-crm-1.0.0.jar  # Final packaged JAR
│
├── build-and-run.sh            # Quick build & run script
├── quick-build.sh              # Fast rebuild script
├── SINGLE_PORT_DEPLOYMENT.md  # Deployment guide
└── pom.xml                     # Maven configuration
```

## Domain Model

### Employee
- Employee information (name, contact, address)
- Employee status: ACTIVE, INACTIVE, ON_LEAVE, TERMINATED
- Employee types: PERMANENT, TEMPORARY, SEASONAL, CONTRACTOR

### WorkActivity
- Defines types of work (e.g., plucking, pruning, weeding)
- Base rates and descriptions

### WorkAssignment
- Assigns work to employees for specific dates
- Tracks assignment status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- Records actual work done and rates

### OperationSchedule
- Schedules operations across the estate
- Operation types: PLUCKING, PRUNING, WEEDING, FERTILIZATION, etc.
- Tracks start/end dates and status

### EmployeeSalary
- Records salary payments to employees
- Tracks payment dates, amounts, and work assignments

## Configuration Profiles

### Development (dev)
- Uses local PostgreSQL database
- Debug logging enabled
- SQL logging enabled
- DevTools enabled

### Production (prod)
- Production database configuration
- Environment variable-based credentials
- Optimized logging
- Connection pooling configured

## Building for Production

```bash
mvn clean package -DskipTests
```

The JAR file will be created in the `target/` directory:
```
target/sarla-tea-estates-crm-1.0.0.jar
```

Run the production JAR:

```bash
java -jar target/sarla-tea-estates-crm-1.0.0.jar --spring.profiles.active=prod
```

## Environment Variables for Production

Set the following environment variables for production:

```bash
export DB_USERNAME=your_db_username
export DB_PASSWORD=your_db_password
export JWT_SECRET=your_jwt_secret_key_here
```

## Security

The application uses Spring Security with JWT authentication. Currently configured with permissive access for development. 

**⚠️ Important**: Update the security configuration in `SecurityConfig.java` before deploying to production.

## Testing

Run tests with:

```bash
mvn test
```

## Development

### Adding New Features

1. Create entity in `model/` package
2. Create repository interface in `repository/` package
3. Create DTO in `dto/` package
4. Create service in `service/` package
5. Create controller in `controller/` package
6. Add appropriate tests

### Code Style

- Follow Java naming conventions
- Use Lombok annotations to reduce boilerplate
- Document public APIs with JavaDoc
- Write unit tests for business logic

## Logging

Logs are configured with different levels:
- **Development**: DEBUG level for application code
- **Production**: INFO level for application code

## Troubleshooting

See [SINGLE_PORT_DEPLOYMENT.md](SINGLE_PORT_DEPLOYMENT.md) for detailed troubleshooting guide.

### Common Issues

#### Database Connection Issues
- Verify MySQL is accessible (check host, port, credentials)
- Ensure MySQL connector is in dependencies
- Check database exists and user has permissions

#### Build Fails with npm Errors
- Delete `frontend/node_modules` and `target` directories
- Run `mvn clean package` again

#### Port Already in Use
Change the port in `application.properties`:
```properties
server.port=8081
```

#### API Returns 404
- Ensure all API URLs start with `/api/`
- Check controller mapping includes `/api` prefix

#### React Router Returns 404
- Verify `SpaConfig.java` is present and configured
- Rebuild with `mvn clean package`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software for Sarla Tea Estates.

## Contact

For questions or support, please contact the development team.

## Documentation

- [SINGLE_PORT_DEPLOYMENT.md](SINGLE_PORT_DEPLOYMENT.md) - Complete deployment guide
- [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) - Summary of recent changes
- [QUICK_START.md](QUICK_START.md) - Quick start guide (if exists)
- [END_TO_END_TESTING_GUIDE.md](END_TO_END_TESTING_GUIDE.md) - Testing guide

## Roadmap

- [x] Employee management
- [x] Work activity tracking
- [x] Work assignment management
- [x] Operation scheduling
- [x] Salary management
- [x] Basic reporting
- [x] React frontend with Material-UI
- [x] Single port deployment
- [ ] User authentication with login
- [ ] Role-based access control
- [ ] Advanced reporting and analytics
- [ ] Email notifications
- [ ] Mobile responsive improvements
- [ ] Export to Excel/PDF
- [ ] Dashboard with charts and metrics
- [ ] Audit logging

