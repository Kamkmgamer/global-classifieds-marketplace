'use client';

import { SignUp } from '@clerk/nextjs';

export default function RegisterCatchAll() {
  return (
    <div className="container mx-auto flex max-w-md items-center justify-center px-4 py-12">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
        routing="path"
        path="/register"
        signInUrl="/login"
        afterSignUpUrl="/browse"
      />
    </div>
  );
}

