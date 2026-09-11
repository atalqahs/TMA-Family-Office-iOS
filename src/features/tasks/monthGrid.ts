import { addLocalMonths } from '../../utils/localDate';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export interface MonthGridCell {
  date: string;
  inCurrentMonth: boolean;
}

/**
 * A 6-row x 7-col (42-cell) month grid for `yearMonth` ('YYYY-MM'),
 * starting the week on Sunday, filled in from adjacent months at the
 * edges. Built entirely from local `Date(y, m, d)` construction and local
 * accessors -- never `toISOString()`/UTC -- so the grid always lines up
 * with the device's actual local calendar.
 */
export function buildMonthGrid(yearMonth: string): MonthGridCell[] {
  const [year, month] = yearMonth.split('-').map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  const gridStart = new Date(year, month - 1, 1 - firstOfMonth.getDay());

  const cells: MonthGridCell[] = [];
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      date: `${cellDate.getFullYear()}-${pad2(cellDate.getMonth() + 1)}-${pad2(cellDate.getDate())}`,
      inCurrentMonth: cellDate.getMonth() === month - 1,
    });
  }
  return cells;
}

/** The first and last local calendar day of `yearMonth`, as 'YYYY-MM-DD'. */
export function getMonthRange(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { start: `${yearMonth}-01`, end: `${yearMonth}-${pad2(lastDay)}` };
}

/** `yearMonth` shifted by whole months, reusing the same anchor-safe month arithmetic as recurrence (see localDate.ts) rather than re-deriving it. */
export function shiftYearMonth(yearMonth: string, months: number): string {
  return addLocalMonths(`${yearMonth}-01`, months).slice(0, 7);
}
