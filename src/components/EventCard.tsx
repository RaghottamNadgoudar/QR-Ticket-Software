import React from 'react';
import { Event } from '@/lib/store';
import clsx from 'clsx';
import CountUp from './CountUp';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  selected = false,
  disabled = false,
  disabledReason,
}) => {
  const availableSeats = event.maxLimit - event.currentBookings;

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl border transition-all duration-200 p-6',
        {
          'bg-white border-gray-200 hover:shadow-lg hover:border-gray-300 cursor-pointer': !disabled && !selected,
          'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60': disabled,
          'bg-orange-50 border-orange-300 ring-2 ring-orange-500 ring-opacity-50 cursor-pointer hover:bg-brand-primary/20': selected,
        }
      )}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Event Name */}
      <h3 className="text-xl font-bold text-gray-900 font-orbitron mb-3">{event.name}</h3>
      
      {/* Event Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">{event.venue}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-medium">{event.clubName}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Slot {event.eventSlot}</span>
        </div>
      </div>
      
      {event.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
      )}
      
      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <span
          className={clsx(
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium gap-1',
            availableSeats > 10
              ? 'bg-green-100 text-green-700'
              : availableSeats > 0
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          )}
        >
          <CountUp
            from={0}
            to={availableSeats} 
            direction="up"
            duration={1}
            className="count-up-text font-orbitron font-black"
          />
          <span className="font-orbitron font-black">seats left</span>
        </span>
        
        <div className="flex items-center justify-end space-x-2">
          {selected && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
              ✓ Selected
            </span>
          )}
          
          {disabled && disabledReason && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              {disabledReason}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
