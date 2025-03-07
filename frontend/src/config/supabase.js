import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lyyfjeijnwnyxgkqlnlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5eWZqZWlqbndueXhna3FsbmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTg3NzYsImV4cCI6MjA1Njg3NDc3Nn0.s92Kiy2Y7GjzTL-vDYeHI_oub8CR8Gw9i6htkqw5hJ8';

export const supabase = createClient(supabaseUrl, supabaseKey); 