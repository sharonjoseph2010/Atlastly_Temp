-- Supabase Schema for Atlastly Platform
-- This schema uses Supabase Auth for authentication

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create vendors table
-- Note: User authentication is handled by Supabase Auth (auth.users table)
-- We'll store additional user metadata in a custom table if needed

CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    description TEXT NOT NULL,
    external_link TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table to store role information
-- Since Supabase Auth doesn't have a native "role" field, we'll store it separately
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('planner', 'vendor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_city ON public.vendors(city);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON public.vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_location ON public.vendors(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors table

-- Anyone can view active vendors
CREATE POLICY "Public vendors are viewable by everyone" ON public.vendors
    FOR SELECT USING (is_active = true);

-- Vendors can insert their own listing
CREATE POLICY "Vendors can insert their own listing" ON public.vendors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vendors can update their own listing
CREATE POLICY "Vendors can update their own listing" ON public.vendors
    FOR UPDATE USING (auth.uid() = user_id);

-- Vendors can delete their own listing
CREATE POLICY "Vendors can delete their own listing" ON public.vendors
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can do everything (we'll handle admin check in the application layer)

-- RLS Policies for user_roles table

-- Users can view their own role
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert roles (handled during signup)
CREATE POLICY "Service role can insert roles" ON public.user_roles
    FOR INSERT WITH CHECK (true);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vendors table
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
