import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TaskGroupDetailPage } from '../../src/pages/TaskGroupDetailPage';
import { TaskCard } from '../../src/features/tasks/components/TaskCard';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import { setSetting } from '../../src/storage/db';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import type { Task } from '../../src/features/tasks/types';

const NOW = '2026-01-01T00:00:00.000Z';

function renderGroupPage(groupId: string) {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[`/tasks/group/${groupId}`]}>
        <Routes>
          <Route path="/tasks/group/:groupId" element={<TaskGroupDetailPage />} />
          <Route path="/tasks" element={<div>Tasks List Page</div>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

/**
 * Permanent Phase 10.2 regression suite -- Section "1. REMOVE COMPLETED
 * FROM THE TASKS UI", items #1-4: purely a UI presentation change --
 * TaskCompletion records/logic/recurrence are never touched (see
 * taskListOrdering.ts/taskStatus.ts, both untouched by this phase).
 */
describe('Completed is removed from the Task Group UI (presentation only)', () => {
  it('1. the "Completed" filter chip is not rendered in the filter bar', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard({
      id: 't1',
      groupId: 'g1',
      title: 'Active task',
      priority: 'normal',
      recurrenceUnit: 'none',
      dueDate: '2026-06-01',
      createdAt: NOW,
      updatedAt: NOW,
    });

    renderGroupPage('g1');

    await screen.findByText('Active task');
    const filterLabels = ['All', 'Overdue', 'Today', 'Upcoming', 'No due date'];
    for (const label of filterLabels) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'Completed' })).not.toBeInTheDocument();
  });

  it('2. no "Completed" section/heading is rendered anywhere in the normal Task Group list', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard({
      id: 't1',
      groupId: 'g1',
      title: 'One-time task',
      priority: 'normal',
      recurrenceUnit: 'none',
      dueDate: '2026-06-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await taskRepository.completeTaskOccurrence({
      id: 'c1',
      taskId: 't1',
      occurrenceKey: '2026-06-01',
      completedAt: NOW,
    });

    renderGroupPage('g1');

    await screen.findByText(/no tasks/i); // empty-state: the only task is completed and hidden
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  it('3. a completed ONE-TIME Task is not visible in the normal Task Group list', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard({
      id: 't1',
      groupId: 'g1',
      title: 'Completed one-time task',
      priority: 'normal',
      recurrenceUnit: 'none',
      dueDate: '2026-06-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await taskRepository.saveTaskWithGroupGuard({
      id: 't2',
      groupId: 'g1',
      title: 'Active one-time task',
      priority: 'normal',
      recurrenceUnit: 'none',
      dueDate: '2026-06-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await taskRepository.completeTaskOccurrence({ id: 'c1', taskId: 't1', occurrenceKey: '2026-06-01', completedAt: NOW });

    renderGroupPage('g1');

    await screen.findByText('Active one-time task');
    expect(screen.queryByText('Completed one-time task')).not.toBeInTheDocument();
  });

  it('4. a completed RECURRING occurrence is not visible in the normal Task Group list, and the Task itself remains', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard({
      id: 't1',
      groupId: 'g1',
      title: 'Monthly recurring task',
      priority: 'normal',
      recurrenceUnit: 'month',
      recurrenceInterval: 1,
      dueDate: '2026-09-15',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await taskRepository.completeTaskOccurrence({ id: 'c1', taskId: 't1', occurrenceKey: '2026-09-15', completedAt: NOW });

    renderGroupPage('g1');

    // The recurring Task itself is still shown -- its NEXT occurrence
    // (October) is what's now actionable, never hidden.
    await screen.findByText('Monthly recurring task');
    // The completed September occurrence produces no separate visible card.
    expect(screen.getAllByText('Monthly recurring task')).toHaveLength(1);
  });
});

/**
 * Section "2. COMPLETION BUTTON WORDING", items #8-9, #15-16.
 */
describe('Completion button wording depends on recurrence', () => {
  function task(overrides: Partial<Task>): Task {
    return {
      id: 't1',
      groupId: 'g1',
      title: 'A task',
      priority: 'normal',
      recurrenceUnit: 'none',
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    };
  }

  it('8-9. a NON-RECURRING task shows "Complete" (EN)', async () => {
    await setSetting('locale', 'en');
    render(
      <LanguageProvider>
        <TaskCard
          task={task({ recurrenceUnit: 'none', dueDate: '2026-06-01' })}
          completions={[]}
          onOpen={() => {}}
          onEdit={() => {}}
          onComplete={async () => {}}
        />
      </LanguageProvider>,
    );
    await screen.findByText('Complete');
    expect(screen.queryByText('Complete This Occurrence')).not.toBeInTheDocument();
  });

  it('8. a NON-RECURRING task shows "تم الإنجاز" (AR)', async () => {
    await setSetting('locale', 'ar');
    render(
      <LanguageProvider>
        <TaskCard
          task={task({ recurrenceUnit: 'none', dueDate: '2026-06-01' })}
          completions={[]}
          onOpen={() => {}}
          onEdit={() => {}}
          onComplete={async () => {}}
        />
      </LanguageProvider>,
    );
    await screen.findByText('تم الإنجاز');
  });

  it('15-16. a RECURRING task shows "Complete This Occurrence" (EN), never the non-recurring wording', async () => {
    await setSetting('locale', 'en');
    render(
      <LanguageProvider>
        <TaskCard
          task={task({ recurrenceUnit: 'month', recurrenceInterval: 1, dueDate: '2026-06-01' })}
          completions={[]}
          onOpen={() => {}}
          onEdit={() => {}}
          onComplete={async () => {}}
        />
      </LanguageProvider>,
    );
    await screen.findByText('Complete This Occurrence');
    expect(screen.queryByText('Complete', { selector: 'button' })).not.toBeInTheDocument();
  });

  it('15. a RECURRING task shows "إنجاز هذه الدورة" (AR)', async () => {
    await setSetting('locale', 'ar');
    render(
      <LanguageProvider>
        <TaskCard
          task={task({ recurrenceUnit: 'month', recurrenceInterval: 1, dueDate: '2026-06-01' })}
          completions={[]}
          onOpen={() => {}}
          onEdit={() => {}}
          onComplete={async () => {}}
        />
      </LanguageProvider>,
    );
    await screen.findByText('إنجاز هذه الدورة');
  });
});

/**
 * Section "3. TASK GROUP HEADER ACTION LAYOUT", items #22-24: structural
 * verification -- both actions render as distinct, independently
 * clickable buttons (never merged/overlapping in the DOM), and RTL/LTR
 * both resolve correctly.
 */
describe('Task Group header renders Edit and Archive Group cleanly', () => {
  it('22. both actions render as separate, accessible buttons', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });

    renderGroupPage('g1');

    const editButton = await screen.findByRole('button', { name: 'Edit' });
    const archiveButton = screen.getByRole('button', { name: 'Archive Group' });
    expect(editButton).toBeInTheDocument();
    expect(archiveButton).toBeInTheDocument();
    expect(editButton).not.toBe(archiveButton);
  });

  it('23. RTL layout renders both actions correctly (Arabic locale)', async () => {
    await setSetting('locale', 'ar');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'المنزل', createdAt: NOW, updatedAt: NOW });

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/tasks/group/g1']}>
          <Routes>
            <Route path="/tasks/group/:groupId" element={<TaskGroupDetailPage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    );

    await screen.findByRole('button', { name: 'تعديل' });
    expect(screen.getByRole('button', { name: 'أرشفة المجموعة' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('24. LTR layout renders both actions correctly (English locale)', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });

    renderGroupPage('g1');

    await screen.findByRole('button', { name: 'Edit' });
    expect(screen.getByRole('button', { name: 'Archive Group' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('ltr');
  });
});
