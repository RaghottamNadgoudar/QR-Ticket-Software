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
    <div className={`bg-white rounded-xl border shadow-sm p-6 transition-all duration-300 ${
      hasAllSlots ? 'border-orange-300 shadow-orange-100' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 font-orbitron">Selected Events</h2>
        {selectedEvents.length > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            {selectedEvents.length}/4
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {selectedEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate font-orbitron">{event.name}</p>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Slot {event.eventSlot}
                <span className="mx-2">•</span>
                <span>{event.clubName}</span>
              </div>
            </div>
            <button
              onClick={() => removeEvent(event.id)}
              className="ml-3 p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
              title="Remove event"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ))}

        {selectedEvents.length === 0 && (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 font-orbitron">No events selected yet</p>
            <p className="text-sm text-gray-400 mt-1">Choose events to get started</p>
          </div>
        )}
      </div>

      {selectedEvents.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">{selectedEvents.length}/4 slots</span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(selectedEvents.length / 4) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 font-orbitron">
            {hasAllSlots
              ? "✅ All slots filled! Ready to book your events."
              : `⏳ Select ${4 - selectedEvents.length} more event${4 - selectedEvents.length !== 1 ? 's' : ''} to complete your selection.`}
          </p>
          
          <button
            onClick={onBookEvents}
            disabled={!hasAllSlots}
            className="w-full py-3 px-4 bg-orange-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-orange-700 transition-all duration-200 font-orbitron shadow-sm"
          >
            {hasAllSlots ? '🎫 Book All Events' : 'Complete Selection First'}
          </button>
        </div>
      )}
    </div>
  );
};
