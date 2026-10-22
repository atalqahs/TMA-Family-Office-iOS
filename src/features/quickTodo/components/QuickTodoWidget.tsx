import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import { IconButton } from '../../../components/IconButton';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import { renderTemplateText } from '../../../utils/templateText';
import { useQuickTodoItems } from '../hooks/useQuickTodoItems';
import {
  countIncompleteQuickTodoItems,
  createQuickTodoItem,
  removeQuickTodoItem,
  sortQuickTodoItemsForDisplay,
  toggleQuickTodoItemCompleted,
  updateQuickTodoItemText,
} from '../quickTodoService';
import type { QuickTodoItem } from '../types';
import './QuickTodoWidget.css';

/**
 * The Dashboard's Quick To-Do List widget -- a tiny, independent
 * checklist for spontaneous personal reminders (Section 2 of the spec
 * this was built from). Deliberately has none of Tasks & Reminders'
 * structure (no dates, priorities, recurrence, groups) and is never read
 * by any other module (see the architecture gate's isolation rule) --
 * it is fast, informal, everyday scratch space, not a second task system.
 */
export function QuickTodoWidget() {
  const { t, locale } = useLanguage();
  const { items, loading, refresh } = useQuickTodoItems();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    await createQuickTodoItem(draft);
    setDraft('');
    await refresh();
  };

  const handleToggle = async (id: string) => {
    await toggleQuickTodoItemCompleted(id);
    await refresh();
  };

  const startEdit = (item: QuickTodoItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editingText.trim()) {
      cancelEdit();
      return;
    }
    await updateQuickTodoItemText(editingId, editingText);
    cancelEdit();
    await refresh();
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void saveEdit();
    } else if (event.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleDelete = async (id: string) => {
    if (editingId === id) cancelEdit();
    await removeQuickTodoItem(id);
    await refresh();
  };

  const displayItems = sortQuickTodoItemsForDisplay(items);
  const incompleteCount = countIncompleteQuickTodoItems(items);

  return (
    <section className="quick-todo-widget">
      <div className="quick-todo-widget__header">
        <h2 className="quick-todo-widget__title">{t('quickTodoWidgetTitle')}</h2>
        {incompleteCount > 0 && (
          <StatusBadge variant="neutral">
            {renderTemplateText('quickTodoRemainingCount', { count: String(incompleteCount) }, t, locale)}
          </StatusBadge>
        )}
      </div>

      <form className="quick-todo-widget__add-row" onSubmit={handleAdd}>
        <input
          className="form-input quick-todo-widget__add-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('quickTodoAddPlaceholder')}
          aria-label={t('quickTodoAddPlaceholder')}
        />
        <IconButton
          type="submit"
          icon={<Plus size={18} strokeWidth={2} />}
          label={t('quickTodoAddLabel')}
          disabled={!draft.trim()}
        />
      </form>

      {!loading && displayItems.length === 0 && <EmptyState title={t('quickTodoEmptyState')} />}

      {!loading && displayItems.length > 0 && (
        <ul className="quick-todo-widget__list">
          {displayItems.map((item) => (
            <li key={item.id} className="quick-todo-widget__row">
              {editingId === item.id ? (
                <>
                  <input
                    className="form-input quick-todo-widget__edit-input"
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                  />
                  <IconButton icon={<Check size={16} strokeWidth={2} />} label={t('actionSave')} onClick={saveEdit} />
                  <IconButton icon={<X size={16} strokeWidth={2} />} label={t('actionCancel')} onClick={cancelEdit} />
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    className="quick-todo-widget__checkbox"
                    checked={item.completed}
                    onChange={() => void handleToggle(item.id)}
                    aria-label={item.text}
                  />
                  <span
                    className={[
                      'quick-todo-widget__text',
                      item.completed && 'quick-todo-widget__text--completed',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {item.text}
                  </span>
                  <IconButton
                    icon={<Pencil size={16} strokeWidth={1.75} />}
                    label={t('quickTodoEditLabel')}
                    onClick={() => startEdit(item)}
                  />
                  <IconButton
                    icon={<Trash2 size={16} strokeWidth={1.75} />}
                    label={t('quickTodoDeleteLabel')}
                    onClick={() => void handleDelete(item.id)}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
