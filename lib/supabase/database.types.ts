import type { ThemeId } from "@/lib/theme/themes";

export type UserRole = "admin" | "student" | "restricted_reports";
export type GrantStatus = "inert" | "active" | "revoked";
export type PlanStyle = "fixed" | "flexible" | "suggested";
export type AgendaItemType = "lesson" | "practice" | "other";
export type AgendaStatus = "pending" | "done";
export type LessonProgressStatus = "not_started" | "in_progress" | "completed";
export type HelpSubject = "RLA" | "Math" | "Science" | "Social Studies";
export type HelpSessionStatus = "active" | "completed";
export type HelpMessageRole = "user" | "assistant";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string;
          email: string;
          date_of_birth: string | null;
          parent_access_enabled: boolean;
          theme_preference: ThemeId | null;
          plan_style: PlanStyle | null;
          created_at: string;
        };
        // Rows are only ever created by the handle_new_user trigger, never by the
        // client — these shapes exist for typing completeness, not client use.
        Insert: {
          id: string;
          role: UserRole;
          display_name: string;
          email: string;
          date_of_birth?: string | null;
        };
        Update: {
          display_name?: string;
          parent_access_enabled?: boolean;
          theme_preference?: ThemeId;
          plan_style?: PlanStyle;
        };
        Relationships: [];
      };
      agenda_items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subtitle: string | null;
          subject: string | null;
          item_type: AgendaItemType;
          scheduled_date: string;
          status: AgendaStatus;
          carried_over_from: string | null;
          content_slug: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          subtitle?: string | null;
          subject?: string | null;
          item_type: AgendaItemType;
          scheduled_date?: string;
          status?: AgendaStatus;
          content_slug?: string | null;
          order_index?: number;
        };
        Update: {
          status?: AgendaStatus;
          scheduled_date?: string;
          carried_over_from?: string | null;
        };
        Relationships: [];
      };
      curated_videos: {
        Row: {
          id: string;
          skill_tag: string;
          title: string;
          youtube_url: string;
          channel_name: string | null;
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          skill_tag: string;
          title: string;
          youtube_url: string;
          channel_name?: string | null;
          duration_seconds?: number | null;
        };
        Update: {
          skill_tag?: string;
          title?: string;
          youtube_url?: string;
          channel_name?: string | null;
          duration_seconds?: number | null;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          status: LessonProgressStatus;
          last_position: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          status?: LessonProgressStatus;
          last_position?: number;
        };
        Update: {
          status?: LessonProgressStatus;
          last_position?: number;
        };
        Relationships: [];
      };
      access_grants: {
        Row: {
          id: string;
          grantor_user_id: string;
          grantee_user_id: string;
          scope: "reports";
          status: GrantStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          grantor_user_id: string;
          grantee_user_id: string;
          scope: "reports";
          status?: GrantStatus;
        };
        Update: {
          status?: GrantStatus;
        };
        Relationships: [];
      };
      digest_subscriptions: {
        Row: {
          user_id: string;
          enabled: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          enabled?: boolean;
        };
        Update: {
          enabled?: boolean;
        };
        Relationships: [];
      };
      extended_responses: {
        Row: {
          id: string;
          user_id: string;
          raw_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          raw_text: string;
        };
        Update: {
          raw_text?: string;
        };
        Relationships: [];
      };
      help_sessions: {
        Row: {
          id: string;
          user_id: string;
          subject: HelpSubject;
          status: HelpSessionStatus;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: HelpSubject;
          status?: HelpSessionStatus;
        };
        Update: {
          status?: HelpSessionStatus;
          completed_at?: string;
        };
        Relationships: [];
      };
      help_problems: {
        Row: {
          id: string;
          session_id: string;
          source_image_path: string | null;
          extracted_text: string;
          order_index: number;
          solved: boolean;
        };
        Insert: {
          id?: string;
          session_id: string;
          source_image_path?: string | null;
          extracted_text: string;
          order_index?: number;
          solved?: boolean;
        };
        Update: {
          solved?: boolean;
        };
        Relationships: [];
      };
      help_messages: {
        Row: {
          id: string;
          problem_id: string;
          role: HelpMessageRole;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          role: HelpMessageRole;
          content: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      student_signup_available: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      restricted_signup_available: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
