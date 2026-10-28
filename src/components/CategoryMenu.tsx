import { CATEGORIES, SECONDARY_NAV_ITEMS } from '../features/categories/categories';
import { useLanguage } from '../hooks/useLanguage';
import { CategoryCard } from './CategoryCard';
import { Sheet } from './Sheet';
import './CategoryMenu.css';

interface CategoryMenuProps {
  open: boolean;
  onClose: () => void;
}

export function CategoryMenu({ open, onClose }: CategoryMenuProps) {
  const { t, locale } = useLanguage();

  return (
    <Sheet open={open} onClose={onClose} title={t('menuTitle')} closeLabel={t('menuCloseLabel')}>
      <nav className="category-menu" aria-label={t('menuTitle')}>
        <ul className="category-menu__list">
          {CATEGORIES.map((category) => (
            <li key={category.id}>
              <CategoryCard
                variant="row"
                path={category.path}
                icon={category.icon}
                title={category.title[locale]}
                subtitle={category.subtitle[locale]}
                onNavigate={onClose}
              />
            </li>
          ))}
        </ul>

        <p className="category-menu__section-label">{t('menuMoreSection')}</p>
        <ul className="category-menu__list">
          {SECONDARY_NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <CategoryCard
                variant="row"
                path={item.path}
                icon={item.icon}
                title={item.title[locale]}
                onNavigate={onClose}
              />
            </li>
          ))}
        </ul>
      </nav>
    </Sheet>
  );
}
