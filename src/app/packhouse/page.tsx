'use client';

export default function PackhousePage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Packhouse Data Entry</h1>
      <p className="text-lg text-center max-w-2xl mx-auto mb-6">
        This page will allow you to log packhouse processing data, including reject types and weights.
      </p>
      <div className="flex justify-center space-x-4">
        <a href="/dashboard" className="btn">Back to Dashboard</a>
      </div>
    </div>
  );
}