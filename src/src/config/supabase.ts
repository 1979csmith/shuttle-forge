// Supabase Configuration
// Replace these with your actual Supabase project values

export const SUPABASE_CONFIG = {
  // Get these from your Supabase project settings:
  // 1. Go to your Supabase project dashboard
  // 2. Click on "Settings" → "API"
  // 3. Copy the "Project URL" and "anon public" key
  
  url: import.meta.env.VITE_SUPABASE_URL || 'your_supabase_project_url_here',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here'
}

// Instructions for setup:
// 1. Create a .env.local file in your project root
// 2. Add your Supabase credentials:
//    VITE_SUPABASE_URL=https://your-project.supabase.co
//    VITE_SUPABASE_ANON_KEY=your-anon-key-here
// 3. Restart your development server
