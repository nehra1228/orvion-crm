-- Add SUPER_HR to existing Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_HR';
