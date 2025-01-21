import React from "react";

const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing and using Standup Notez at standupnotez.com, you accept and agree to be bound by the terms and provisions of this agreement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
        <p className="mb-4">
          Permission is granted to use Standup Notez services for managing and organizing your team's standup meetings and notes, subject to these terms and conditions.
        </p>
        <p className="mb-4">This license shall automatically terminate if you violate any of these restrictions and may be
          terminated by Standup Notez at any time.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
        <p className="mb-4">
          The services provided by Standup Notez are provided on an 'as is' basis. We make no warranties, expressed or implied, and
          hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of
          merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation
          of rights.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
        <p className="mb-4">
          In no event shall Standup Notez or our suppliers be liable for any damages (including, without limitation, damages for loss
          of data or profit, or due to business interruption) arising out of the use or inability to use our services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
        <p className="mb-4">
          You retain all rights to the standup notes and content you create using Standup Notez. By using our service, you grant us
          the right to store, process, and display your content solely for the purpose of providing and improving our services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Service Modifications</h2>
        <p className="mb-4">
          Standup Notez reserves the right to modify, suspend, or discontinue any part of our services at any time. We will make
          reasonable efforts to notify users of significant changes that may affect their use of the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Updates to Terms</h2>
        <p className="mb-4">
          We may revise these terms of service at any time without notice. By continuing to use Standup Notez, you are
          agreeing to be bound by the then-current version of these terms of service.
        </p>
      </section>

      <footer className="text-sm text-gray-600">
        Last updated: January 2025
      </footer>
    </div>
  );
};

export default Terms;