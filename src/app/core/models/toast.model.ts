export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label:   string;
  handler: () => void;
}

export interface Toast {
  id:           string;
  type:         ToastType;
  title:        string;
  message?:     string;
  duration?:    number;
  action?:      ToastAction;
  dismissible?: boolean;
  createdAt:    number;
}

export interface ToastOptions {
  message?:     string;
  duration?:    number;
  action?:      ToastAction;
  dismissible?: boolean;
}
