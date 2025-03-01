import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Optional: Run on Edge for faster response

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creator = searchParams.get('q');

  if (!creator) {
    return NextResponse.json(
      { error: 'Creator query parameter is required' },
      { status: 400 }
    );
  }

  const apiFidUrl = `https://fnames.farcaster.xyz/transfers/current?name=${creator}`;

  // Fetch FID by creator name
  const creatorFid = await fetch(apiFidUrl);
  if (!creatorFid.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch data from the API' },
      { status: creatorFid.status }
    );
  }

  const data = await creatorFid.json();
  const fid = data?.transfer?.to;

  if (!fid) {
    return NextResponse.json(
      { error: 'FID not found in the API response' },
      { status: 404 }
    );
  }

  const apiPfpUrl = `https://hub.pinata.cloud/v1/userDataByFid?fid=${fid}`;

  // Fetch creator PFP
  const creatorPfp = await fetch(apiPfpUrl);
  if (!creatorPfp.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch data from the API' },
      { status: creatorPfp.status }
    );
  }

  const userData = await creatorPfp.json()

  // Initialize extracted data fields
  //let name = ""
  //let fname = ""
  //let bio = ""
  let pfp = ""

  // Extract relevant fields
  for (const message of userData.messages) {
    const { type, value } = message.data.userDataBody
    //if (type === "USER_DATA_TYPE_DISPLAY") name = value
    //if (type === "USER_DATA_TYPE_USERNAME") fname = value
    //if (type === "USER_DATA_TYPE_BIO") bio = value
    if (type === "USER_DATA_TYPE_PFP") pfp = value
  }

  // Simple OG image with the PFP
  const image = (
    <div
      style={{
        display: 'flex',
        width: '1200px',
        height: '630px',
        backgroundColor: '#ebedeb',
        backgroundImage: 'radial-gradient(#cdd1ce 5%, transparent 25%)',
        backgroundSize: '16px 16px',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >

      {/* Live Status */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "21.5%", // Aligned with info box right margin
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          padding: "12px 24px",
          alignItems: "center",
          gap: "12px",
          borderRadius: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "30px",
            height: "30px",
            padding: "9px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "15px",
            background: "rgba(255, 255, 255, 0.30)",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "6px",
              backgroundColor: 'green',
            }}
          />
        </div>
        <span
          style={{
            color: 'white',
            fontSize: "36px",
          }}
        >
          LIVE
        </span>
      </div>

      {/* Transparent Box */}
      <div style={{
        position: "absolute",
        bottom: "20%",
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        padding: '30px',
        borderRadius: '16px',
      }}>

        {/* Render the PFP */}
        <img
          src={pfp || "https://faceoffarcasterart.vercel.app/icon.jpg"}
          alt="Profile Picture"
          width={200}
          height={200}
          style={{ borderRadius: '16px' }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
            marginLeft: '30px',
          }}
        >
          <span style={{ fontSize: '48px' }}>Just Minted FAFA!</span>
          <span style={{ fontSize: '24px', marginTop: '16px' }}>Hi&apos; 👋 I&apos;am @{creator}</span>
          <span style={{ fontSize: '24px' }}>I just minted Face of Farcaster Art </span>
          <span style={{ fontSize: '24px' }}>web3-based animation.</span>
        </div>
      </div>
    </div>
  );

  return new ImageResponse(image, {
    width: 1200,
    height: 630,
    headers: {
      'Content-Type': 'image/jpeg', // Can be PNG or JPEG
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
    },
  });
}