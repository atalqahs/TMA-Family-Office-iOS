import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { QuickTodoWidget } from '../../src/features/quickTodo/components/QuickTodoWidget';
import { LanguageContext } from '../../src/localization/language-context';
import { LOCALE_DIR, translations, type Locale } from '../../src/localization/translations';

function renderWithLocale(ui: ReactElement, locale: Locale) {
  const value = {
    locale,
    dir: LOCALE_DIR[locale],
    setLocale: async () => true,
    toggleLocale: () => {},
    localeSaveError: false,
    t: (key: keyof (typeof translations)['ar']) => translations[locale][key],
  };
  return render(<LanguageContext.Provider value={value}>{ui}</LanguageContext.Provider>);
}

async function addItem(text: string) {
  const input = screen.getByPlaceholderText('Add a quick task…');
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Add task' }));
  await screen.findByText(text);
}

describe('QuickTodoWidget: empty state', () => {
  it('shows the exact English empty-state copy with no items', async () => {
    renderWithLocale(<QuickTodoWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No quick tasks yet.')).toBeInTheDocument());
  });

  it('shows the exact Arabic empty-state copy with no items', async () => {
    renderWithLocale(<QuickTodoWidget />, 'ar');
    await waitFor(() => expect(screen.getByText('لا توجد مهام سريعة حالياً.')).toBeInTheDocument());
  });
});

describe('QuickTodoWidget: adding items', () => {
  it('adds a new item via the input and clears the input afterward', async () => {
    renderWithLocale(<QuickTodoWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No quick tasks yet.')).toBeInTheDocument());
    await addItem('Get a haircut');
    expect(screen.getByPlaceholderText('Add a quick task…')).toHaveValue('');
    expect(screen.queryByText('No quick tasks yet.')).not.toBeInTheDocument();
  });

  it('does not add a blank item (the add button stays disabled)', async () => {
    renderWithLocale(<QuickTodoWidget />, 'en');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add task' })).toBeDisabled());
  });

  it('shows a small, discreet counter of incomplete items', async () => {
    renderWithLocale(<QuickTodoWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No quick tasks yet.')).toBeInTheDocument());
    await addItem('Get a haircut');
    await addItem('Refuel the car');
    expect(await screen.findByText('2 remaining')).toBeInTheDocument();
  });
});

describe('QuickTodoWidget: toggling completion', () => {
  it('checking a checkbox marks the item complete with a strikethrough style, and it stays visible', async () => {
    renderWithLocale(<QuickTodoWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No quick tasks yet.')).toBeInTheDocument());
    await addItem('Buy groceries');

    const checkbox = screen.getByRole('checkbox', { name: 'Buy groceries' });
    fireEvent.click(checkbox);

    await waitFor(() => expect(checkbox).toBeChecked());
    expect(screen.getByText('Buy groceries').className).toContain('quick-todo-widget__text--completed');
  });

  it('unchecking a completed item restores it to incomplete', async () => {
    renderWithLocale(<QuickTodoWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No quick tasks yet.')).toBeInTheDocument());
    await addItem('Pick up an item');

    const checkbox = screen.getByRole('checkbox', { name: 'Pick up an item' });
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).not.toBeChecked());
    expect(screen.getByText('Pick up an item').className).not.toContain('quick-todo-widget__text--completed');
  });
});

describe('QuickTodoWidget: editing and deleting', () => {
  it('editing an item updates its displayed text', async () => {
    renderWithLocale(<QuickTodoWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No quick tasks yet.')).toBeInTheDocument());
    await addItem('Buy groceries');

    fireEvent.click(screen.getByRole('button', { name: 'Edit task' }));
    const editInput = screen.getByDisplayValue('Buy groceries');
    fireEvent.change(editInput, { target: { value: 'Buy groceries and milk' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    expect(await screen.findByText('Buy groceries and milk')).toBeInTheDocument();
  });

  it('pressing Escape while editing cancels without saving', async () => {
    renderWithLocale(<QuickTodoWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No quick tasks yet.')).toBeInTheDocument());
    await addItem('Buy groceries');

    fireEvent.click(screen.getByRole('button', { name: 'Edit task' }));
    const editInput = screen.getByDisplayValue('Buy groceries');
    fireEvent.change(editInput, { target: { value: 'Something else entirely' } });
    fireEvent.keyDown(editInput, { key: 'Escape' });

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.queryByText('Something else entirely')).not.toBeInTheDocument();
  });

  it('deleting an item removes it and the empty state returns when it was the last one', async () => {
    renderWithLocale(<QuickTodoWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No quick tasks yet.')).toBeInTheDocument());
    await addItem('Buy groceries');

    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }));

    await waitFor(() => expect(screen.getByText('No quick tasks yet.')).toBeInTheDocument());
  });
});
