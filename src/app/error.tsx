"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card empty">
      <h1>Oups, un problème est survenu</h1>
      <p>Réessayez dans un instant. Si cela continue, signalez-le à l&apos;équipe.</p>
      <button className="btn" onClick={reset}>
        Réessayer
      </button>
    </div>
  );
}
