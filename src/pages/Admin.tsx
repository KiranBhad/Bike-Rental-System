import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import BookingModal from '@/components/BookingModal';

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBike, setSelectedBike] = useState<any>(null);

  // Default motorcycle image instead of bicycle
  const defaultBikeImage = 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=800&q=80';

  const { data: bookingsData = [], isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      // First get all bookings with bike information
      const { data: bookings, error: bookingsError } = await supabase
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
        .order('created_at', { ascending: false });
      
      if (bookingsError) throw bookingsError;

      // Then get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');
      
      if (profilesError) throw profilesError;

      // Manually join the data
      const bookingsWithProfiles = bookings.map(booking => ({
        ...booking,
        profiles: profiles.find(profile => profile.id === booking.user_id) || { full_name: 'Unknown User' }
      }));

      return bookingsWithProfiles;
    },
    enabled: !!user && isAdmin
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      // Get transactions with booking and bike information
      const { data: transactions, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          bookings (
            id,
            bikes (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (transactionsError) throw transactionsError;

      // Get profiles for user names
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');
      
      if (profilesError) throw profilesError;

      // Manually join profile data
      const transactionsWithProfiles = transactions.map(transaction => ({
        ...transaction,
        bookings: {
          ...transaction.bookings,
          profiles: profiles.find(profile => profile.id === transaction.user_id) || { full_name: 'Unknown User' }
        }
      }));

      return transactionsWithProfiles;
    },
    enabled: !!user && isAdmin
  });

  const { data: bikes = [], isLoading: bikesLoading } = useQuery({
    queryKey: ['admin-bikes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin
  });

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: status })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Booking status updated to ${status}`,
      });
      
      refetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive"
      });
    }
  };

  const handleBookBike = (bike: any) => {
    setSelectedBike(bike);
    setBookingModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  if (bookingsLoading || transactionsLoading || bikesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage bookings, monitor payments, and book rides</p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">All Bookings ({bookingsData.length})</TabsTrigger>
            <TabsTrigger value="transactions">Payment Transactions ({transactions.length})</TabsTrigger>
            <TabsTrigger value="book-rides">Book Rides ({bikes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <div className="grid grid-cols-1 gap-6">
              {bookingsData.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <img
                          src={booking.bikes?.image_url || defaultBikeImage}
                          alt={booking.bikes?.name || 'Bike'}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <CardTitle className="text-lg">{booking.bikes?.name}</CardTitle>
                          <p className="text-sm text-gray-600">
                            Customer: {booking.profiles?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Booking ID: {booking.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                          {booking.payment_status}
                        </Badge>
                        <Badge 
                          variant={
                            booking.booking_status === 'active' ? 'default' :
                            booking.booking_status === 'completed' ? 'secondary' : 'destructive'
                          }
                        >
                          {booking.booking_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">Start Date:</span>
                        <p>{new Date(booking.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">End Date:</span>
                        <p>{new Date(booking.end_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <p>{booking.total_days} day(s)</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <p className="font-semibold">₹{booking.total_price}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                        disabled={booking.booking_status === 'completed'}
                      >
                        Mark Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        disabled={booking.booking_status === 'cancelled'}
                      >
                        Cancel Booking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="grid grid-cols-1 gap-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Transaction ID:</span>
                        <p className="font-mono">{transaction.transaction_id || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <p className="font-semibold">₹{transaction.amount}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Payment Method:</span>
                        <p>{transaction.payment_method}</p>
                        {transaction.card_last_four && (
                          <p className="text-xs text-gray-500">
                            **** {transaction.card_last_four}
                          </p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={
                          transaction.transaction_status === 'completed' ? 'default' :
                          transaction.transaction_status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {transaction.transaction_status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <p>{new Date(transaction.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="book-rides">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bikes.map((bike) => (
                <Card key={bike.id} className="overflow-hidden">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={bike.image_url || defaultBikeImage}
                      alt={bike.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant={bike.available ? 'default' : 'secondary'}>
                        {bike.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg">{bike.name}</CardTitle>
                    <p className="text-sm text-gray-600">{bike.brand} - {bike.type}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-2xl font-bold text-green-600">
                        ₹{bike.price_per_day}/day
                      </p>
                      {bike.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {bike.description}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleBookBike(bike)}
                      disabled={!bike.available}
                      className="w-full"
                    >
                      {bike.available ? 'Book Now' : 'Unavailable'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedBike(null);
        }}
        bike={selectedBike}
      />
    </div>
  );
};

export default Admin;
