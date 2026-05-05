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
          created_at: string
          created_by: string
          description: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          privacy: Database["public"]["Enums"]["club_privacy"]
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          privacy?: Database["public"]["Enums"]["club_privacy"]
        }
        Update: {
          created_at?: string
          created_by?: string
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
          auto_approve: boolean
          club_id: string
          created_at: string
          created_by: string
          description: string | null
          discipline: Database["public"]["Enums"]["discipline"]
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          max_participants: number | null
          ranking_impact: boolean
          registration_deadline: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Insert: {
          allow_waitlist?: boolean
          auto_approve?: boolean
          club_id: string
          created_at?: string
          created_by: string
          description?: string | null
          discipline?: Database["public"]["Enums"]["discipline"]
          ends_at?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          max_participants?: number | null
          ranking_impact?: boolean
          registration_deadline?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Update: {
          allow_waitlist?: boolean
          auto_approve?: boolean
          club_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          discipline?: Database["public"]["Enums"]["discipline"]
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          max_participants?: number | null
          ranking_impact?: boolean
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
      matches: {
        Row: {
          club_id: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dominant_hand: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          phone: string | null
          rating_doubles: number
          rating_mixed: number
          rating_singles: number
          skill_level: Database["public"]["Enums"]["skill_level"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dominant_hand?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id: string
          phone?: string | null
          rating_doubles?: number
          rating_mixed?: number
          rating_singles?: number
          skill_level?: Database["public"]["Enums"]["skill_level"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dominant_hand?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_club_admin: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      is_club_member: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
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
      gender: "male" | "female" | "other" | "unspecified"
      match_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "walkover"
        | "retired"
      registration_status:
        | "pending"
        | "approved"
        | "rejected"
        | "waitlist"
        | "cancelled"
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
      gender: ["male", "female", "other", "unspecified"],
      match_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "walkover",
        "retired",
      ],
      registration_status: [
        "pending",
        "approved",
        "rejected",
        "waitlist",
        "cancelled",
      ],
      skill_level: ["beginner", "intermediate", "advanced", "league"],
    },
  },
} as const
