import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TaskGroupDetailPage } from '../../src/pages/TaskGroupDetailPage';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import { setSetting } from '../../src/storage/db';
import { LanguageProvider } from '../../src/localization/LanguageContext';

const NOW = '2026-01-01T00:00:00.000Z';

function renderGroupPage(groupId: string) {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[`/tasks/group/${groupId}`]}>
        <Routes>
          <Route path="/tasks/group/:groupId" element={<TaskGroupDetailPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

const VERY_LONG_NAME =
  'Extremely Long Task Group Name That Should Wrap Across Several Lines Without Ever Pushing The Edit Button Off Screen Or Shrinking Its Own Font Size';

/**
 * Permanent regression suite -- final Task Group header layout correction
 * (post-physical-iPhone-testing). Verifies the required two-row
 * structure: Row 1 is title + a small, always-visible Edit action (title
 * wraps, never shrinks, never pushes Edit away); Row 2 is Archive Group
 * alone on its own row, never competing with the title for space.
 */
describe('Task Group header: title + inline Edit (Row 1), Archive Group separate (Row 2)', () => {
  it('one-character title: Edit remains visible beside the title', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'A', createdAt: NOW, updatedAt: NOW });

    const { container } = renderGroupPage('g1');

    await screen.findByText('A');
    const editButton = screen.getByRole('button', { name: 'Edit' });
    expect(editButton).toBeInTheDocument();
    const titleRow = container.querySelector('.task-group-detail-page__title-row');
    expect(titleRow?.contains(editButton)).toBe(true);
  });

  it('normal title: Edit remains visible beside the title', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });

    renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('very long title: Edit remains visible beside the title, never pushed off/hidden', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: VERY_LONG_NAME, createdAt: NOW, updatedAt: NOW });

    renderGroupPage('g1');

    await screen.findByText(VERY_LONG_NAME);
    const editButton = screen.getByRole('button', { name: 'Edit' });
    expect(editButton).toBeInTheDocument();
    expect(editButton).toBeVisible();
  });

  it('the title element itself carries no dynamic font-shrink class/style -- only wrapping handles overflow', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: VERY_LONG_NAME, createdAt: NOW, updatedAt: NOW });

    const { container } = renderGroupPage('g1');

    await screen.findByText(VERY_LONG_NAME);
    const titleEl = container.querySelector('.task-group-detail-page__title');
    expect(titleEl).not.toBeNull();
    // No inline font-size override of any kind -- sizing comes only from
    // the stylesheet's fixed --font-size-xl token, never per-instance JS.
    expect((titleEl as HTMLElement).style.fontSize).toBe('');
  });

  it('Archive Group renders on its own separate row, never inside the title row', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });

    const { container } = renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    const archiveButton = screen.getByRole('button', { name: 'Archive Group' });
    const titleRow = container.querySelector('.task-group-detail-page__title-row');
    const archiveRow = container.querySelector('.task-group-detail-page__archive-row');
    expect(titleRow?.contains(archiveButton)).toBe(false);
    expect(archiveRow?.contains(archiveButton)).toBe(true);
  });

  it('Row 1 and Row 2 are distinct sibling containers within the header', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });

    const { container } = renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    const header = container.querySelector('.task-group-detail-page__header');
    const titleRow = header?.querySelector(':scope > .task-group-detail-page__title-row');
    const archiveRow = header?.querySelector(':scope > .task-group-detail-page__archive-row');
    expect(titleRow).not.toBeNull();
    expect(archiveRow).not.toBeNull();
    expect(titleRow).not.toBe(archiveRow);
  });

  it('RTL: both the title/Edit row and the Archive Group row render correctly in Arabic', async () => {
    await setSetting('locale', 'ar');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'تذكيرات المركبة', createdAt: NOW, updatedAt: NOW });

    renderGroupPage('g1');

    await screen.findByText('تذكيرات المركبة');
    expect(screen.getByRole('button', { name: 'تعديل' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'أرشفة المجموعة' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('LTR: both the title/Edit row and the Archive Group row render correctly in English', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });

    renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive Group' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('Edit still opens the Task Group edit form (behavior unchanged)', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });

    renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    screen.getByRole('button', { name: 'Edit' }).click();
    expect(await screen.findByText('Edit Group')).toBeInTheDocument();
  });
});
