import { create } from 'zustand';

export interface Event {
  id: string;
  name: string;
  venue: string;
  clubName: string;
  eventSlot: 1 | 2 | 3 | 4;
  maxLimit: number;
  description?: string;
  currentBookings: number;
}

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  qrCode: string;
  attended: boolean;
  timestamp: Date;
}

interface EventStore {
  selectedEvents: Event[];
  addEvent: (event: Event) => void;
  removeEvent: (eventId: string) => void;
  clearEvents: () => void;
  hasEventInSlot: (slot: number) => boolean;
  canAddEvent: (event: Event) => boolean;
}

export const useEventStore = create<EventStore>((set, get) => ({
  selectedEvents: [],
  addEvent: (event) => {
    if (get().canAddEvent(event)) {
      set((state) => ({
        selectedEvents: [...state.selectedEvents, event],
      }));
    }
  },
  removeEvent: (eventId) =>
    set((state) => ({
      selectedEvents: state.selectedEvents.filter((e) => e.id !== eventId),
    })),
  clearEvents: () => set({ selectedEvents: [] }),
  hasEventInSlot: (slot) =>
    get().selectedEvents.some((event) => event.eventSlot === slot),
  canAddEvent: (event) => {
    const state = get();
    return (
      !state.hasEventInSlot(event.eventSlot) &&
      state.selectedEvents.length < Number(process.env.NEXT_PUBLIC_MAX_EVENTS_PER_DAY || 4)
    );
  },
}));
