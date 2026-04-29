export interface CabanaView {
  id: string;
  x: number;
  y: number;
  available: boolean;
}

export interface MapResponse {
  width: number;
  height: number;
  tiles: string[][];
  cabanas: CabanaView[];
}

export interface BookingSuccess {
  success: true;
  cabanaId: string;
}

export interface BookingFailure {
  success: false;
  error: string;
  status: number;
}

export type BookingResponse = BookingSuccess | BookingFailure;

export async function fetchMap(): Promise<MapResponse> {
  const res = await fetch("/api/map");
  if (!res.ok) {
    throw new Error(`Failed to load map: ${res.status}`);
  }
  return (await res.json()) as MapResponse;
}

export async function postBooking(input: {
  cabanaId: string;
  roomNumber: string;
  guestName: string;
}): Promise<BookingResponse> {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { success: boolean; error?: string; cabanaId?: string };
  if (data.success && data.cabanaId) {
    return { success: true, cabanaId: data.cabanaId };
  }
  return {
    success: false,
    error: data.error ?? "Unknown error",
    status: res.status,
  };
}
