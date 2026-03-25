export type Profile = {
  id: string; // from auth.users
  role: 'client' | 'stringer';
  first_name: string;
  last_name: string;
  phone?: string;
  email: string;
  club?: string;
  avatar_url?: string;
  notification_preferences: {
    sms: boolean;
    email: boolean;
  };
  created_at: string;
};

export type StringerProfile = {
  id: string; // references Profile.id
  type: 'independant' | 'boutique';
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
  opening_hours: any; 
  payment_methods: string[];
  sports: ('badminton' | 'tennis')[];
};
