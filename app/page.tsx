"use client"

import { useCallback, useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { useViewer } from "./providers/FrameContextProvider";
import { BaseError, useAccount, useChainId, useConnect, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { fafaAbi, fafaAddress } from "@/lib/fafa";
import { base } from "viem/chains";
import sdk from "@farcaster/frame-sdk";
import useAnimationFrames from "@/hooks/useAnimationFrames";
import { ExternalLink, Leaf, LockKeyhole, Rocket } from "lucide-react";
import { fafaHTMLFile } from "./components/fafaFile";
import { config } from "@/lib/config";
import Loading from "./components/svg/Loading";

export default function Home() {
  const [showError, setShowError] = useState(false);
  const [showMintSuccess, setShowMintSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [animationURIs, setAnimationURIs] = useState<string>("");
  const [showTermOfMint, setShowTermOfMint] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);

  const { pfpUrl, username, fid, added } = useViewer();
  const { containerRef } = useAnimationFrames(
    pfpUrl as string,
  );

  const chainId = useChainId();
  const { connect } = useConnect()
  const { address, isConnected } = useAccount();
  const { data: fafaHash, error: fafaError, isPending: isFafaPending, writeContract: fafaWrite } = useWriteContract();

  const { data: tokenId } = useReadContract({
    address: fafaAddress as `0x${string}`,
    abi: fafaAbi,
    chainId: base.id,
    functionName: "totalSupply",
  });

  const { data: fafaBalance } = useReadContract({
    address: fafaAddress as `0x${string}`,
    abi: fafaAbi,
    chainId: base.id,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: fafaHash,
  });

  // Basescan
  const linkToBaseScan = useCallback((hash?: string) => {
    if (hash) {
      sdk.actions.openUrl(`https://basescan.org/tx/${hash}`);
    }
  }, []);

  // Opensea
  const linkToOpensea = useCallback((tokenId?: number) => {
    if (tokenId) {
      sdk.actions.openUrl(`https://opensea.io/item/base/${fafaAddress}/${tokenId + 1}}`);
    }
  }, []);

  // Animation Page
  const linkToAnimationPage = useCallback((animationURIs?: string) => {
    if (animationURIs) {
      sdk.actions.openUrl(animationURIs);
    }
  }, []);

  // Subscribe to Frames
  useEffect(() => {
    if (!added) {
      sdk.actions.addFrame()
    }
  }, [added])

  useEffect(() => {
    if (isConfirmed) {
      setShowMintSuccess(true);
      setShowLoadingAnimation(false);
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (fafaError) {
      setShowError(true);
    }
  }, [fafaError]);

  useEffect(() => {
    if (fafaBalance as bigint > BigInt(0)) {
      setShowTermOfMint(true);
    }
  }, [fafaBalance]);

  useEffect(() => {
    if (isUploading || isFafaPending || isConfirming) {
      setShowLoadingAnimation(true);
    }
  }, [isConfirming, isFafaPending, isUploading]);

  const getHTMLHash = async () => {

    const fileHTML = fafaHTMLFile(username as string, pfpUrl as string)

    const formData = new FormData()
    const blob = new Blob([fileHTML], { type: 'text/html' });
    formData.append("file", blob, `${fid}.html` );
    setIsUploading(true) // Set uploading state to true

    try {
      const response = await fetch("/api/pinata-upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        return data.ipfsHash; // Set the IPFS hash on success
      } else {
        console.log({ message: 'Something went wrong', type: 'error' });
      }
    } catch (err) {
      console.log({ message: 'Error uploading file', type: 'error', error: err });
    }
  }

  const handleMint = async () => {

    try {

      const animationHash = await getHTMLHash();
      setIsUploading(false)

      if (animationHash) {

        fafaWrite({
          abi: fafaAbi,
          chainId: base.id,
          address: fafaAddress as `0x${string}`,
          functionName: "mint",
          args: [`ipfs://${animationHash}`, username as string, BigInt(fid)],
        });

        const animationUrl = `https://ipfs.io/ipfs/${animationHash}`
        setAnimationURIs(animationUrl)

      }

    } catch (error) {
      console.error("Error during minting or sharing:", (error as Error).message);
    }
  };

  return (
    <main className="relative flex justify-center items-center w-full min-h-screen text-white">

      {/* Three.js Animation container */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0"></div>

      {/* Transaction Success */}
      {showMintSuccess && (
        <div
          onClick={() => setShowMintSuccess(false)}
          className="absolute top-1/4 mx-auto flex items-center justify-center z-10 w-full max-w-[400px] max-h-[400px] rounded-xl"
        >
          <div className="relative flex flex-col bg-[#17101f] text-slate-300 rounded-2xl shadow-lg text-center">
            <p className="text-center p-4">🎉Mint Success🎉</p>
            <div className="w-full max-w-[384px] max-h-[384px] rounded-2xl">
              <iframe
                src={animationURIs || "https://ipfs.io/ipfs/bafkreieej55fcip6qu635qgnx2unz5ps7uwok7eqklo75yv3f2tdocowg4"}
                allow="clipboard-write"
                className="w-full max-h-[300px]"
              ></iframe>
            </div>
            <div className="w-full p-4 justify-center items-center flex flex-row space-x-4">
              <button
                className="w-full p-3 rounded-xl bg-gradient-to-r from-[#201029] to-[#290f37] shadow-lg disabled:cursor-not-allowed"
                onClick={() => linkToBaseScan(fafaHash)}
              >
                Proof
              </button>
              <button
                className="w-full p-3 rounded-xl bg-gradient-to-r from-[#290f37] to-[#201029] shadow-lg disabled:cursor-not-allowed"
                onClick={() => linkToOpensea(Number(tokenId) + 1)}
              >
                Opensea
              </button>
              <button
                className="w-16 p-3 rounded-xl bg-gradient-to-r from-[#290f37] to-[#201029] shadow-lg disabled:cursor-not-allowed"
                onClick={() => linkToAnimationPage(animationURIs)}
              >
                <ExternalLink className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Error */}
      {showError && fafaError && (
        <div
          onClick={() => setShowError(false)}
          className="absolute top-1/4 mx-auto flex items-center justify-center p-4 z-10 w-full max-w-[90%] md:max-w-[384px] max-h-[384px] rounded-xl"
        >
          <div className="relative bg-[#230b36cc] bg-opacity-25 backdrop-blur-[10px] text-slate-300 p-6 rounded-2xl shadow-lg text-center">
            <p className="text-center p-4">
              Error: {(fafaError as BaseError).shortMessage || fafaError.message}
            </p>
          </div>
        </div>
      )}

      {/* Term of Mint */}
      {showTermOfMint && (
        <div
          onClick={() => setShowTermOfMint(false)}
          className="absolute top-1/4 mx-auto flex items-center justify-center p-4 z-10 w-full max-w-[90%] md:max-w-[384px] max-h-[384px] rounded-xl"
        >
          <div className="relative bg-[#230b36cc] bg-opacity-25 backdrop-blur-[10px] text-slate-300 p-6 rounded-2xl shadow-lg text-center">
            <p className="text-center p-4">
              One FID or one Address only one FAFA can be Minted.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {showLoadingAnimation && (
        <div className="absolute bottom-16 w-full flex items-center justify-center z-10"
        >
          <div className="relative">
            <Loading className="w-40 h-40" />
          </div>
        </div>
      )}

      {/* Live Badge */}
      <div className="absolute backdrop-blur-lg rounded-2xl top-5 right-5 w-32 h-16 mx-auto flex flex-row space-x-4 items-center justify-center z-10"
      >
        <span className="relative bg-cyan-500 w-4 h-4 rounded-full animate-ping" />
        <span className=" font-extrabold font-sans">L I V E</span>
      </div>

      {/* Navbar Bottom */}
      <div className="fixed flex justify-center items-center w-full h-20 mx-auto z-20 bottom-0 rounded-t-2xl bg-[#17101f]">
        <div className="absolute flex justify-center items-center p-4 bottom-0 max-w-52 h-28 mx-auto rounded-t-full bg-[#17101f]">
          {isConnected && chainId === base.id ? (
            <Button
              onClick={handleMint}
              disabled={
                !isConnected ||
                isUploading ||
                isFafaPending ||
                isConfirming ||
                showTermOfMint ||
                chainId !== base.id ||
                fafaBalance as bigint > BigInt(0)
              }
              className="w-full p-4"
            >
              {isUploading ? <Rocket className="w-8 h-8 animate-bounce" />
                : isFafaPending
                  ? <Rocket className="w-8 h-8 animate-bounce" />
                  : isConfirming
                    ? <Rocket className="w-8 h-8 animate-bounce" />
                    : <Leaf className="w-14 h-14" />}
            </Button>
          ) : (
            <Button
              className="w-full p-4"
              //onClick={getHTMLHash}
              onClick={() => connect({ connector: config.connectors[0] })}
            >
              <LockKeyhole className="w-14 h-14" />
            </Button>
          )}
        </div>
      </div>

    </main>

  )
}
