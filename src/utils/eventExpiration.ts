import { SquadBeacon } from '../types';

/**
 * Checks whether an event beacon has expired.
 * Evaluates:
 * 1. beacon.expiresAt (ISO string or timestamp or numeric date)
 * 2. beacon.eventData?.expiresAt
 * 3. beacon.createdAt + durationDays (fallback)
 * 4. beacon.eventData?.createdAt + durationDays (fallback)
 * 5. beacon.id timestamp (e.g. event-1728000000000) + durationDays (fallback)
 */
export function isEventExpired(beacon: SquadBeacon, now = Date.now()): boolean {
  const isEvent =
    beacon.beaconType === 'other_event' ||
    beacon.buildingType === 'grand_event';

  if (!isEvent) return false;

  // 1. Direct expiresAt on beacon or in eventData
  const rawExpiresAt = beacon.expiresAt || beacon.eventData?.expiresAt;
  if (rawExpiresAt) {
    const expTime = new Date(rawExpiresAt).getTime();
    if (!isNaN(expTime)) {
      return expTime <= now;
    }
  }

  // 2. CreatedAt + durationDays
  const rawCreatedAt = (beacon as Record<string, any>).createdAt || beacon.eventData?.createdAt;
  const durationDays = beacon.durationDays || beacon.eventData?.durationDays || 7;
  if (rawCreatedAt) {
    const createdTime = new Date(rawCreatedAt).getTime();
    if (!isNaN(createdTime)) {
      return createdTime + durationDays * 24 * 60 * 60 * 1000 <= now;
    }
  }

  // 3. Fallback from ID timestamp: event-1728000000000
  if (beacon.id && beacon.id.startsWith('event-')) {
    const tsStr = beacon.id.replace('event-', '');
    const ts = parseInt(tsStr, 10);
    if (!isNaN(ts) && ts > 1600000000000) {
      return ts + durationDays * 24 * 60 * 60 * 1000 <= now;
    }
  }

  return false;
}

/**
 * Filters out all expired events from an array of squad/event beacons.
 */
export function filterActiveEvents(squads: SquadBeacon[], now = Date.now()): SquadBeacon[] {
  return squads.filter((s) => !isEventExpired(s, now));
}
