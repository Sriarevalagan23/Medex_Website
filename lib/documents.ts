import { supabase } from './supabase';

export interface UserDocument {
  id: string;
  user_id: string;
  report_category: string;
  report_name: string;
  hospital_name?: string;
  report_date?: string;
  additional_notes?: string;
  file_url: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

function decodeBase64(base64: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i += 1) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') bufferLength -= 1;
  if (base64[base64.length - 2] === '=') bufferLength -= 1;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
  }
  return bytes;
}

export async function saveUserDocument(document: Omit<UserDocument, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('user_documents').insert([document]).select().single();
  if (error) throw error;
  return data as UserDocument;
}

export async function getUserDocuments(userId: string) {
  const { data, error } = await supabase.from('user_documents').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as UserDocument[];
}

export async function deleteUserDocument(documentId: string) {
  const { error } = await supabase.from('user_documents').delete().eq('id', documentId);
  if (error) throw error;
  return true;
}

export async function uploadDocumentFile(
  userId: string,
  file: File,
  preGeneratedFilePath?: string,
) {
  const timestamp = Date.now();
  const safeName = file.name || 'document';
  const cleanFileName = safeName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = preGeneratedFilePath || `${userId}/${timestamp}_${cleanFileName}`;

  const bytes = decodeBase64(await fileToBase64(file));
  const { error } = await supabase.storage.from('user_docs').upload(filePath, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('user_docs').getPublicUrl(filePath);
  return { filePath, publicUrl: data?.publicUrl || '' };
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}