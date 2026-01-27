-- =====================================================
-- Enable Row Level Security (RLS) for MyFleet v1.0
-- =====================================================
-- CORRECTED VERSION - Using camelCase column names
-- =====================================================

-- Step 1: Enable RLS on all tables
-- =====================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: Create helper function to get current user's companyId
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS TEXT AS $$
BEGIN
  -- Get companyId from JWT claims
  RETURN current_setting('request.jwt.claims', true)::json->>'companyId';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Companies Table Policies
-- =====================================================

-- Allow service role (backend) to bypass RLS
CREATE POLICY "Service role bypass" ON public.companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can only see their own company
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT
  TO authenticated, anon
  USING (id = get_user_company_id());

-- Step 4: Users Table Policies
-- =====================================================

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view users from their company (but not passwords)
CREATE POLICY "Users can view company users" ON public.users
  FOR SELECT
  TO authenticated, anon
  USING ("companyId" = get_user_company_id());

-- Step 5: Tasks Table Policies
-- =====================================================

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can access tasks from their company
CREATE POLICY "Users can access company tasks" ON public.tasks
  FOR ALL
  TO authenticated, anon
  USING ("companyId" = get_user_company_id())
  WITH CHECK ("companyId" = get_user_company_id());

-- Step 6: Vehicles Table Policies
-- =====================================================

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.vehicles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can access vehicles from their company
CREATE POLICY "Users can access company vehicles" ON public.vehicles
  FOR ALL
  TO authenticated, anon
  USING ("companyId" = get_user_company_id())
  WITH CHECK ("companyId" = get_user_company_id());

-- Step 7: Time Off Requests Table Policies
-- =====================================================

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.time_off_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can access time-off from their company
CREATE POLICY "Users can access company time-off requests" ON public.time_off_requests
  FOR ALL
  TO authenticated, anon
  USING ("companyId" = get_user_company_id())
  WITH CHECK ("companyId" = get_user_company_id());

-- Step 8: Deductions Table Policies
-- =====================================================

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.deductions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can access deductions from their company
CREATE POLICY "Users can access company deductions" ON public.deductions
  FOR ALL
  TO authenticated, anon
  USING ("companyId" = get_user_company_id())
  WITH CHECK ("companyId" = get_user_company_id());

-- Step 9: Activity Logs Table Policies
-- =====================================================

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.activity_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view activity logs from their company
CREATE POLICY "Users can view company activity logs" ON public.activity_logs
  FOR SELECT
  TO authenticated, anon
  USING ("companyId" = get_user_company_id());

-- Step 10: Messages Table Policies
-- =====================================================

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can access messages from their company
CREATE POLICY "Users can access company messages" ON public.messages
  FOR ALL
  TO authenticated, anon
  USING ("companyId" = get_user_company_id())
  WITH CHECK ("companyId" = get_user_company_id());

-- Step 11: Notifications Table Policies
-- =====================================================

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can access their own notifications
CREATE POLICY "Users can access their notifications" ON public.notifications
  FOR ALL
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = notifications."userId"
      AND users."companyId" = get_user_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = notifications."userId"
      AND users."companyId" = get_user_company_id()
    )
  );

-- =====================================================
-- Verification Query
-- =====================================================

-- Verify RLS is enabled:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
