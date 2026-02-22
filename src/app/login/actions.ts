'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHmac } from 'crypto';

function generateToken(password: string): string {
  const secret = process.env.AUTH_SECRET || 'fallback-secret';
  return createHmac('sha256', secret).update(password).digest('hex');
}

export async function login(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const password = formData.get('password') as string;
  const expected = process.env.AUTH_PASSWORD;

  if (!expected) {
    return { error: 'Auth not configured. Set AUTH_PASSWORD env variable.' };
  }

  if (password !== expected) {
    return { error: 'Invalid password.' };
  }

  const token = generateToken(password);
  const cookieStore = await cookies();

  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect('/');
}
