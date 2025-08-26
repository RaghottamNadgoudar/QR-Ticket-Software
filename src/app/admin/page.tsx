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
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Event Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
            Venue
          </label>
          <input
            type="text"
            name="venue"
            id="venue"
            required
            value={formData.venue}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="clubName" className="block text-sm font-medium text-gray-700">
            Club Name
          </label>
          <input
            type="text"
            name="clubName"
            id="clubName"
            required
            value={formData.clubName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="eventSlot" className="block text-sm font-medium text-gray-700">
            Event Slot
          </label>
          <select
            name="eventSlot"
            id="eventSlot"
            required
            value={formData.eventSlot}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="1">Slot 1</option>
            <option value="2">Slot 2</option>
            <option value="3">Slot 3</option>
            <option value="4">Slot 4</option>
          </select>
        </div>

        <div>
          <label htmlFor="maxLimit" className="block text-sm font-medium text-gray-700">
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            name="description"
            id="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Event
          </button>
        </div>
      </form>
      {debug && (
        <div className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          Debug: {debug}
        </div>
      )}
    </div>
  );
}
