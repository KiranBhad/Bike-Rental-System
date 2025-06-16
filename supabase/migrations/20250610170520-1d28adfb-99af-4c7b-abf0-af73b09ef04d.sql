
-- Create users profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bikes table
CREATE TABLE public.bikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  brand TEXT NOT NULL,
  type TEXT NOT NULL,
  price_per_day DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bike_id UUID REFERENCES public.bikes(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  booking_status TEXT DEFAULT 'active' CHECK (booking_status IN ('active', 'completed', 'cancelled')),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for bikes (public read, admin write)
CREATE POLICY "Anyone can view bikes" ON public.bikes
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can manage bikes" ON public.bikes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample bikes
INSERT INTO public.bikes (name, model, brand, type, price_per_day, description, image_url) VALUES
('Mountain Explorer', 'MTB-2024', 'Trek', 'Mountain', 25.00, 'Perfect for off-road adventures with 21-speed gear system.', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500'),
('City Cruiser', 'CC-2024', 'Giant', 'City', 15.00, 'Comfortable city bike ideal for daily commuting.', 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500'),
('Road Runner', 'RR-2024', 'Specialized', 'Road', 30.00, 'Lightweight road bike for speed enthusiasts.', 'https://images.unsplash.com/photo-1553978297-833d24eaacd3?w=500'),
('Electric Glide', 'EG-2024', 'Rad Power', 'Electric', 45.00, 'Electric bike with 50-mile range and pedal assist.', 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
