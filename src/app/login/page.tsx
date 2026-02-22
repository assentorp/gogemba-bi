'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            kyodo <span className="font-normal text-stone-500 dark:text-stone-400">lab</span>
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            Enter password to continue
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-white/[0.10] bg-white dark:bg-[#161618] text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
