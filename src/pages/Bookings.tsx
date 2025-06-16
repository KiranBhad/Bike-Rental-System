import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigate } from 'react-router-dom';

// Define booking type
interface Booking {
  id: string;
  user_id: string;
  bike_id: string;
  payment_status: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_price: number;
  bikes?: {
    name: string;
    model: string;
    brand: string;
    image_url: string;
  };
}

const Bookings = () => {
  const { user, loading: authLoading } = useAuth();

  const defaultBikeImage = 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=800&q=80';

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          bikes (
            name,
            model,
            brand,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">You haven't made any bookings yet.</p>
            <p className="text-gray-500 mt-2">Browse our bikes and make your first booking!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                {booking.bikes ? (
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={booking.bikes.image_url || defaultBikeImage}
                      alt={booking.bikes.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-200 flex items-center justify-center text-gray-500">
                    No bike data
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg">{booking.bikes?.name || 'Unknown Bike'}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{booking.bikes?.brand || 'Unknown Brand'}</Badge>
                    <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {booking.payment_status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span>{new Date(booking.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span>{new Date(booking.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span>{booking.total_days} day(s)</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total Price:</span>
                      <span>₹{booking.total_price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
