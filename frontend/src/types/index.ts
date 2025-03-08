export interface User {
    id: string;
    role: 'student' | 'instructor';
    name: string;
  }
  
  export interface Conversation {
    id: string;
    topic: string;
    level: string;
    duration: number;
    timestamp: Date;
  }
  
  export interface Progress {
    userId: string;
    level: string;
    totalPracticeTime: number;
    conversationsCompleted: number;
    topicsCovered: number;
  }