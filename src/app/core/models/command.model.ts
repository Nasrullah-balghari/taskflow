export type CommandType =
  | 'action'
  | 'task'
  | 'category'
  | 'navigation';

export type CommandGroup =
  | 'Actions'
  | 'Tasks'
  | 'Categories'
  | 'Navigation'
  | 'Recent';

export type CommandIcon =
  | 'plus'
  | 'edit'
  | 'check-square'
  | 'folder'
  | 'home'
  | 'list'
  | 'trello'
  | 'calendar'
  | 'clock'
  | 'settings'
  | 'log-out'
  | 'search';

export interface Command {
  id:          string;
  type:        CommandType;
  group:       CommandGroup;
  title:       string;
  subtitle?:   string;
  icon:        CommandIcon;
  iconColor?:  string;
  keywords:    string[];
  shortcut?:   string;
  execute:     () => void;
  meta?: {
    completed?:     boolean;
    priority?:      'low' | 'medium' | 'high';
    categoryColor?: string;
    categoryName?:  string;
  };
}
