'use client';

import React from 'react';
import { Event, useEventStore } from '@/lib/store';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EventCartProps {
  onBookEvents?: () => void;
}

export const EventCart: React.FC<EventCartProps> = ({ onBookEvents }) => {
  const { selectedEvents, removeEvent } = useEventStore();

  const hasAllSlots = [1, 2, 3, 4].every((slot) =>
    selectedEvents.some((event) => event.eventSlot === slot)
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Selected Events</h2>
      
      <div className="space-y-4">
        {selectedEvents.map((event) => (
          <div
            key={event.id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded"
          >
            <div>
              <p className="font-medium">{event.name}</p>
              <p className="text-sm text-gray-600">Slot {event.eventSlot}</p>
            </div>
            <button
              onClick={() => removeEvent(event.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ))}

        {selectedEvents.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            No events selected yet
          </p>
        )}
      </div>

      {selectedEvents.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">
            {hasAllSlots
              ? "You're all set! Click below to book your events."
              : "Please select one event from each slot (1-4)"}
          </p>
          <button
            onClick={onBookEvents}
            disabled={!hasAllSlots}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Book Events
          </button>
        </div>
      )}
    </div>
  );
};
