export type UserRole = "admin" | "student" | "restricted_reports";
export type GrantStatus = "inert" | "active" | "revoked";

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
