export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'rider' | 'driver' | 'support_worker' | 'admin'
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          role?: 'rider' | 'driver' | 'support_worker' | 'admin'
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'rider' | 'driver' | 'support_worker' | 'admin'
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          address: string | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          medical_notes: string | null
          accessibility_requirements: string[] | null
          profile_image_url: string | null
          is_verified: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          phone?: string | null
          address?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_notes?: string | null
          accessibility_requirements?: string[] | null
          profile_image_url?: string | null
          is_verified?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          address?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_notes?: string | null
          accessibility_requirements?: string[] | null
          profile_image_url?: string | null
          is_verified?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          rider_id: string
          pickup_address: string
          dropoff_address: string
          pickup_time: string
          dropoff_time: string | null
          vehicle_features: string[] | null
          support_workers_count: number | null
          fare_estimate: number
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          booking_type: 'on_demand' | 'scheduled' | 'advance' | null
          lead_time_hours: number | null
          time_multiplier: number | null
          special_requirements: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          rider_id: string
          pickup_address: string
          dropoff_address: string
          pickup_time: string
          dropoff_time?: string | null
          vehicle_features?: string[] | null
          support_workers_count?: number | null
          fare_estimate: number
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          booking_type?: 'on_demand' | 'scheduled' | 'advance' | null
          lead_time_hours?: number | null
          time_multiplier?: number | null
          special_requirements?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          rider_id?: string
          pickup_address?: string
          dropoff_address?: string
          pickup_time?: string
          dropoff_time?: string | null
          vehicle_features?: string[] | null
          support_workers_count?: number | null
          fare_estimate?: number
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          booking_type?: 'on_demand' | 'scheduled' | 'advance' | null
          lead_time_hours?: number | null
          time_multiplier?: number | null
          special_requirements?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      stops: {
        Row: {
          id: string
          booking_id: string
          order_index: number
          stop_address: string
          latitude: number
          longitude: number
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          order_index: number
          stop_address: string
          latitude: number
          longitude: number
          created_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          order_index?: number
          stop_address?: string
          latitude?: number
          longitude?: number
          created_at?: string | null
        }
      }
      support_workers: {
        Row: {
          id: string
          user_id: string
          availability: Json | null
          bio: string | null
          verified: boolean | null
          certifications: string[] | null
          dbs_uploaded: boolean | null
          dbs_expiry_date: string | null
          hourly_rate: number | null
          specializations: string[] | null
          languages: string[] | null
          experience_years: number | null
          current_location_lat: number | null
          current_location_lng: number | null
          last_location_update: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          availability?: Json | null
          bio?: string | null
          verified?: boolean | null
          certifications?: string[] | null
          dbs_uploaded?: boolean | null
          dbs_expiry_date?: string | null
          hourly_rate?: number | null
          specializations?: string[] | null
          languages?: string[] | null
          experience_years?: number | null
          current_location_lat?: number | null
          current_location_lng?: number | null
          last_location_update?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          availability?: Json | null
          bio?: string | null
          verified?: boolean | null
          certifications?: string[] | null
          dbs_uploaded?: boolean | null
          dbs_expiry_date?: string | null
          hourly_rate?: number | null
          specializations?: string[] | null
          languages?: string[] | null
          experience_years?: number | null
          current_location_lat?: number | null
          current_location_lng?: number | null
          last_location_update?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      vehicles: {
        Row: {
          id: string
          driver_id: string
          make: string
          model: string
          year: number
          license_plate: string
          color: string
          features: string[] | null
          photo_url: string | null
          verified: boolean | null
          accessible_rating: number | null
          insurance_uploaded: boolean | null
          insurance_expiry_date: string | null
          mot_expiry_date: string | null
          passenger_capacity: number | null
          wheelchair_capacity: number | null
          current_location_lat: number | null
          current_location_lng: number | null
          last_location_update: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          driver_id: string
          make: string
          model: string
          year: number
          license_plate: string
          color: string
          features?: string[] | null
          photo_url?: string | null
          verified?: boolean | null
          accessible_rating?: number | null
          insurance_uploaded?: boolean | null
          insurance_expiry_date?: string | null
          mot_expiry_date?: string | null
          passenger_capacity?: number | null
          wheelchair_capacity?: number | null
          current_location_lat?: number | null
          current_location_lng?: number | null
          last_location_update?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          driver_id?: string
          make?: string
          model?: string
          year?: number
          license_plate?: string
          color?: string
          features?: string[] | null
          photo_url?: string | null
          verified?: boolean | null
          accessible_rating?: number | null
          insurance_uploaded?: boolean | null
          insurance_expiry_date?: string | null
          mot_expiry_date?: string | null
          passenger_capacity?: number | null
          wheelchair_capacity?: number | null
          current_location_lat?: number | null
          current_location_lng?: number | null
          last_location_update?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      trip_logs: {
        Row: {
          id: string
          booking_id: string
          driver_id: string | null
          vehicle_id: string | null
          support_worker_ids: string[] | null
          start_time: string | null
          end_time: string | null
          actual_duration: number | null
          actual_distance: number | null
          pickup_lat: number | null
          pickup_lng: number | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          route_data: Json | null
          driver_notes: string | null
          customer_rating: number | null
          driver_rating: number | null
          support_worker_rating: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          driver_id?: string | null
          vehicle_id?: string | null
          support_worker_ids?: string[] | null
          start_time?: string | null
          end_time?: string | null
          actual_duration?: number | null
          actual_distance?: number | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          route_data?: Json | null
          driver_notes?: string | null
          customer_rating?: number | null
          driver_rating?: number | null
          support_worker_rating?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          driver_id?: string | null
          vehicle_id?: string | null
          support_worker_ids?: string[] | null
          start_time?: string | null
          end_time?: string | null
          actual_duration?: number | null
          actual_distance?: number | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          route_data?: Json | null
          driver_notes?: string | null
          customer_rating?: number | null
          driver_rating?: number | null
          support_worker_rating?: number | null
          created_at?: string | null
        }
      }
      pricing_logs: {
        Row: {
          id: string
          booking_id: string
          calculated_fare: number
          breakdown_json: Json
          peak_multiplier: number | null
          duration_modifier: number | null
          base_fare: number
          distance_cost: number
          vehicle_features_cost: number | null
          support_workers_cost: number | null
          peak_time_surcharge: number | null
          booking_type_discount: number | null
          booking_type: 'on_demand' | 'scheduled' | 'advance' | null
          lead_time_hours: number | null
          is_estimated: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          calculated_fare: number
          breakdown_json: Json
          peak_multiplier?: number | null
          duration_modifier?: number | null
          base_fare: number
          distance_cost: number
          vehicle_features_cost?: number | null
          support_workers_cost?: number | null
          peak_time_surcharge?: number | null
          booking_type_discount?: number | null
          booking_type?: 'on_demand' | 'scheduled' | 'advance' | null
          lead_time_hours?: number | null
          is_estimated?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          calculated_fare?: number
          breakdown_json?: Json
          peak_multiplier?: number | null
          duration_modifier?: number | null
          base_fare?: number
          distance_cost?: number
          vehicle_features_cost?: number | null
          support_workers_cost?: number | null
          peak_time_surcharge?: number | null
          booking_type_discount?: number | null
          booking_type?: 'on_demand' | 'scheduled' | 'advance' | null
          lead_time_hours?: number | null
          is_estimated?: boolean | null
          created_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: 'booking_request' | 'trip_update' | 'payment' | 'system' | 'emergency'
          data: Json | null
          sent: boolean | null
          read: boolean | null
          created_at: string | null
          sent_at: string | null
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type?: 'booking_request' | 'trip_update' | 'payment' | 'system' | 'emergency'
          data?: Json | null
          sent?: boolean | null
          read?: boolean | null
          created_at?: string | null
          sent_at?: string | null
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: 'booking_request' | 'trip_update' | 'payment' | 'system' | 'emergency'
          data?: Json | null
          sent?: boolean | null
          read?: boolean | null
          created_at?: string | null
          sent_at?: string | null
          read_at?: string | null
        }
      }
      trip_tracking: {
        Row: {
          id: string
          trip_log_id: string | null
          lat: number
          lng: number
          speed_mph: number | null
          heading: number | null
          accuracy_meters: number | null
          timestamp: string | null
        }
        Insert: {
          id?: string
          trip_log_id?: string | null
          lat: number
          lng: number
          speed_mph?: number | null
          heading?: number | null
          accuracy_meters?: number | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          trip_log_id?: string | null
          lat?: number
          lng?: number
          speed_mph?: number | null
          heading?: number | null
          accuracy_meters?: number | null
          timestamp?: string | null
        }
      }
      certifications: {
        Row: {
          id: string
          support_worker_id: string
          certification_type: string
          certification_name: string
          issuing_authority: string
          issue_date: string
          expiry_date: string | null
          certificate_url: string | null
          verified: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          support_worker_id: string
          certification_type: string
          certification_name: string
          issuing_authority: string
          issue_date: string
          expiry_date?: string | null
          certificate_url?: string | null
          verified?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          support_worker_id?: string
          certification_type?: string
          certification_name?: string
          issuing_authority?: string
          issue_date?: string
          expiry_date?: string | null
          certificate_url?: string | null
          verified?: boolean | null
          created_at?: string | null
        }
      }
      vehicle_insurance: {
        Row: {
          id: string
          vehicle_id: string
          policy_number: string
          provider: string
          coverage_type: string
          start_date: string
          end_date: string
          document_url: string | null
          verified: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id: string
          policy_number: string
          provider: string
          coverage_type: string
          start_date: string
          end_date: string
          document_url?: string | null
          verified?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string
          policy_number?: string
          provider?: string
          coverage_type?: string
          start_date?: string
          end_date?: string
          document_url?: string | null
          verified?: boolean | null
          created_at?: string | null
        }
      }
      payment_transactions: {
        Row: {
          id: string
          booking_id: string
          stripe_payment_intent_id: string | null
          amount_gbp: number
          currency: string | null
          status: string
          payment_method: string | null
          transaction_fee: number | null
          net_amount: number | null
          processed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          stripe_payment_intent_id?: string | null
          amount_gbp: number
          currency?: string | null
          status?: string
          payment_method?: string | null
          transaction_fee?: number | null
          net_amount?: number | null
          processed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          stripe_payment_intent_id?: string | null
          amount_gbp?: number
          currency?: string | null
          status?: string
          payment_method?: string | null
          transaction_fee?: number | null
          net_amount?: number | null
          processed_at?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      dashboard_overview: {
        Row: {
          today_bookings: number | null
          week_bookings: number | null
          month_bookings: number | null
          active_trips: number | null
          total_riders: number | null
          total_drivers: number | null
          total_support_workers: number | null
          active_vehicles: number | null
          avg_rating_30d: number | null
          today_revenue: number | null
          month_revenue: number | null
          emergency_alerts_today: number | null
        }
      }
      trip_analytics: {
        Row: {
          trip_date: string | null
          total_trips: number | null
          completed_trips: number | null
          cancelled_trips: number | null
          avg_duration_minutes: number | null
          avg_distance_miles: number | null
          avg_customer_rating: number | null
          avg_driver_rating: number | null
          avg_support_rating: number | null
          trips_with_support: number | null
          avg_support_workers: number | null
        }
      }
      user_analytics: {
        Row: {
          role: string | null
          total_users: number | null
          verified_users: number | null
          active_users: number | null
          new_users_30d: number | null
          new_users_7d: number | null
        }
      }
      revenue_analytics: {
        Row: {
          transaction_date: string | null
          total_transactions: number | null
          successful_transactions: number | null
          failed_transactions: number | null
          total_revenue: number | null
          total_fees: number | null
          net_revenue: number | null
          avg_transaction_amount: number | null
        }
      }
    }
    Functions: {
      get_user_stats: {
        Args: {
          user_role?: string
        }
        Returns: {
          role: string
          total_count: number
          verified_count: number
          active_count: number
          new_this_month: number
        }[]
      }
      get_booking_stats: {
        Args: {
          days_back?: number
        }
        Returns: {
          total_bookings: number
          completed_bookings: number
          cancelled_bookings: number
          pending_bookings: number
          avg_fare: number
          total_revenue: number
        }[]
      }
    }
    Enums: {
      user_role: 'rider' | 'driver' | 'support_worker' | 'admin'
      booking_status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
      booking_type: 'on_demand' | 'scheduled' | 'advance'
      notification_type: 'booking_request' | 'trip_update' | 'payment' | 'system' | 'emergency'
    }
  }
}