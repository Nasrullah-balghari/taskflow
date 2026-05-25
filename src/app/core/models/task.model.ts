export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus   = 'todo' | 'in-progress' | 'done';

export interface Task {
  id:           string;
  userId:       string;
  title:        string;
  description?: string;
  completed:    boolean;
  priority:     TaskPriority;
  status:       TaskStatus;
  categoryId?:  string;
  dueDate?:     string;        // 'YYYY-MM-DD'
  dueTime?:     string;        // 'HH:mm'
  createdAt:    string;        // ISO datetime
  updatedAt:    string;        // ISO datetime
  completedAt?: number;        // Unix ms timestamp, set when completed
}

export interface CreateTaskRequest {
  title:        string;
  description?: string;
  priority:     TaskPriority;
  categoryId?:  string;
  dueDate?:     string;
  dueTime?:     string;
}

export interface UpdateTaskRequest {
  title?:       string;
  description?: string;
  priority?:    TaskPriority;
  status?:      TaskStatus;
  categoryId?:  string;
  dueDate?:     string;
  dueTime?:     string;
  completed?:   boolean;
}

export type ActivityEventType = 'created' | 'completed' | 'deleted';

export interface ActivityEvent {
  id:          string;
  type:        ActivityEventType;
  taskTitle:   string;
  categoryId?: string;
  timestamp:   number;
}
