export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          new_value: Json | null
          notes: string | null
          previous_value: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          new_value?: Json | null
          notes?: string | null
          previous_value?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          notes?: string | null
          previous_value?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_feedback: {
        Row: {
          affected_module: string | null
          attachment_url: string | null
          category: Database["public"]["Enums"]["feedback_category"]
          club_id: string | null
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["feedback_priority"]
          status: Database["public"]["Enums"]["feedback_status"]
          submitted_by: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_module?: string | null
          attachment_url?: string | null
          category?: Database["public"]["Enums"]["feedback_category"]
          club_id?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["feedback_priority"]
          status?: Database["public"]["Enums"]["feedback_status"]
          submitted_by: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_module?: string | null
          attachment_url?: string | null
          category?: Database["public"]["Enums"]["feedback_category"]
          club_id?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["feedback_priority"]
          status?: Database["public"]["Enums"]["feedback_status"]
          submitted_by?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          privacy: Database["public"]["Enums"]["club_privacy"]
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          privacy?: Database["public"]["Enums"]["club_privacy"]
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          privacy?: Database["public"]["Enums"]["club_privacy"]
        }
        Relationships: []
      }
      courts: {
        Row: {
          active: boolean
          club_id: string
          created_at: string
          id: string
          indoor: boolean
          name: string
          surface: string | null
        }
        Insert: {
          active?: boolean
          club_id: string
          created_at?: string
          id?: string
          indoor?: boolean
          name: string
          surface?: string | null
        }
        Update: {
          active?: boolean
          club_id?: string
          created_at?: string
          id?: string
          indoor?: boolean
          name?: string
          surface?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          partner_id: string | null
          status: Database["public"]["Enums"]["registration_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          partner_id?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          partner_id?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_waitlist: boolean
          archived_at: string | null
          auto_approve: boolean
          club_id: string
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          discipline: Database["public"]["Enums"]["discipline"]
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          max_participants: number | null
          ranking_impact: boolean
          recurrence: string
          registration_deadline: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Insert: {
          allow_waitlist?: boolean
          archived_at?: string | null
          auto_approve?: boolean
          club_id: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          discipline?: Database["public"]["Enums"]["discipline"]
          ends_at?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          max_participants?: number | null
          ranking_impact?: boolean
          recurrence?: string
          registration_deadline?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Update: {
          allow_waitlist?: boolean
          archived_at?: string | null
          auto_approve?: boolean
          club_id?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          discipline?: Database["public"]["Enums"]["discipline"]
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          max_participants?: number | null
          ranking_impact?: boolean
          recurrence?: string
          registration_deadline?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_comments: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          feedback_id: string
          id: string
          internal: boolean
        }
        Insert: {
          author_id: string
          comment: string
          created_at?: string
          feedback_id: string
          id?: string
          internal?: boolean
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          feedback_id?: string
          id?: string
          internal?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "admin_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_status_history: {
        Row: {
          changed_by: string
          created_at: string
          feedback_id: string
          id: string
          new_status: Database["public"]["Enums"]["feedback_status"]
          old_status: Database["public"]["Enums"]["feedback_status"] | null
        }
        Insert: {
          changed_by: string
          created_at?: string
          feedback_id: string
          id?: string
          new_status: Database["public"]["Enums"]["feedback_status"]
          old_status?: Database["public"]["Enums"]["feedback_status"] | null
        }
        Update: {
          changed_by?: string
          created_at?: string
          feedback_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["feedback_status"]
          old_status?: Database["public"]["Enums"]["feedback_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_status_history_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "admin_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          club_id: string
          confirmed: boolean
          confirmed_at: string | null
          court_id: string | null
          created_at: string
          event_id: string | null
          id: string
          notes: string | null
          player1_id: string | null
          player2_id: string | null
          player3_id: string | null
          player4_id: string | null
          score: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          winner_side: number | null
        }
        Insert: {
          club_id: string
          confirmed?: boolean
          confirmed_at?: string | null
          court_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          player1_id?: string | null
          player2_id?: string | null
          player3_id?: string | null
          player4_id?: string | null
          score?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          winner_side?: number | null
        }
        Update: {
          club_id?: string
          confirmed?: boolean
          confirmed_at?: string | null
          court_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          player1_id?: string | null
          player2_id?: string | null
          player3_id?: string | null
          player4_id?: string | null
          score?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          winner_side?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      player_statistics: {
        Row: {
          club_id: string | null
          current_streak: number
          discipline: Database["public"]["Enums"]["discipline"]
          games_lost: number
          games_won: number
          id: string
          last_match_at: string | null
          longest_streak: number
          losses: number
          matches_played: number
          retired_matches: number
          scope: string
          sets_lost: number
          sets_won: number
          updated_at: string
          user_id: string
          walkovers_lost: number
          walkovers_won: number
          wins: number
        }
        Insert: {
          club_id?: string | null
          current_streak?: number
          discipline: Database["public"]["Enums"]["discipline"]
          games_lost?: number
          games_won?: number
          id?: string
          last_match_at?: string | null
          longest_streak?: number
          losses?: number
          matches_played?: number
          retired_matches?: number
          scope?: string
          sets_lost?: number
          sets_won?: number
          updated_at?: string
          user_id: string
          walkovers_lost?: number
          walkovers_won?: number
          wins?: number
        }
        Update: {
          club_id?: string | null
          current_streak?: number
          discipline?: Database["public"]["Enums"]["discipline"]
          games_lost?: number
          games_won?: number
          id?: string
          last_match_at?: string | null
          longest_streak?: number
          losses?: number
          matches_played?: number
          retired_matches?: number
          scope?: string
          sets_lost?: number
          sets_won?: number
          updated_at?: string
          user_id?: string
          walkovers_lost?: number
          walkovers_won?: number
          wins?: number
        }
        Relationships: []
      }
      presence_privacy_settings: {
        Row: {
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["presence_visibility"]
        }
        Insert: {
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["presence_visibility"]
        }
        Update: {
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["presence_visibility"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anonymized_at: string | null
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          dominant_hand: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          is_active: boolean
          last_login_at: string | null
          phone: string | null
          rating_doubles: number
          rating_mixed: number
          rating_singles: number
          skill_level: Database["public"]["Enums"]["skill_level"]
          updated_at: string
        }
        Insert: {
          anonymized_at?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          dominant_hand?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          rating_doubles?: number
          rating_mixed?: number
          rating_singles?: number
          skill_level?: Database["public"]["Enums"]["skill_level"]
          updated_at?: string
        }
        Update: {
          anonymized_at?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          dominant_hand?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          rating_doubles?: number
          rating_mixed?: number
          rating_singles?: number
          skill_level?: Database["public"]["Enums"]["skill_level"]
          updated_at?: string
        }
        Relationships: []
      }
      rankings: {
        Row: {
          club_id: string
          discipline: Database["public"]["Enums"]["discipline"]
          id: string
          losses: number
          matches_played: number
          rating: number
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          club_id: string
          discipline?: Database["public"]["Enums"]["discipline"]
          id?: string
          losses?: number
          matches_played?: number
          rating?: number
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          club_id?: string
          discipline?: Database["public"]["Enums"]["discipline"]
          id?: string
          losses?: number
          matches_played?: number
          rating?: number
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "rankings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      rating_history: {
        Row: {
          club_id: string | null
          created_at: string
          delta: number
          discipline: Database["public"]["Enums"]["discipline"]
          id: string
          k_factor: number
          match_id: string | null
          new_rating: number
          old_rating: number
          reason: string | null
          scope: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          delta: number
          discipline: Database["public"]["Enums"]["discipline"]
          id?: string
          k_factor?: number
          match_id?: string | null
          new_rating: number
          old_rating: number
          reason?: string | null
          scope?: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          delta?: number
          discipline?: Database["public"]["Enums"]["discipline"]
          id?: string
          k_factor?: number
          match_id?: string | null
          new_rating?: number
          old_rating?: number
          reason?: string | null
          scope?: string
          user_id?: string
        }
        Relationships: []
      }
      report_actions: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          notes: string | null
          report_id: string
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          notes?: string | null
          report_id: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "user_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      user_avoidance_preferences: {
        Row: {
          avoided_user_id: string
          created_at: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          avoided_user_id: string
          created_at?: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          avoided_user_id?: string
          created_at?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          last_seen_at: string
          status: Database["public"]["Enums"]["presence_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          last_seen_at?: string
          status?: Database["public"]["Enums"]["presence_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          last_seen_at?: string
          status?: Database["public"]["Enums"]["presence_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          admin_notes: string | null
          club_id: string | null
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          club_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          club_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_user_id?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string
          club_id: string
          created_at: string
          google_maps_url: string | null
          id: string
          name: string
        }
        Insert: {
          address: string
          club_id: string
          created_at?: string
          google_maps_url?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string
          club_id?: string
          created_at?: string
          google_maps_url?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_user: { Args: { _user_id: string }; Returns: undefined }
      can_view_presence: { Args: { _target: string }; Returns: boolean }
      club_has_history: { Args: { _club_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_club_admin: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      is_club_member: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      presence_heartbeat: { Args: never; Returns: undefined }
      presence_set_offline: { Args: never; Returns: undefined }
      user_has_history: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "club_admin" | "organizer" | "player"
      club_privacy: "public" | "private" | "invite_only"
      club_role: "admin" | "organizer" | "member"
      discipline: "singles" | "doubles" | "mixed"
      event_status:
        | "draft"
        | "published"
        | "registration_open"
        | "registration_closed"
        | "in_progress"
        | "completed"
        | "cancelled"
      event_type:
        | "singles_tournament"
        | "doubles_tournament"
        | "mixed_doubles"
        | "league"
        | "ladder"
        | "round_robin"
        | "knockout"
        | "casual"
        | "training"
        | "rotating_doubles"
        | "custom"
      feedback_category:
        | "bug"
        | "feature_request"
        | "ux"
        | "ranking"
        | "registration"
        | "scheduling"
        | "scoring"
        | "club_mgmt"
        | "moderation"
        | "other"
      feedback_priority: "low" | "medium" | "high" | "critical"
      feedback_status:
        | "submitted"
        | "under_review"
        | "planned"
        | "in_progress"
        | "released"
        | "rejected"
      gender: "male" | "female" | "other" | "unspecified"
      match_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "walkover"
        | "retired"
      presence_status: "online" | "idle" | "offline"
      presence_visibility: "everyone" | "admins_only" | "hidden"
      registration_status:
        | "pending"
        | "approved"
        | "rejected"
        | "waitlist"
        | "cancelled"
      report_reason:
        | "bad_behavior"
        | "abusive_language"
        | "no_show"
        | "repeated_cancellations"
        | "false_score"
        | "unfair_play"
        | "harassment"
        | "safety_concern"
        | "do_not_recommend"
        | "other"
      report_status:
        | "new"
        | "under_review"
        | "resolved"
        | "dismissed"
        | "malicious"
      skill_level: "beginner" | "intermediate" | "advanced" | "league"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "club_admin", "organizer", "player"],
      club_privacy: ["public", "private", "invite_only"],
      club_role: ["admin", "organizer", "member"],
      discipline: ["singles", "doubles", "mixed"],
      event_status: [
        "draft",
        "published",
        "registration_open",
        "registration_closed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      event_type: [
        "singles_tournament",
        "doubles_tournament",
        "mixed_doubles",
        "league",
        "ladder",
        "round_robin",
        "knockout",
        "casual",
        "training",
        "rotating_doubles",
        "custom",
      ],
      feedback_category: [
        "bug",
        "feature_request",
        "ux",
        "ranking",
        "registration",
        "scheduling",
        "scoring",
        "club_mgmt",
        "moderation",
        "other",
      ],
      feedback_priority: ["low", "medium", "high", "critical"],
      feedback_status: [
        "submitted",
        "under_review",
        "planned",
        "in_progress",
        "released",
        "rejected",
      ],
      gender: ["male", "female", "other", "unspecified"],
      match_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "walkover",
        "retired",
      ],
      presence_status: ["online", "idle", "offline"],
      presence_visibility: ["everyone", "admins_only", "hidden"],
      registration_status: [
        "pending",
        "approved",
        "rejected",
        "waitlist",
        "cancelled",
      ],
      report_reason: [
        "bad_behavior",
        "abusive_language",
        "no_show",
        "repeated_cancellations",
        "false_score",
        "unfair_play",
        "harassment",
        "safety_concern",
        "do_not_recommend",
        "other",
      ],
      report_status: [
        "new",
        "under_review",
        "resolved",
        "dismissed",
        "malicious",
      ],
      skill_level: ["beginner", "intermediate", "advanced", "league"],
    },
  },
} as const
