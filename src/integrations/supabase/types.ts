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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          reminder_enabled: boolean
          subject_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string
          id?: string
          reminder_enabled?: boolean
          subject_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          reminder_enabled?: boolean
          subject_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          active: boolean
          created_at: string
          goal_type: string
          id: string
          period: string
          period_start: string
          target_value: number
          title: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          goal_type?: string
          id?: string
          period?: string
          period_start?: string
          target_value: number
          title?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          goal_type?: string
          id?: string
          period?: string
          period_start?: string
          target_value?: number
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed: boolean
          created_at: string
          habit_id: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          habit_id: string
          id?: string
          log_date: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          active: boolean
          created_at: string
          icon: string
          id: string
          name: string
          target_days: Json
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          name: string
          target_days?: Json
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          name?: string
          target_days?: Json
          user_id?: string
        }
        Relationships: []
      }
      note_tags: {
        Row: {
          note_id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          note_id: string
          tag_id: string
          user_id: string
        }
        Update: {
          note_id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          note_date: string
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          note_date?: string
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          note_date?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          break_minutes: number
          completed_cycles: number
          ended_at: string | null
          focus_minutes: number
          id: string
          interrupted: boolean
          mode: string
          planned_cycles: number | null
          started_at: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          break_minutes?: number
          completed_cycles?: number
          ended_at?: string | null
          focus_minutes?: number
          id?: string
          interrupted?: boolean
          mode?: string
          planned_cycles?: number | null
          started_at?: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          break_minutes?: number
          completed_cycles?: number
          ended_at?: string | null
          focus_minutes?: number
          id?: string
          interrupted?: boolean
          mode?: string
          planned_cycles?: number | null
          started_at?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          locale: string
          name: string | null
          onboarding_completed: boolean
          study_goal: string | null
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          locale?: string
          name?: string | null
          onboarding_completed?: boolean
          study_goal?: string | null
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          locale?: string
          name?: string | null
          onboarding_completed?: boolean
          study_goal?: string | null
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_blocks: {
        Row: {
          created_at: string
          end_datetime: string
          id: string
          linked_event_id: string | null
          rescheduled_from: string | null
          source: string
          start_datetime: string
          status: string
          subject_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_datetime: string
          id?: string
          linked_event_id?: string | null
          rescheduled_from?: string | null
          source?: string
          start_datetime: string
          status?: string
          subject_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_datetime?: string
          id?: string
          linked_event_id?: string | null
          rescheduled_from?: string | null
          source?: string
          start_datetime?: string
          status?: string
          subject_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_blocks_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_blocks_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "study_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_blocks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          active: boolean
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
