export type ShortcutCategory =
  | 'Global'
  | 'Navigation'
  | 'Tasks'
  | 'Modal';

export interface Shortcut {
  id:          string;
  keys:        string[];
  description: string;
  category:    ShortcutCategory;
  handler:     (event?: KeyboardEvent) => void;
  enabled?:    () => boolean;
  isSequence?: boolean;
}
