USE shifa_ai;

ALTER TABLE query_logs ADD COLUMN triage_level VARCHAR(20) NULL AFTER response_time_ms;
