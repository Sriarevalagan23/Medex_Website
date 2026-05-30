import { supabase } from './supabase';

const BASE_URL = 'https://medex-ml-models.onrender.com';

export interface PredictResponse {
  confidence: number;
  description: string;
  disclaimer: string;
  risk: string;
  success: boolean;
  tips: string[];
  title: string;
}

export interface BPInputParams {
  age: number;
  gender: number;
  height: number;
  weight: number;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  smoking: number;
  stress_level: number;
  sleep_hours: number;
  physical_activity: number;
}

export interface DiabetesInputParams {
  age: number;
  glucose: number;
  blood_pressure: number;
  height: number;
  weight: number;
  pregnancies: number;
  family_history: boolean;
}

export interface HeartInputParams {
  age: number;
  gender: number;
  chest_pain_type: number;
  blood_pressure: number;
  cholesterol: number;
  heart_rate: number;
  exercise_chest_pain: number;
  diabetes: number;
  smoking: number;
}

async function postRequest<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'API returned failure status');
  return data as T;
}

export async function predictBP(params: BPInputParams): Promise<PredictResponse> {
  return postRequest<PredictResponse>('/predict-bp', params);
}

export async function predictDiabetes(params: DiabetesInputParams): Promise<PredictResponse> {
  return postRequest<PredictResponse>('/predict-diabetes', params);
}

export async function predictHeart(params: HeartInputParams): Promise<PredictResponse> {
  return postRequest<PredictResponse>('/predict-heart', params);
}

export async function savePredictionResult(
  modelType: 'bp' | 'diabetes' | 'heart',
  inputData: unknown,
  predictionOutput: PredictResponse,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not logged in');

  const { error } = await supabase.from('prediction_results').insert({
    user_id: user.id,
    model_type: modelType,
    input_data: inputData,
    prediction_output: predictionOutput,
  });
  if (error) throw error;
}