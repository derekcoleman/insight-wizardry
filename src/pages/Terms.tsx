import React from "react";

const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
        <p className="mb-4">
          Permission is granted to temporarily access the materials (information or software) on our website for personal,
          non-commercial transitory viewing only.
        </p>
        <p className="mb-4">This license shall automatically terminate if you violate any of these restrictions and may be
          terminated by us at any time.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
        <p className="mb-4">
          The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and
          hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of
          merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation
          of rights.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
        <p className="mb-4">
          In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss
          of data or profit, or due to business interruption) arising out of the use or inability to use the materials on
          our website.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Revisions and Errata</h2>
        <p className="mb-4">
          The materials appearing on our website could include technical, typographical, or photographic errors. We do not
          warrant that any of the materials on our website are accurate, complete, or current.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Links</h2>
        <p className="mb-4">
          We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such
          linked site. The inclusion of any link does not imply endorsement by us of the site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Modifications</h2>
        <p className="mb-4">
          We may revise these terms of service for our website at any time without notice. By using this website, you are
          agreeing to be bound by the then current version of these terms of service.
        </p>
      </section>

      <footer className="text-sm text-gray-600">
        Last updated: January 2025
      </footer>
    </div>
  );
};

export default Terms;