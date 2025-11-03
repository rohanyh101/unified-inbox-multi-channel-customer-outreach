-- Database initialization script for Docker
-- This runs automatically when PostgreSQL container starts

-- Create database if it doesn't exist (this happens automatically with POSTGRES_DB)
-- Just ensure we have the right extensions

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: Create indexes for better performance (Prisma will also create these)
-- These are created here as examples - Prisma migrations will handle the actual schema
