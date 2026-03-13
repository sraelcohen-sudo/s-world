export type QuestionOptionKey = "A" | "B" | "C" | "D" | "E";

export type QuestionOptionMap = Record<QuestionOptionKey, string | null>;

export type Subject = {
  id: string;
  name: string;
  description: string | null;
};

export type Topic = {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
};

export type Subtopic = {
  id: string;
  topic_id: string;
  name: string;
  description: string | null;
};

export type Question = {
  id: string;
  subtopic_id: string;
  stem: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct_answer: QuestionOptionKey;
  explanation: string | null;
  source: string | null;
  created_at: string;
};

export type SubjectWithTopics = Subject & {
  topics: Topic[];
};

export type TopicWithSubtopics = Topic & {
  subtopics: Subtopic[];
};

export type QuestionWithOptions = Question & {
  options: QuestionOptionMap;
};

export type SubjectsApiResponse = {
  success: boolean;
  subjects: Subject[];
};

export type TopicsApiResponse = {
  success: boolean;
  topics: Topic[];
};

export type SubtopicsApiResponse = {
  success: boolean;
  subtopics: Subtopic[];
};

export type QuestionsApiResponse = {
  success: boolean;
  questions: Question[];
};