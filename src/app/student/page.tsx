'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Event, useEventStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { EventCart } from '@/components/EventCart';
import { createBooking, generatePDF, getStudentBookings } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function StudentEvents() {
  const [clubs, setClubs] = useState<string[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [existingBookingsCount, setExistingBookingsCount] = useState(0);
  const { selectedEvents, addEvent, removeEvent, hasEventInSlot, hasEventFromClub, canAddEvent } = useEventStore();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const querySnapshot = await getDocs(eventsRef);
        
        // Validate and transform the data
        const fetchedEvents = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure all required fields are present and of correct type
          if (!data.name || typeof data.name !== 'string' ||
              !data.venue || typeof data.venue !== 'string' ||
              !data.clubName || typeof data.clubName !== 'string' ||
              !data.eventSlot || typeof data.eventSlot !== 'number' ||
              !data.maxLimit || typeof data.maxLimit !== 'number') {
            console.error(`Invalid event data for document ${doc.id}:`, data);
            return null;
          }
          const event: Event = {
            id: doc.id,
            name: data.name,
            venue: data.venue,
            clubName: data.clubName,
            eventSlot: data.eventSlot as 1 | 2 | 3 | 4,
            maxLimit: data.maxLimit,
            description: data.description || undefined,
            currentBookings: data.currentBookings || 0
          };
          return event;
        }).filter((event): event is Event => event !== null);
        
        setEvents(fetchedEvents);
        const uniqueClubs = Array.from(new Set(
          fetchedEvents
            .map(event => event.clubName)
            .filter(Boolean) // Remove any undefined or null values
        ));
        setClubs(uniqueClubs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
        setLoading(false);
      }
    };

    const fetchInitialData = async () => {
      await fetchEvents();
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          const bookings = await getStudentBookings(userId);
          setExistingBookingsCount(bookings.length);
        } catch (error) {
          console.error('Error fetching existing bookings:', error);
          toast.error('Could not verify your existing bookings.');
        }
      }
    };

    fetchInitialData();
  }, [auth.currentUser]);

  const filteredEvents = selectedClub
    ? events.filter(event => event.clubName === selectedClub)
    : events;

  const maxEvents = Number(process.env.NEXT_PUBLIC_MAX_EVENTS_PER_DAY || 4);
  const hasReachedBookingLimit = existingBookingsCount >= maxEvents;

  const handleBookEvents = async () => {
    try {
      const currentHour = new Date().getHours();
      const restrictedTimeStart = parseInt(process.env.NEXT_PUBLIC_RESTRICTED_TIME_START || '9');
      const restrictedTimeEnd = parseInt(process.env.NEXT_PUBLIC_RESTRICTED_TIME_END || '10');
      const maxEventsRestricted = parseInt(process.env.NEXT_PUBLIC_MAX_EVENTS_DURING_RESTRICTION || '1');

      // Check time restrictions
      if (currentHour >= restrictedTimeStart && currentHour < restrictedTimeEnd) {
        const restrictedEvents = selectedEvents.filter(
          event => event.eventSlot >= 1 && event.eventSlot <= maxEventsRestricted
        );

        if (restrictedEvents.length > maxEventsRestricted) {
          toast.error(`Only ${maxEventsRestricted} event(s) can be booked between ${restrictedTimeStart}:00 and ${restrictedTimeEnd}:00`);
          return;
        }
      }

      // Get user ID from auth context
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast.error('Please sign in to book events');
        return;
      }
      
      const bookings = await createBooking(userId, selectedEvents);
      const pdfBlob = await generatePDF(bookings);
      
      // Create a download link for the PDF
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'event-qrcodes.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Events booked successfully!');
    } catch (error) {
      console.error('Error booking events:', error);
      toast.error('Failed to book events');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          <p className="text-gray-600 font-orbitron">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-orbitron">Event Selection</h1>
              <p className="mt-1 text-sm text-gray-600">Choose events for the showcase day</p>
            </div>
            
            {/* Filter Section */}
            <div className="w-full sm:w-auto sm:min-w-[240px]">
              <label htmlFor="club" className="block text-sm font-medium text-gray-700 font-orbitron mb-2">
                Filter by Club
              </label>
              <div className="relative">
                <select
                  id="club"
                  className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-900 shadow-sm transition-colors focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 font-medium cursor-pointer"
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                >
                  <option value="">All Clubs</option>
                  {clubs.map((club, index) => (
                    <option key={`club-${index}`} value={club}>
                      {club}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3" id="events-section">
            {hasReachedBookingLimit ? (
              <div className="text-center py-12 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="mt-4 text-lg font-medium text-yellow-800 font-orbitron">Booking Limit Reached</h3>
                <p className="mt-1 text-sm text-yellow-600">You have already booked the maximum number of events allowed.</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 font-orbitron">No events found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filter or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEvents.map((event) => {
            const isSelected = selectedEvents.some(e => e.id === event.id);
            const isEventFull = event.currentBookings >= event.maxLimit;
            const hasSlotConflict = hasEventInSlot(event.eventSlot) && !isSelected;
            const hasClubConflict = hasEventFromClub(event.clubName) && !isSelected;
            const cannotAdd = (!canAddEvent(event) && !isSelected) || hasReachedBookingLimit;
            
            const isDisabled = isEventFull || hasSlotConflict || hasClubConflict || cannotAdd;
            
            let disabledReason = '';
            if (isEventFull) {
              disabledReason = 'Event Full';
            } else if (hasSlotConflict) {
              disabledReason = 'Slot Conflict';
            } else if (hasClubConflict) {
              disabledReason = 'Club Limit Reached';
            } else if (hasReachedBookingLimit) {
              disabledReason = 'Booking Limit Reached';
            } else if (cannotAdd) {
              disabledReason = 'Daily Limit Reached';
            }

            return (
              <EventCard
                key={event.id}
                event={event}
                selected={isSelected}
                disabled={isDisabled}
                disabledReason={disabledReason}
                onClick={() => {
                  if (isSelected) {
                    removeEvent(event.id);
                  } else {
                    addEvent(event);
                  }
                }}
              />
            );
          })}
        </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6" id="cart-section">
              <EventCart onBookEvents={handleBookEvents} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 lg:hidden">
        <button
          onClick={() => {
            document.getElementById('events-section')?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          style={{ backgroundColor: '#ED5E4A' }}
          title="View Events"
        >
          <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          onClick={() => {
            document.getElementById('cart-section')?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center relative group"
          style={{ backgroundColor: '#ED5E4A' }}
          title="View Cart"
        >
          <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6 0a1 1 0 100-2 1 1 0 000 2zm0 0h2a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          {selectedEvents.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {selectedEvents.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}