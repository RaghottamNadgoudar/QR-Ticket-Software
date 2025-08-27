'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Event, useEventStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { EventCart } from '@/components/EventCart';
import { createBooking, generatePDF } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function StudentEvents() {
  const [clubs, setClubs] = useState<string[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedEvents, addEvent, hasEventInSlot, hasEventFromClub, canAddEvent } = useEventStore();

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

    fetchEvents();
  }, []);

  const filteredEvents = selectedClub
    ? events.filter(event => event.clubName === selectedClub)
    : events;

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <div className="mb-6">
          <label htmlFor="club" className="block text-sm font-medium text-gray-700">
            Filter by Club
          </label>
          <select
            id="club"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
          >
            <option key="all" value="">All Clubs</option>
            {clubs.map((club, index) => (
              <option key={`club-${index}`} value={club}>
                {club}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((event) => {
            const isSelected = selectedEvents.some(e => e.id === event.id);
            const isEventFull = event.currentBookings >= event.maxLimit;
            const hasSlotConflict = hasEventInSlot(event.eventSlot) && !isSelected;
            const hasClubConflict = hasEventFromClub(event.clubName) && !isSelected;
            const cannotAdd = !canAddEvent(event) && !isSelected;
            
            const isDisabled = isEventFull || hasSlotConflict || hasClubConflict || cannotAdd;
            
            let disabledReason = '';
            if (isEventFull) {
              disabledReason = 'Event Full';
            } else if (hasSlotConflict) {
              disabledReason = 'Slot Conflict';
            } else if (hasClubConflict) {
              disabledReason = 'Club Limit Reached';
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
                    // Remove event logic is handled in the cart
                  } else {
                    addEvent(event);
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <EventCart onBookEvents={handleBookEvents} />
        </div>
      </div>
    </div>
  );
}