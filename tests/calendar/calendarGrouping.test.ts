import { describe, expect, it } from 'vitest';
import { getDayIndicator, groupCalendarEventsByDate, MAX_DAY_INDICATOR_DOTS } from '../../src/features/calendar/calendarGrouping';
import type { CalendarEvent } from '../../src/features/calendar/types';

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: overrides.id ?? 'e1',
    category: 'family',
    sourceId: 's1',
    date: '2026-06-15',
    color: 'gray',
    route: '/family/s1',
    rawTitle: 'Event',
    ...overrides,
  };
}

describe('groupCalendarEventsByDate', () => {
  it('buckets events by their own date field', () => {
    const events = [event({ id: 'a', date: '2026-06-01' }), event({ id: 'b', date: '2026-06-01' }), event({ id: 'c', date: '2026-06-02' })];
    const grouped = groupCalendarEventsByDate(events);
    expect(grouped.get('2026-06-01')?.map((e) => e.id)).toEqual(['a', 'b']);
    expect(grouped.get('2026-06-02')?.map((e) => e.id)).toEqual(['c']);
    expect(grouped.has('2026-06-03')).toBe(false);
  });

  it('returns an empty map for an empty event list', () => {
    expect(groupCalendarEventsByDate([]).size).toBe(0);
  });
});

describe('getDayIndicator', () => {
  it('several non-Task events sharing the one gray color collapse into a single dot', () => {
    const events = [
      event({ id: 'a', color: 'gray', category: 'family' }),
      event({ id: 'b', color: 'gray', category: 'vehicles' }),
      event({ id: 'c', color: 'gray', category: 'contracts' }),
    ];
    const indicator = getDayIndicator(events);
    expect(indicator.colors).toEqual(['gray']);
    expect(indicator.overflowCount).toBe(0);
  });

  it('one Task event + one non-Task event produce two distinct dots', () => {
    const events = [event({ id: 'a', color: 'gray', category: 'family' }), event({ id: 'b', color: '#5B8DEF', category: 'tasks' })];
    const indicator = getDayIndicator(events);
    expect(indicator.colors).toEqual(['gray', '#5B8DEF']);
  });

  it('two distinct Task Group colors on the same day each get their own dot', () => {
    const events = [
      event({ id: 'a', color: '#5B8DEF', category: 'tasks' }),
      event({ id: 'b', color: '#E0645A', category: 'tasks' }),
    ];
    const indicator = getDayIndicator(events);
    expect(indicator.colors).toEqual(['#5B8DEF', '#E0645A']);
    expect(indicator.overflowCount).toBe(0);
  });

  it('caps visible dots at the max and reports the rest as overflow', () => {
    const colors = ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666'];
    const events = colors.map((color, i) => event({ id: `e${i}`, color, category: 'tasks' }));
    const indicator = getDayIndicator(events);
    expect(indicator.colors).toHaveLength(MAX_DAY_INDICATOR_DOTS);
    expect(indicator.colors).toEqual(colors.slice(0, MAX_DAY_INDICATOR_DOTS));
    expect(indicator.overflowCount).toBe(colors.length - MAX_DAY_INDICATOR_DOTS);
  });

  it('an empty day has no dots and no overflow', () => {
    const indicator = getDayIndicator([]);
    expect(indicator.colors).toEqual([]);
    expect(indicator.overflowCount).toBe(0);
  });
});
