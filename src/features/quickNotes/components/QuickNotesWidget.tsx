import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import { IconButton } from '../../../components/IconButton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { useQuickNotes } from '../hooks/useQuickNotes';
import { createQuickNote, removeQuickNote, updateQuickNoteText } from '../quickNotesService';
import type { QuickNote } from '../types';
import './QuickNotesWidget.css';

/**
 * The Dashboard's Quick Notes widget -- a tiny, independent list of short
 * or multiline free-text notes (Section 3). No folders/tags/priorities,
 * no linked record, and never read by any other module (see the
 * architecture gate's isolation rule). `white-space: pre-wrap` in CSS is
 * what preserves a note's own line breaks exactly as typed.
 */
export function QuickNotesWidget() {
  const { t } = useLanguage();
  const { notes, loading, refresh } = useQuickNotes();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    await createQuickNote(draft);
    setDraft('');
    await refresh();
  };

  const startEdit = (note: QuickNote) => {
    setEditingId(note.id);
    setEditingText(note.text);
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
    await updateQuickNoteText(editingId, editingText);
    cancelEdit();
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (editingId === id) cancelEdit();
    await removeQuickNote(id);
    await refresh();
  };

  return (
    <section className="quick-notes-widget">
      <div className="quick-notes-widget__header">
        <h2 className="quick-notes-widget__title">{t('quickNotesWidgetTitle')}</h2>
      </div>

      <form className="quick-notes-widget__add-row" onSubmit={handleAdd}>
        <textarea
          className="form-input quick-notes-widget__add-input"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('quickNotesAddPlaceholder')}
          aria-label={t('quickNotesAddPlaceholder')}
        />
        <IconButton
          type="submit"
          icon={<Plus size={18} strokeWidth={2} />}
          label={t('quickNotesAddLabel')}
          disabled={!draft.trim()}
        />
      </form>

      {!loading && notes.length === 0 && <EmptyState title={t('quickNotesEmptyState')} />}

      {!loading && notes.length > 0 && (
        <ul className="quick-notes-widget__list">
          {notes.map((note) => (
            <li key={note.id} className="quick-notes-widget__note">
              {editingId === note.id ? (
                <div className="quick-notes-widget__edit">
                  <textarea
                    className="form-input quick-notes-widget__edit-input"
                    rows={3}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    autoFocus
                  />
                  <div className="quick-notes-widget__edit-actions">
                    <SecondaryButton onClick={cancelEdit}>{t('actionCancel')}</SecondaryButton>
                    <PrimaryButton onClick={saveEdit}>{t('actionSave')}</PrimaryButton>
                  </div>
                </div>
              ) : (
                <>
                  <p className="quick-notes-widget__text">{note.text}</p>
                  <div className="quick-notes-widget__note-actions">
                    <IconButton
                      icon={<Pencil size={15} strokeWidth={1.75} />}
                      label={t('quickNotesEditLabel')}
                      onClick={() => startEdit(note)}
                    />
                    <IconButton
                      icon={<Trash2 size={15} strokeWidth={1.75} />}
                      label={t('quickNotesDeleteLabel')}
                      onClick={() => void handleDelete(note.id)}
                    />
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
