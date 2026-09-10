import { useObjectUrl } from '../hooks/useObjectUrl';
import './Avatar.css';

interface AvatarProps {
  photo?: Blob;
  name: string;
  size?: 'md' | 'lg';
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function Avatar({ photo, name, size = 'md' }: AvatarProps) {
  const url = useObjectUrl(photo);

  return (
    <span className={`avatar avatar--${size}`}>
      {url ? (
        <img src={url} alt="" className="avatar__image" />
      ) : (
        <span className="avatar__initials" aria-hidden="true">
          {getInitials(name)}
        </span>
      )}
    </span>
  );
}
