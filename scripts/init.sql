-- EcoTrack AI Database Schema
-- This script initializes the database with all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'))
);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    total_classifications INTEGER DEFAULT 0,
    total_chat_messages INTEGER DEFAULT 0,
    carbon_saved DECIMAL(10,2) DEFAULT 0.00,
    monthly_goal DECIMAL(10,2) DEFAULT 3.00,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waste classifications table
CREATE TABLE waste_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT,
    category VARCHAR(100) NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    disposal_method TEXT,
    environmental_impact TEXT,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carbon tracking table
CREATE TABLE carbon_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('transportation', 'energy', 'food', 'waste')),
    activity VARCHAR(255) NOT NULL,
    carbon_impact DECIMAL(8,2) NOT NULL, -- kg CO2 (negative for reduction)
    points_earned INTEGER DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    points_reward INTEGER DEFAULT 0,
    criteria JSONB NOT NULL, -- JSON criteria for earning the achievement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Goals table
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    deadline DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    points_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Challenges table
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    challenge_type VARCHAR(50) NOT NULL,
    target_value INTEGER NOT NULL,
    points_reward INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenge participation table
CREATE TABLE user_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, challenge_id)
);

-- Rewards table
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    category VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User reward redemptions table
CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- System logs table
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_points ON user_profiles(points DESC);
CREATE INDEX idx_waste_classifications_user_id ON waste_classifications(user_id);
CREATE INDEX idx_waste_classifications_created_at ON waste_classifications(created_at);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_carbon_activities_user_id ON carbon_activities(user_id);
CREATE INDEX idx_carbon_activities_date ON carbon_activities(date);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, points_reward, criteria) VALUES
('Eco Starter', 'Complete your first waste classification', 'leaf', 50, '{"type": "classification_count", "target": 1}'),
('Classification Master', 'Classify 100 waste items', 'camera', 200, '{"type": "classification_count", "target": 100}'),
('Chat Champion', 'Have 50 conversations with EcoBot', 'message-circle', 150, '{"type": "chat_count", "target": 50}'),
('Streak Keeper', 'Maintain a 30-day activity streak', 'calendar', 300, '{"type": "streak_days", "target": 30}'),
('Carbon Crusher', 'Reduce carbon footprint by 50%', 'zap', 500, '{"type": "carbon_reduction", "target": 50}'),
('Community Leader', 'Reach top 10 on the leaderboard', 'crown', 1000, '{"type": "leaderboard_rank", "target": 10}');

-- Insert default challenges
INSERT INTO challenges (title, description, challenge_type, target_value, points_reward, start_date, end_date) VALUES
('Weekly Warrior', 'Log 7 eco-activities this week', 'activity_count', 7, 100, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
('Classification Challenge', 'Classify 20 items this month', 'classification_count', 20, 250, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('Carbon Reduction Sprint', 'Reduce footprint by 10% this month', 'carbon_reduction', 10, 500, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- Insert default rewards
INSERT INTO rewards (name, description, points_cost, category, stock_quantity) VALUES
('EcoTrack Stickers', 'Set of eco-friendly stickers', 200, 'merchandise', 100),
('Digital Badge Pack', 'Exclusive digital badges for your profile', 100, 'digital', NULL),
('Eco-Friendly Water Bottle', 'Sustainable bamboo water bottle', 500, 'merchandise', 50),
('Tree Planting Certificate', 'Plant a tree in your name', 1000, 'environmental', NULL),
('Premium Features', '1 month premium access', 2000, 'subscription', NULL);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
