export type ExamTrack = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
};

export type Discipline = {
  id: string;
  exam_track_id: string | null;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
};

export type Competency = {
  id: string;
  discipline_id: string;
  name: string;
  description: string | null;
  threshold_percent: number;
  minimum_questions: number;
  active: boolean;
  created_at: string;
};