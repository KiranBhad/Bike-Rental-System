
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tables } from '@/integrations/supabase/types';
import { differenceInDays, addDays, isBefore, startOfDay } from 'date-fns';
import PaymentModal from './PaymentModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type Bike = Tables<'bikes'>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bike: Bike | null;
}

const BookingModal = ({ isOpen, onClose, bike }: BookingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [showPayment, setShowPayment] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateTotalPrice = () => {
    if (!startDate || !endDate || !bike) return 0;
    const days = differenceInDays(endDate, startDate) + 1;
    return days * Number(bike.price_per_day);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    return differenceInDays(endDate, startDate) + 1;
  };

  const handleDateSelect = (date: Date | undefined, type: 'start' | 'end') => {
    if (!date) return;

    if (type === 'start') {
      setStartDate(date);
      if (endDate && isBefore(endDate, date)) {
        setEndDate(undefined);
      }
    } else {
      if (!startDate || !isBefore(date, startDate)) {
        setEndDate(date);
      }
    }
  };

  const createBooking = async () => {
    if (!user || !bike || !startDate || !endDate) return;

    setLoading(true);
    try {
      const totalDays = calculateDays();
      const totalPrice = calculateTotalPrice();

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          bike_id: bike.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          total_days: totalDays,
          total_price: totalPrice,
          payment_status: 'pending',
          booking_status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setBookingData({
        id: data.id,
        bikeName: bike.name,
        totalPrice,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalDays
      });

      setShowPayment(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    onClose();
    toast({
      title: "Booking Confirmed!",
      description: "Your bike rental has been successfully booked.",
    });
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  if (!bike) return null;

  return (
    <>
      <Dialog open={isOpen && !showPayment} onOpenChange={onClose} >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Book {bike.name}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={bike.image_url || '/placeholder.svg'}
                alt={bike.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="mt-4">
                <h3 className="text-xl font-semibold">{bike.name}</h3>
                <p className="text-gray-600">{bike.brand} - {bike.type}</p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  ₹{bike.price_per_day}/day
                </p>
                <p className="text-gray-600 mt-2">{bike.description}</p>
              </div>
            </div>
            
            <div className="space-y-6 flex flex-colss-1 md:flex-cols-2 overflow-x-auto">
              <div>
                <h4 className="font-semibold mb-2">Select Start Date</h4>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => handleDateSelect(date, 'start')}
                  disabled={isDateDisabled}
                  className="rounded-md border"
                />
              </div>
              
              {startDate && (
                <div>
                  <h4 className="font-semibold mb-2">Select End Date</h4>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => handleDateSelect(date, 'end')}
                    disabled={(date) => 
                      isDateDisabled(date) || (startDate && isBefore(date, startDate))
                    }
                    className="rounded-md border"
                  />
                </div>
              )}
              
              
            </div>
            {startDate && endDate && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Booking Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p>Duration: {calculateDays()} day(s)</p>
                    <p>Daily rate: ₹{bike.price_per_day}</p>
                    <p className="text-lg font-bold">
                      Total: ₹{calculateTotalPrice()}
                    </p>
                  </div>
                  <Button
                    onClick={createBooking}
                    disabled={loading}
                    className="w-full mt-4"
                  >
                    {loading ? 'Creating Booking...' : 'Proceed to Payment'}
                  </Button>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {showPayment && bookingData && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          booking={bookingData}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </>
  );
};

export default BookingModal;
