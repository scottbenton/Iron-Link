export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assets: {
        Row: {
          character_id: string | null
          control_values: Json
          created_at: string
          datasworn_asset_id: string
          enabled_abilities: Json
          game_id: string | null
          id: string
          option_values: Json
          order: number
        }
        Insert: {
          character_id?: string | null
          control_values?: Json
          created_at?: string
          datasworn_asset_id: string
          enabled_abilities?: Json
          game_id?: string | null
          id?: string
          option_values?: Json
          order: number
        }
        Update: {
          character_id?: string | null
          control_values?: Json
          created_at?: string
          datasworn_asset_id?: string
          enabled_abilities?: Json
          game_id?: string | null
          id?: string
          option_values?: Json
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "assets_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          adds: number
          color_scheme: string | null
          condition_meter_values: Json
          created_at: string
          game_id: string | null
          id: string
          impact_values: Json
          initiative_status: Database["public"]["Enums"]["character_initiative_status"]
          momentum: number
          name: string
          portrait_filename: string | null
          portrait_position_x: number | null
          portrait_position_y: number | null
          portrait_scale: number | null
          special_track_values: Json
          stat_values: Json
          uid: string
          unspent_experience: number
        }
        Insert: {
          adds?: number
          color_scheme?: string | null
          condition_meter_values?: Json
          created_at?: string
          game_id?: string | null
          id?: string
          impact_values?: Json
          initiative_status?: Database["public"]["Enums"]["character_initiative_status"]
          momentum?: number
          name: string
          portrait_filename?: string | null
          portrait_position_x?: number | null
          portrait_position_y?: number | null
          portrait_scale?: number | null
          special_track_values?: Json
          stat_values?: Json
          uid: string
          unspent_experience?: number
        }
        Update: {
          adds?: number
          color_scheme?: string | null
          condition_meter_values?: Json
          created_at?: string
          game_id?: string | null
          id?: string
          impact_values?: Json
          initiative_status?: Database["public"]["Enums"]["character_initiative_status"]
          momentum?: number
          name?: string
          portrait_filename?: string | null
          portrait_position_x?: number | null
          portrait_position_y?: number | null
          portrait_scale?: number | null
          special_track_values?: Json
          stat_values?: Json
          uid?: string
          unspent_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "characters_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_logs: {
        Row: {
          character_id: string | null
          created_at: string
          game_id: string
          guides_only: boolean
          id: string
          log_data: Json
          type: Database["public"]["Enums"]["game_log_type"]
          user_id: string | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          game_id: string
          guides_only?: boolean
          id?: string
          log_data?: Json
          type: Database["public"]["Enums"]["game_log_type"]
          user_id?: string | null
        }
        Update: {
          character_id?: string | null
          created_at?: string
          game_id?: string
          guides_only?: boolean
          id?: string
          log_data?: Json
          type?: Database["public"]["Enums"]["game_log_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_logs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_logs_character_id_fkey1"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_logs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_logs_game_id_fkey1"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_logs_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          created_at: string
          game_id: string
          role: Database["public"]["Enums"]["player_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          role?: Database["public"]["Enums"]["player_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          role?: Database["public"]["Enums"]["player_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_second_screen_settings: {
        Row: {
          created_at: string
          game_id: string
          options: Json
          show_all_characters_second_screen: boolean
          type: Database["public"]["Enums"]["second_screen_options"] | null
        }
        Insert: {
          created_at?: string
          game_id: string
          options?: Json
          show_all_characters_second_screen?: boolean
          type?: Database["public"]["Enums"]["second_screen_options"] | null
        }
        Update: {
          created_at?: string
          game_id?: string
          options?: Json
          show_all_characters_second_screen?: boolean
          type?: Database["public"]["Enums"]["second_screen_options"] | null
        }
        Relationships: [
          {
            foreignKeyName: "game_second_screen_settings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_tracks: {
        Row: {
          clock_oracle_key: Database["public"]["Enums"]["clock_oracle_key"]
          completed_clock_segments: number
          completed_ticks: number
          created_at: string
          description: string | null
          game_id: string
          id: string
          is_completed: boolean
          label: string
          progress_track_type: Database["public"]["Enums"]["progress_track_type"]
          total_clock_segments: number
          track_difficulty: Database["public"]["Enums"]["progress_track_difficulty"]
          type: Database["public"]["Enums"]["track_type"]
        }
        Insert: {
          clock_oracle_key?: Database["public"]["Enums"]["clock_oracle_key"]
          completed_clock_segments?: number
          completed_ticks?: number
          created_at?: string
          description?: string | null
          game_id?: string
          id?: string
          is_completed?: boolean
          label: string
          progress_track_type?: Database["public"]["Enums"]["progress_track_type"]
          total_clock_segments?: number
          track_difficulty: Database["public"]["Enums"]["progress_track_difficulty"]
          type: Database["public"]["Enums"]["track_type"]
        }
        Update: {
          clock_oracle_key?: Database["public"]["Enums"]["clock_oracle_key"]
          completed_clock_segments?: number
          completed_ticks?: number
          created_at?: string
          description?: string | null
          game_id?: string
          id?: string
          is_completed?: boolean
          label?: string
          progress_track_type?: Database["public"]["Enums"]["progress_track_type"]
          total_clock_segments?: number
          track_difficulty?: Database["public"]["Enums"]["progress_track_difficulty"]
          type?: Database["public"]["Enums"]["track_type"]
        }
        Relationships: [
          {
            foreignKeyName: "game_tracks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          color_scheme: string | null
          condition_meter_values: Json
          created_at: string
          expansions: Json
          game_type: Database["public"]["Enums"]["game_type"]
          id: string
          name: string
          rulesets: Json
          special_track_values: Json
        }
        Insert: {
          color_scheme?: string | null
          condition_meter_values?: Json
          created_at?: string
          expansions?: Json
          game_type: Database["public"]["Enums"]["game_type"]
          id?: string
          name: string
          rulesets?: Json
          special_track_values?: Json
        }
        Update: {
          color_scheme?: string | null
          condition_meter_values?: Json
          created_at?: string
          expansions?: Json
          game_type?: Database["public"]["Enums"]["game_type"]
          id?: string
          name?: string
          rulesets?: Json
          special_track_values?: Json
        }
        Relationships: []
      }
      note_folders: {
        Row: {
          author_id: string
          created_at: string
          edit_permissions: Database["public"]["Enums"]["note_edit_permissions"]
          game_id: string
          id: string
          is_root_player_folder: boolean
          name: string | null
          order: number
          parent_folder_id: string | null
          read_permissions: Database["public"]["Enums"]["note_read_permissions"]
        }
        Insert: {
          author_id: string
          created_at?: string
          edit_permissions: Database["public"]["Enums"]["note_edit_permissions"]
          game_id: string
          id?: string
          is_root_player_folder?: boolean
          name?: string | null
          order: number
          parent_folder_id?: string | null
          read_permissions: Database["public"]["Enums"]["note_read_permissions"]
        }
        Update: {
          author_id?: string
          created_at?: string
          edit_permissions?: Database["public"]["Enums"]["note_edit_permissions"]
          game_id?: string
          id?: string
          is_root_player_folder?: boolean
          name?: string | null
          order?: number
          parent_folder_id?: string | null
          read_permissions?: Database["public"]["Enums"]["note_read_permissions"]
        }
        Relationships: [
          {
            foreignKeyName: "note_folders_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_folders_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          created_at: string
          edit_permissions: Database["public"]["Enums"]["note_edit_permissions"]
          game_id: string
          id: string
          note_content_bytes: string | null
          note_content_text: string | null
          order: number
          parent_folder_id: string
          read_permissions: Database["public"]["Enums"]["note_read_permissions"]
          title: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          edit_permissions: Database["public"]["Enums"]["note_edit_permissions"]
          game_id: string
          id?: string
          note_content_bytes?: string | null
          note_content_text?: string | null
          order: number
          parent_folder_id: string
          read_permissions: Database["public"]["Enums"]["note_read_permissions"]
          title?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          edit_permissions?: Database["public"]["Enums"]["note_edit_permissions"]
          game_id?: string
          id?: string
          note_content_bytes?: string | null
          note_content_text?: string | null
          order?: number
          parent_folder_id?: string
          read_permissions?: Database["public"]["Enums"]["note_read_permissions"]
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
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
      character_initiative_status:
        | "has_initiative"
        | "no_initiative"
        | "out_of_combat"
      clock_oracle_key:
        | "almost_certain"
        | "likely"
        | "fifty_fifty"
        | "unlikely"
        | "small_chance"
      game_log_type:
        | "stat_roll"
        | "oracle_table_roll"
        | "track_progress_roll"
        | "special_track_progress_roll"
        | "clock_progression_roll"
      game_type: "solo" | "co-op" | "guided"
      note_edit_permissions:
        | "only_author"
        | "only_guides"
        | "guides_and_author"
        | "all_players"
      note_read_permissions:
        | "only_author"
        | "only_guides"
        | "all_players"
        | "guides_and_author"
        | "public"
      player_role: "guide" | "player"
      progress_track_difficulty:
        | "troublesome"
        | "dangerous"
        | "formidable"
        | "extreme"
        | "epic"
      progress_track_type: "vow" | "journey" | "combat"
      second_screen_options: "character" | "track" | "note_image"
      track_type: "progress_track" | "scene_challenge" | "clock"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

