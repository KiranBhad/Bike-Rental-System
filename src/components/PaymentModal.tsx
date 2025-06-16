
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    bikeName: string;
    totalPrice: number;
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  onPaymentComplete: () => void;
}

const PaymentModal = ({ isOpen, onClose, booking, onPaymentComplete }: PaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: user?.email || '',
    billingAddress: '',
    city: '',
    zipCode: ''
  });

  // Dummy card details for demo
  const dummyCards = [
    { number: '4242424242424242', brand: 'Visa', desc: 'Valid test card' },
    { number: '5555555555554444', brand: 'Mastercard', desc: 'Valid test card' },
    { number: '378282246310005', brand: 'American Express', desc: 'Valid test card' }
  ];

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cardNumber') {
      // Format card number with spaces
      value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (value.length > 19) return;
    }
    if (field === 'expiryDate') {
      // Format expiry date MM/YY
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      if (value.length > 5) return;
    }
    if (field === 'cvv' && value.length > 4) return;

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const useDummyCard = (card: typeof dummyCards[0]) => {
    setFormData(prev => ({
      ...prev,
      cardNumber: card.number.replace(/(.{4})/g, '$1 ').trim(),
      expiryDate: '12/26',
      cvv: '123',
      cardholderName: 'John Doe'
    }));
  };

  const validateStep1 = () => {
    return formData.cardNumber.replace(/\s/g, '').length >= 13 &&
           formData.expiryDate.length === 5 &&
           formData.cvv.length >= 3 &&
           formData.cardholderName.trim().length > 0;
  };

  const validateStep2 = () => {
    return formData.email.includes('@') &&
           formData.billingAddress.trim().length > 0 &&
           formData.city.trim().length > 0 &&
           formData.zipCode.trim().length > 0;
  };

  const processPayment = async () => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate transaction ID
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get card brand
      const cardNumber = formData.cardNumber.replace(/\s/g, '');
      let cardBrand = 'Unknown';
      if (cardNumber.startsWith('4')) cardBrand = 'Visa';
      else if (cardNumber.startsWith('5')) cardBrand = 'Mastercard';
      else if (cardNumber.startsWith('3')) cardBrand = 'American Express';
      
      // Create payment transaction record
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          booking_id: booking.id,
          user_id: user!.id,
          amount: booking.totalPrice,
          payment_method: 'Credit Card',
          card_last_four: cardNumber.slice(-4),
          card_brand: cardBrand,
          transaction_status: 'completed',
          transaction_id: transactionId
        });

      if (transactionError) throw transactionError;

      // Update booking payment status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ payment_status: 'paid' })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      setCurrentStep(4);
      toast({
        title: "Payment Successful!",
        description: `Payment of ₹${booking.totalPrice} has been processed successfully.`,
      });
      
      setTimeout(() => {
        onPaymentComplete();
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      email: user?.email || '',
      billingAddress: '',
      city: '',
      zipCode: ''
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Secure Payment - Step {currentStep} of 3
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`h-1 w-24 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2">Booking Summary</h3>
            <div className="text-sm space-y-1">
              <p><strong>Bike:</strong> {booking.bikeName}</p>
              <p><strong>Duration:</strong> {booking.totalDays} days</p>
              <p><strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
              <p className="text-lg font-semibold"><strong>Total: ₹{booking.totalPrice}</strong></p>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Card Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </h3>
            
            {/* Dummy Cards */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">Demo Cards (Click to use):</h4>
              <div className="space-y-2">
                {dummyCards.map((card, index) => (
                  <button
                    key={index}
                    onClick={() => useDummyCard(card)}
                    className="text-left w-full p-2 bg-white border rounded hover:bg-gray-50 text-sm"
                  >
                    <span className="font-mono">{card.number}</span> - {card.brand} ({card.desc})
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  placeholder="John Doe"
                  value={formData.cardholderName}
                  onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!validateStep1()}
              className="w-full"
            >
              Continue to Billing Details
            </Button>
          </div>
        )}

        {/* Step 2: Billing Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Billing Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="billingAddress">Billing Address</Label>
                <Input
                  id="billingAddress"
                  placeholder="123 Main Street"
                  value={formData.billingAddress}
                  onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="10001"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!validateStep2()}
                className="flex-1"
              >
                Review & Pay
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your Payment</h3>
            
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">
                    {formData.cardNumber.slice(0, 4)} **** **** {formData.cardNumber.slice(-4)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cardholder</p>
                  <p className="font-medium">{formData.cardholderName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Billing Address</p>
                  <p className="font-medium">{formData.billingAddress}, {formData.city} {formData.zipCode}</p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-lg font-semibold">Total: ₹{booking.totalPrice}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={processPayment}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : `Pay ₹${booking.totalPrice}`}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                ✓
              </div>
            </div>
            <h3 className="text-xl font-semibold text-green-600">Payment Successful!</h3>
            <p className="text-gray-600">
              Your booking has been confirmed and payment of ₹{booking.totalPrice} has been processed.
            </p>
            <p className="text-sm text-gray-500">
              You will be redirected automatically...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
