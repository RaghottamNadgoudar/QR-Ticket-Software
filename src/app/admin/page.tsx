'use client';

import { useState } from 'react';
import { createEvent } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [formData, setFormData] = useState({
    name: '',
    venue: '',
    clubName: '',
    eventSlot: '1',
    maxLimit: '70', // Default max limit per event
    description: '',
  });
  const [debug, setDebug] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createEvent({
        ...formData,
        eventSlot: parseInt(formData.eventSlot) as 1 | 2 | 3 | 4,
        maxLimit: parseInt(formData.maxLimit),
      });
      
      toast.success('Event created successfully!');
  setDebug('Event created successfully');
      
      // Reset form
      setFormData({
        name: '',
        venue: '',
        clubName: '',
        eventSlot: '1',
        maxLimit: process.env.NEXT_PUBLIC_MAX_EVENTS_PER_DAY || '70',
        description: '',
      });
    } catch (error) {
  console.error('Error creating event (admin UI):', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e: any = error;
  setDebug(`${e.code ?? e.name}: ${e.message ?? String(e)}`);
  toast.error('Failed to create event');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-orbitron">Event Management</h1>
              <p className="mt-1 text-sm text-gray-600">Create and manage events for the showcase day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 font-orbitron">Create New Event</h2>
              <p className="mt-1 text-sm text-gray-600">Fill in the details to create a new event</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 font-orbitron mb-2">
                    Event Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                    placeholder="Enter event name"
                  />
                </div>

                <div>
                  <label htmlFor="venue" className="block text-sm font-medium text-gray-700 font-orbitron mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    name="venue"
                    id="venue"
                    required
                    value={formData.venue}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                    placeholder="Enter venue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="clubName" className="block text-sm font-medium text-gray-700 font-orbitron mb-2">
                    Club Name
                  </label>
                  <input
                    type="text"
                    name="clubName"
                    id="clubName"
                    required
                    value={formData.clubName}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                    placeholder="Enter club name"
                  />
                </div>

                <div>
                  <label htmlFor="eventSlot" className="block text-sm font-medium text-gray-700 font-orbitron mb-2">
                    Event Slot
                  </label>
                  <div className="relative">
                    <select
                      name="eventSlot"
                      id="eventSlot"
                      required
                      value={formData.eventSlot}
                      onChange={handleChange}
                      className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 cursor-pointer"
                    >
                      <option value="1">Slot 1</option>
                      <option value="2">Slot 2</option>
                      <option value="3">Slot 3</option>
                      <option value="4">Slot 4</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="maxLimit" className="block text-sm font-medium text-gray-700 font-orbitron mb-2">
                  Maximum Limit
                </label>
                <input
                  type="number"
                  name="maxLimit"
                  id="maxLimit"
                  required
                  min="1"
                  value={formData.maxLimit}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                  placeholder="Enter maximum participants"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 font-orbitron mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 resize-none"
                  placeholder="Enter event description (optional)"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors font-orbitron"
                  style={{ backgroundColor: '#ED5E4A', borderColor: '#ED5E4A' }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Event
                </button>
              </div>
            </form>
          </div>

          {debug && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Debug Information</h3>
                  <p className="mt-1 text-sm text-red-700">{debug}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
