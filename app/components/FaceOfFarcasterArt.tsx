import useAnimationFrames from "@/hooks/useAnimationFrames";

export default function FaceOfFarcasterArt() {
  const { containerRef } = useAnimationFrames("/farcaster-logo.png");
  return (
    <main className="relative flex justify-center items-center w-full min-h-screen text-white">

      {/* Three.js Animation container */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0"></div>
    </main>
  )
}