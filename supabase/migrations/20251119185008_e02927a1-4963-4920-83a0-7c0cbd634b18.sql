-- Grant admin role to officialanilfullwariya@gmail.com
INSERT INTO public.user_roles (user_id, role) 
VALUES ('4977566c-1263-40b0-a13e-3a8851095437', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;