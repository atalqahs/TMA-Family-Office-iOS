import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TaskGroupDetailPage } from '../../src/pages/TaskGroupDetailPage';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import * as taskService from '../../src/features/tasks/taskService';
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

const VERY_LONG_ARABIC_NAME =
  'اسم مجموعة مهام طويل جدا يجب أن يلتف عبر عدة أسطر دون أن يزعج تخطيط الصفحة أو يدفع أي إجراء خارج الشاشة أبدا';

/**
 * Permanent regression suite -- final Task Group UI correction
 * (post-physical-iPhone-testing, round 2). Required layout:
 *
 *   HEADER: title + a small inline Edit action ONLY. Archive Group must
 *   never appear here. The title gets the full header width, may wrap
 *   naturally, and never shrinks its font.
 *
 *   BOTTOM GROUP ACTIONS: Archive Group, then Delete Group -- separate
 *   from normal task actions like "Add Task", in that DOM order.
 */
describe('Task Group header: title + inline Edit only, Archive Group moved to bottom', () => {
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

  it('the title has its own clean header space: the header contains only the title row', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });

    const { container } = renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    const header = container.querySelector('.task-group-detail-page__header');
    expect(header).not.toBeNull();
    expect(header?.children).toHaveLength(1);
    expect(header?.querySelector('.task-group-detail-page__title-row')).not.toBeNull();
  });

  it('Archive Group does not exist anywhere inside the header', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });

    const { container } = renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    const header = container.querySelector('.task-group-detail-page__header');
    expect(header).not.toBeNull();
    expect(within(header as HTMLElement).queryByRole('button', { name: 'Archive Group' })).not.toBeInTheDocument();
  });

  it('Archive Group and Delete Group both render in the bottom group-actions area, Archive before Delete', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });

    const { container } = renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    const groupActions = container.querySelector('.task-group-detail-page__group-actions');
    expect(groupActions).not.toBeNull();

    const buttons = within(groupActions as HTMLElement).getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Archive Group');
    expect(buttons[1]).toHaveTextContent('Delete Group');

    // Archive Group must appear strictly before Delete Group in DOM order.
    const position = buttons[0].compareDocumentPosition(buttons[1]);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('long Arabic group names do not disturb the header or bottom-actions layout (RTL)', async () => {
    await setSetting('locale', 'ar');
    await taskRepository.saveTaskGroup({ id: 'g1', name: VERY_LONG_ARABIC_NAME, createdAt: NOW, updatedAt: NOW });

    const { container } = renderGroupPage('g1');

    await screen.findByText(VERY_LONG_ARABIC_NAME);
    const editButton = screen.getByRole('button', { name: 'تعديل' });
    expect(editButton).toBeVisible();

    const header = container.querySelector('.task-group-detail-page__header');
    expect(within(header as HTMLElement).queryByRole('button', { name: 'أرشفة المجموعة' })).not.toBeInTheDocument();

    const groupActions = container.querySelector('.task-group-detail-page__group-actions');
    const buttons = within(groupActions as HTMLElement).getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('أرشفة المجموعة');
    expect(buttons[1]).toHaveTextContent('حذف المجموعة');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('RTL: header (title + Edit) and bottom actions both render correctly in Arabic', async () => {
    await setSetting('locale', 'ar');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'تذكيرات المركبة', createdAt: NOW, updatedAt: NOW });

    renderGroupPage('g1');

    await screen.findByText('تذكيرات المركبة');
    expect(screen.getByRole('button', { name: 'تعديل' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'أرشفة المجموعة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'حذف المجموعة' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('LTR: header (title + Edit) and bottom actions both render correctly in English', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });

    renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive Group' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Group' })).toBeInTheDocument();
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

  it('Archive Group in the bottom actions still opens its existing confirm sheet and calls taskService.archiveTaskGroup unchanged', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });
    const archiveSpy = vi.spyOn(taskService, 'archiveTaskGroup');

    renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    screen.getByRole('button', { name: 'Archive Group' }).click();
    const confirmButton = await screen.findByRole('button', { name: 'Archive' });
    confirmButton.click();

    await waitFor(() => expect(archiveSpy).toHaveBeenCalledWith('g1'));
    archiveSpy.mockRestore();
  });

  it('Delete Group in the bottom actions still opens its existing confirm sheet and calls taskService.removeTaskGroup unchanged', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });
    const removeSpy = vi.spyOn(taskService, 'removeTaskGroup');

    renderGroupPage('g1');

    await screen.findByText('Vehicle Reminders');
    screen.getByRole('button', { name: 'Delete Group' }).click();
    const confirmButton = await screen.findByRole('button', { name: 'Delete' });
    confirmButton.click();

    await waitFor(() => expect(removeSpy).toHaveBeenCalledWith('g1'));
    removeSpy.mockRestore();
  });
});
