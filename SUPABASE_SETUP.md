

# Supabase Database Setup

To get your Chat App working, you need to create the database tables in Supabase.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Go to the **SQL Editor** (icon on the left sidebar).
4. Click **New Query**.
5. Paste the following SQL code and click **Run**.

```sql
-- Create users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES users(id) NOT NULL,
  receiver_id UUID REFERENCES users(id) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for Users
-- Everyone can view user profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON users FOR SELECT 
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Users can insert their own profile (trigger or manual)
CREATE POLICY "Users can insert own profile" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policies for Messages
-- Users can view messages sent to them or by them
CREATE POLICY "Users can view their own messages" 
  ON messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can insert messages" 
  ON messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Users can update messages (e.g. mark as read) if they are the receiver
CREATE POLICY "Receivers can update messages" 
  ON messages FOR UPDATE 
  USING (auth.uid() = receiver_id);

-- Create a function to handle new user signup automatically (Optional but recommended)
-- This automatically creates a user profile when someone signs up via Supabase Auth
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Next Steps

1. Go to **Authentication** -> **Providers** and enable **Email**.
2. Go to **Settings** -> **API** and copy your **Project URL** and **anon public key**.
3. Create a `.env.local` file in your project root and add them:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```
