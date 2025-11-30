'use client';

import { SignIn } from '@clerk/nextjs';

export default function LoginCatchAll() {
  return (
    <div className="container mx-auto flex max-w-md items-center justify-center px-4 py-12">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
        routing="path"
        path="/login"
        signUpUrl="/register"
        afterSignInUrl="/browse"
      />
    </div>
  );
}

