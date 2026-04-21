-- Rename weekly_goal to monthly_goal. User enters a monthly total,
-- UI divides it across the month's work days.
ALTER TABLE targets RENAME COLUMN weekly_goal TO monthly_goal;
