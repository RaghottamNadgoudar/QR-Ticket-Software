import React from 'react';
import { Event } from '@/lib/store';
import clsx from 'clsx';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  selected = false,
  disabled = false,
}) => {
  const availableSeats = event.maxLimit - event.currentBookings;

  return (
    <div
      className={clsx(
        'p-4 rounded-lg shadow-md transition-all duration-200',
        {
          'bg-white hover:shadow-lg cursor-pointer': !disabled && !selected,
          'bg-gray-100 cursor-not-allowed': disabled,
          'ring-2 ring-blue-500 bg-blue-50': selected,
        }
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
      <p className="text-sm text-gray-600 mt-1">Venue: {event.venue}</p>
      <p className="text-sm text-gray-600">Club: {event.clubName}</p>
      <p className="text-sm text-gray-600">Slot: {event.eventSlot}</p>
      
      {event.description && (
        <p className="text-sm text-gray-600 mt-2">{event.description}</p>
      )}
      
      <div className="mt-3 flex justify-between items-center">
        <span
          className={clsx(
            'px-2 py-1 rounded text-sm',
            availableSeats > 10
              ? 'bg-green-100 text-green-800'
              : availableSeats > 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {availableSeats === 0 ? 'No seats available' : 
           availableSeats === 1 ? 'Last seat available' : 
           `${availableSeats} seats left`}
        </span>
        
        {disabled && event.currentBookings >= event.maxLimit && (
          <span className="text-red-600 text-sm font-medium">
            Full
          </span>
        )}
        
        {selected && (
          <span className="text-blue-600 text-sm font-medium">
            Selected
          </span>
        )}
      </div>
    </div>
  );
};
