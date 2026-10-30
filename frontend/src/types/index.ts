export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface DetectionRecord {
  id: number;
  user_id: number;
  original_image_path: string;
  visualization_image_path?: string;
  prediction: 'hazard_detected' | 'normal' | 'leakage' | 'no_leakage';
  confidence: number;
  mode: 'trained_model' | 'demo_mode';
  visualization_type: string;
  severity?: 'High' | 'Medium' | 'Low' | 'None';
  alarm_recommended: boolean;
  alarm_activated: boolean;
  model_version: string;
  notes?: string;
  timestamp: string;
}

export interface DashboardStats {
  total_images: number;
  leakage_predictions: number;
  safe_predictions: number;
  latest_detection: DetectionRecord | null;
  alarm_status: 'active' | 'silent' | 'standby';
  model_status: string;
  detections_over_time: Array<{
    date: string;
    total: number;
    leakage: number;
    safe: number;
  }>;
  prediction_breakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface ModelStatus {
  status: string;
  model_version: string;
  is_custom_trained: boolean;
  last_trained_at?: string;
  training_metrics?: any;
}

export interface DatasetValidation {
  is_valid: boolean;
  classes_found: string[];
  train_counts: Record<string, number>;
  val_counts: Record<string, number>;
  test_counts: Record<string, number>;
  total_images: number;
  message: string;
}

export interface TrainingStatus {
  job_id?: string;
  status: string;
  current_epoch: number;
  total_epochs: number;
  train_loss?: number;
  val_loss?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  confusion_matrix?: number[][];
  error_message?: string;
}
