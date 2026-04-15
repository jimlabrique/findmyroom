export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          title: string;
          rent_eur: number;
          city: string;
          available_rooms: number;
          available_from: string;
          housing_description: string;
          flatshare_vibe: string;
          photo_urls: string[];
          photo_captions: string[];
          contact_whatsapp: string | null;
          contact_email: string | null;
          charges_eur: number | null;
          lease_type: string | null;
          min_duration_months: number | null;
          status: "active" | "paused" | "archived";
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          title: string;
          rent_eur: number;
          city: string;
          available_rooms: number;
          available_from: string;
          housing_description: string;
          flatshare_vibe: string;
          photo_urls?: string[];
          photo_captions?: string[];
          contact_whatsapp?: string | null;
          contact_email?: string | null;
          charges_eur?: number | null;
          lease_type?: string | null;
          min_duration_months?: number | null;
          status?: "active" | "paused" | "archived";
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          rent_eur?: number;
          city?: string;
          available_rooms?: number;
          available_from?: string;
          housing_description?: string;
          flatshare_vibe?: string;
          photo_urls?: string[];
          photo_captions?: string[];
          contact_whatsapp?: string | null;
          contact_email?: string | null;
          charges_eur?: number | null;
          lease_type?: string | null;
          min_duration_months?: number | null;
          status?: "active" | "paused" | "archived";
          expires_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_events: {
        Row: {
          id: string;
          listing_id: string;
          event_type: "view_listing" | "click_contact";
          source: string;
          viewer_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          event_type: "view_listing" | "click_contact";
          source?: string;
          viewer_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_events_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_events_viewer_user_id_fkey";
            columns: ["viewer_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
