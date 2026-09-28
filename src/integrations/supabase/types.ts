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
      app_usage_survey_responses: {
        Row: {
          comment: string | null
          created_at: string
          ease: number
          features_used: string[]
          id: string
          most_used: string
          prompt: string
          tech_issue: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          ease: number
          features_used?: string[]
          id?: string
          most_used: string
          prompt: string
          tech_issue: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          ease?: number
          features_used?: string[]
          id?: string
          most_used?: string
          prompt?: string
          tech_issue?: string
          user_id?: string
        }
        Relationships: []
      }
      hartford_311_complaints: {
        Row: {
          department: string | null
          id: number
          norm_address: string
          opened_at: string | null
          request_number: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          department?: string | null
          id?: number
          norm_address: string
          opened_at?: string | null
          request_number?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          department?: string | null
          id?: number
          norm_address?: string
          opened_at?: string | null
          request_number?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hartford_311_complaints_norm_address_fkey"
            columns: ["norm_address"]
            isOneToOne: false
            referencedRelation: "hartford_addresses"
            referencedColumns: ["norm_address"]
          },
        ]
      }
      hartford_addresses: {
        Row: {
          census_tract: string | null
          display_address: string
          neighborhood: string | null
          norm_address: string
          owner_name: string | null
        }
        Insert: {
          census_tract?: string | null
          display_address: string
          neighborhood?: string | null
          norm_address: string
          owner_name?: string | null
        }
        Update: {
          census_tract?: string | null
          display_address?: string
          neighborhood?: string | null
          norm_address?: string
          owner_name?: string | null
        }
        Relationships: []
      }
      hartford_code_violations: {
        Row: {
          case_number: string | null
          closed_at: string | null
          dept_division: string | null
          description: string | null
          id: number
          norm_address: string
          opened_at: string | null
          record_type: string | null
          status: string | null
        }
        Insert: {
          case_number?: string | null
          closed_at?: string | null
          dept_division?: string | null
          description?: string | null
          id?: number
          norm_address: string
          opened_at?: string | null
          record_type?: string | null
          status?: string | null
        }
        Update: {
          case_number?: string | null
          closed_at?: string | null
          dept_division?: string | null
          description?: string | null
          id?: number
          norm_address?: string
          opened_at?: string | null
          record_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hartford_code_violations_norm_address_fkey"
            columns: ["norm_address"]
            isOneToOne: false
            referencedRelation: "hartford_addresses"
            referencedColumns: ["norm_address"]
          },
        ]
      }
      intake_responses: {
        Row: {
          created_at: string
          followup: Json
          id: string
          survey_scores: Json
          tract_fips: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          followup?: Json
          id?: string
          survey_scores: Json
          tract_fips?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          followup?: Json
          id?: string
          survey_scores?: Json
          tract_fips?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_steps: {
        Row: {
          completed_at: string | null
          detail: string | null
          domain: string
          id: string
          plan_id: string
          resource_id: string | null
          step_order: number
          title: string
          user_id: string
          week: number
        }
        Insert: {
          completed_at?: string | null
          detail?: string | null
          domain: string
          id?: string
          plan_id: string
          resource_id?: string | null
          step_order?: number
          title: string
          user_id: string
          week: number
        }
        Update: {
          completed_at?: string | null
          detail?: string | null
          domain?: string
          id?: string
          plan_id?: string
          resource_id?: string | null
          step_order?: number
          title?: string
          user_id?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "stabilization_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          language_pref: string | null
          last_name: string | null
          phone: string | null
          sms_alerts: boolean
          street_address: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          language_pref?: string | null
          last_name?: string | null
          phone?: string | null
          sms_alerts?: boolean
          street_address?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          language_pref?: string | null
          last_name?: string | null
          phone?: string | null
          sms_alerts?: boolean
          street_address?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      stabilization_plans: {
        Row: {
          generated_at: string
          id: string
          intake_id: string | null
          plan: Json
          status: string
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          intake_id?: string | null
          plan: Json
          status?: string
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          intake_id?: string | null
          plan?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stabilization_plans_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intake_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          barrier: string
          comment: string | null
          created_at: string
          helpfulness: number
          id: string
          other_text: string | null
          progress: string
          user_id: string
        }
        Insert: {
          barrier: string
          comment?: string | null
          created_at?: string
          helpfulness: number
          id?: string
          other_text?: string | null
          progress: string
          user_id: string
        }
        Update: {
          barrier?: string
          comment?: string | null
          created_at?: string
          helpfulness?: number
          id?: string
          other_text?: string | null
          progress?: string
          user_id?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_public_stats: {
        Args: never
        Returns: {
          assessments_this_month: number
          plans_all_time: number
          plans_this_month: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
