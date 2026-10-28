import { useLanguage } from './useLanguage';
import type { LocalizedText } from '../localization/translations';

export function useLocalizedText(text: LocalizedText): string;
export function useLocalizedText(text: LocalizedText | undefined): string | undefined;
export function useLocalizedText(text: LocalizedText | undefined): string | undefined {
  const { locale } = useLanguage();
  return text?.[locale];
}
