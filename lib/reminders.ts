import { supabase } from './supabase';

export type Frequency = string;
export type MealTime = 'Before meal' | 'After meal' | 'Any time';

export interface Reminder {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: Frequency;
  mealTime: MealTime;
  active: boolean;
}

type ReminderRow = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  meal_time: string;
  active: boolean;
};

function mapRowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    time: row.time,
    frequency: row.frequency as Frequency,
    mealTime: row.meal_time as MealTime,
    active: row.active,
  };
}

export async function getReminders(userId: string): Promise<Reminder[]> {
  const { data, error } = await supabase.from('medicine_reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRowToReminder);
}

export async function createReminder(reminder: Omit<Reminder, 'id'>, userId: string): Promise<Reminder> {
  const { data, error } = await supabase.from('medicine_reminders').insert([
    {
      user_id: userId,
      name: reminder.name,
      dosage: reminder.dosage,
      time: reminder.time,
      frequency: reminder.frequency,
      meal_time: reminder.mealTime,
      active: reminder.active,
    },
  ]).select().single();
  if (error) throw error;
  return mapRowToReminder(data);
}

export async function updateReminder(id: string, updates: Partial<Omit<Reminder, 'id'>>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.dosage !== undefined) dbUpdates.dosage = updates.dosage;
  if (updates.time !== undefined) dbUpdates.time = updates.time;
  if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
  if (updates.mealTime !== undefined) dbUpdates.meal_time = updates.mealTime;
  if (updates.active !== undefined) dbUpdates.active = updates.active;

  const { error } = await supabase.from('medicine_reminders').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase.from('medicine_reminders').delete().eq('id', id);
  if (error) throw error;
}