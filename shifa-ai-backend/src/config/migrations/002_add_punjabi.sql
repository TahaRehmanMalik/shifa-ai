USE shifa_ai;

ALTER TABLE diseases
  ADD COLUMN symptoms_pa TEXT NULL AFTER symptoms_ur,
  ADD COLUMN root_cause_pa TEXT NULL AFTER root_cause_ur,
  ADD COLUMN diet_plan_pa TEXT NULL AFTER diet_plan_ur,
  ADD COLUMN medicine_class_pa TEXT NULL AFTER medicine_class_ur;
