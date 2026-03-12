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

export type Blueprint = {
  id: string;
  exam_track_id: string;
  discipline_id: string | null;
  competency_id: string | null;
  target_percent: number;
  created_at: string;
};

export type Subtopic = {
  id: string;
  competency_id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
};

export type Question = {
  id: string;
  title: string | null;
  stem: string;
  lead_in: string | null;
  explanation: string;
  strategy_text: string | null;
  resources_text: string | null;
  info_text: string | null;
  difficulty: "easy" | "medium" | "hard";
  cognitive_level: "recall" | "application" | "clinical_reasoning";
  question_type: "MCQ" | "IMAGE" | "LAB_INTERPRETATION" | "CASE_SERIES";
  status:
    | "draft"
    | "submitted"
    | "under_review"
    | "needs_revision"
    | "approved"
    | "rejected"
    | "retired";
  exam_track_id: string | null;
  discipline_id: string | null;
  competency_id: string | null;
  subtopic_id: string | null;
  tutor_mode_enabled: boolean;
  author_reference: string | null;
  estimated_time_seconds: number | null;
  source_type: "original" | "adapted" | "imported";
  created_at: string;
  updated_at: string;
};