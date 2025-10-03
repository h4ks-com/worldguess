-- Initialize PostGIS extensions for worldguess database
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Connect to the worldguess database and install PostGIS extensions
\c worldguess;

-- Install PostGIS extensions
CREATE EXTENSION IF NOT EXISTS postgis CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis_raster CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis_topology CASCADE;

-- Grant usage permissions to the postgres user
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Log successful initialization
SELECT 'PostGIS extensions successfully installed for worldguess database' AS status;