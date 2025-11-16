-- Insert admin role for the existing user
-- This will grant admin access to hlal19946@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('5cfea5cb-9c79-4580-8854-34cc2a77e57e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Optional: Add the second user as admin too if needed
-- Uncomment the line below to make officialanilfullwariya@gmail.com an admin as well
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('4977566c-1263-40b0-a13e-3a8851095437', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;