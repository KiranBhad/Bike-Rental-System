
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BikeCard from '@/components/BikeCard';
import BookingModal from '@/components/BookingModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables } from '@/integrations/supabase/types';
import { Search, Filter } from 'lucide-react';

type Bike = Tables<'bikes'>;

const Home = () => {
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');

  const { data: bikes = [], isLoading } = useQuery({
    queryKey: ['bikes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredBikes = bikes.filter(bike => {
    const matchesSearch = bike.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bike.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bike.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || bike.type.toLowerCase() === filterType.toLowerCase();
    const matchesBrand = filterBrand === 'all' || bike.brand.toLowerCase() === filterBrand.toLowerCase();
    
    return matchesSearch && matchesType && matchesBrand;
  });

  const uniqueTypes = Array.from(new Set(bikes.map(bike => bike.type)));
  const uniqueBrands = Array.from(new Set(bikes.map(bike => bike.brand)));

  const handleBookNow = (bike: Bike) => {
    setSelectedBike(bike);
    setIsBookingModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bikes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Rent the Perfect Bike</h1>
          <p className="text-xl mb-8">Explore the city with our premium bike collection</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bikes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {uniqueBrands.map(brand => (
                  <SelectItem key={brand} value={brand.toLowerCase()}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bikes Grid */}
        {filteredBikes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No bikes found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBikes.map((bike) => (
              <BikeCard
                key={bike.id}
                bike={bike}
                onBookNow={handleBookNow}
              />
            ))}
          </div>
        )}
      </div>

      <BookingModal
        bike={selectedBike}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
};

export default Home;
