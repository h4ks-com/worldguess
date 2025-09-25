# Worldguess Architecture

## Overview

Worldguess is a geography-based guessing game where players estimate the population within a circular area on a map. The project is structured as a self-hosted monorepo with three main components working together to deliver a complete gaming experience.

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Pipelines     │
│   (React)       │◄──►│   (FastAPI)      │    │   (Python)      │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │   MapLibre  │ │    │ │ API Routes   │ │    │ │    Jobs     │ │
│ │   Map View  │ │    │ │ Static Files │ │    │ │ Processing  │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │        │         │    │        │        │
└─────────────────┘    └────────┼─────────┘    └────────┼────────┘
        │                       │                       │
        │              ┌────────▼─────────┐             │
        └──────────────►│   PostgreSQL     │◄────────────┘
                       │   (Database)     │
                       └──────────────────┘
                                │
                       ┌────────▼─────────┐
                       │   Memcached      │
                       │   (Cache)        │
                       └──────────────────┘
```

## Components

### Frontend (`frontend/`)
- **Technology**: React 18 + TypeScript
- **Map Rendering**: MapLibre GL JS with react-map-gl
- **API Client**: Auto-generated from OpenAPI spec
- **Build Tool**: Create React App
- **Styling**: CSS with MapLibre CSS

**Key Features:**
- Interactive map with circle and polygon overlays
- Type-safe API communication via generated client
- Responsive design for gameplay interface

### Backend (`backend/`)
- **Technology**: FastAPI + Python 3.12
- **ORM**: SQLAlchemy 2.0 with GeoAlchemy2 for spatial data
- **Settings**: Pydantic Settings with environment variable support
- **Validation**: Pydantic models with geojson support

**Key Features:**
- RESTful API endpoints
- Static file serving for frontend
- OpenAPI spec generation for client generation
- Geographic data handling
- Health check endpoints

### Pipelines (`pipelines/`)
- **Technology**: Python 3.12 with asyncio
- **Architecture**: Job-based system with dependency management
- **Execution**: Multi-process jobs with timeout handling
- **Caching**: Memcached integration for intermediate results

**Key Features:**
- Asynchronous job execution
- Dependency-aware job scheduling
- Population data processing and loading
- Database connection management
- Status tracking and caching

## Data Flow

### Initial Setup
1. **Pipeline Execution**: Processes geographic and population data
2. **Database Population**: Loads processed data into PostgreSQL
3. **Status Caching**: Marks pipeline completion in Memcached

### Game Flow
1. **Frontend Request**: User accesses game interface
2. **Map Rendering**: MapLibre displays base map and game elements
3. **API Calls**: Frontend requests game data via generated client
4. **Backend Processing**: FastAPI serves data from PostgreSQL
5. **User Interaction**: Player makes population guesses
6. **Result Validation**: Backend validates and scores guesses

## Technology Stack

### Core Technologies
- **Languages**: TypeScript (Frontend), Python 3.12 (Backend/Pipelines)
- **Web Framework**: FastAPI with Uvicorn
- **Database**: PostgreSQL 17.0 with PostGIS capabilities
- **Cache**: Memcached for performance optimization
- **Maps**: MapLibre GL JS for interactive mapping

### Development Tools
- **Package Management**: Poetry (Python), npm (JavaScript)
- **Code Quality**: Ruff (Python linting/formatting), Prettier (JS/TS)
- **Type Checking**: MyPy (Python), TypeScript (Frontend)
- **API Generation**: OpenAPI → TypeScript client generation
- **Containerization**: Docker + Docker Compose

## Key Design Patterns

### Monorepo Structure
- Single repository containing all components
- Shared configuration and deployment
- Coordinated development and releases

### Type Safety
- End-to-end type safety from API to UI
- Auto-generated API clients prevent interface drift
- Strict type checking in both Python and TypeScript

### Job-Based Pipeline
- Modular, reusable job components
- Dependency management between jobs
- Fault tolerance with timeout handling
- Process isolation for resource management

### Environment-Driven Configuration
- All services configured via environment variables
- Docker Compose orchestrates service communication
- Development and production parity

## Deployment

### Self-Hosting
```bash
docker compose up
```

### Service Dependencies
- **PostgreSQL**: Persistent data storage
- **Memcached**: Performance caching
- **Frontend Build**: Static assets served by backend
- **Pipeline**: Populates initial data

### Ports and Networking
- **Backend**: Port 8000 (external access)
- **Database**: Internal network only
- **Cache**: Internal network only
- **Frontend**: Served as static files by backend

## Development Workflow

### API Development Cycle
1. Modify FastAPI endpoints in backend
2. Generate OpenAPI spec: `poetry run python generate_openapi_spec.py`
3. Regenerate frontend client: `npm run api`
4. Frontend gains type-safe access to new endpoints

### Code Quality Pipeline
- Pre-commit hooks ensure code quality
- Ruff handles Python formatting and linting
- MyPy provides static type checking
- Prettier formats TypeScript code

## Future Considerations

### Scalability
- Pipeline jobs can be distributed across multiple workers
- Backend can be horizontally scaled behind load balancer
- Database can be optimized with spatial indexing
- Caching layer can be expanded for geographic data

### Features
- Real-time multiplayer capabilities
- Advanced geographic data sources
- Mobile-responsive design improvements
- Analytics and player statistics