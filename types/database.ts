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