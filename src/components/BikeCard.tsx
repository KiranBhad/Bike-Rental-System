
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/integrations/supabase/types';

type Bike = Tables<'bikes'>;

interface BikeCardProps {
  bike: Bike;
  onBookNow: (bike: Bike) => void;
}

const BikeCard = ({ bike, onBookNow }: BikeCardProps) => {
  // Default to motorcycle images instead of bicycles
  const defaultImage = 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=800&q=80';
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={bike.image_url || defaultImage}
          alt={bike.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge variant={bike.available ? 'default' : 'destructive'}>
            {bike.available ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{bike.name}</CardTitle>
          <span className="text-lg font-bold text-green-600">
            ₹{bike.price_per_day}/day
          </span>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{bike.brand}</Badge>
          <Badge variant="outline">{bike.type}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-600 text-sm mb-4">{bike.description}</p>
        <Button 
          onClick={() => onBookNow(bike)}
          disabled={!bike.available}
          className="w-full"
        >
          {bike.available ? 'Book Now' : 'Unavailable'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BikeCard;
