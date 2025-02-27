export async function GET() {

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjg5MTkxNCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDRmYzg1YjUzN2FkYzE4RmYzNTRhMzJDNkUxM0JCRGNEZDk0YTZEMDEifQ",
      payload: "eyJkb21haW4iOiJmYWNlb2ZmYXJjYXN0ZXJhcnQudmVyY2VsLmFwcCJ9",
      signature: "MHgyMTUxOTNhNzdkNGJmN2U5ODg4MGVlODc2ZGQxZTY0NDk0YjVkMGE0ODNmNzM2YTY2YjA0ZmE3MDhhZjkzYTljMGQ2ZTA2MDdlOTI4NzYyZTJhYzExMzljYWQ5M2E1NmQ3ZjVmZWYzNjkxYzYxZTJjY2FiNDM4NTU5MDFjZTViMzFj"
    },
    frame: {
      version: "1",
      name: "FAFA",
      iconUrl: "https://faceoffarcasterart.vercel.app/icon.jpg",
      homeUrl: "https://faceoffarcasterart.vercel.app",
      imageUrl: "https://faceoffarcasterart.vercel.app/og-image.jpg",
      buttonTitle: "Mint your FAFA",
      splashImageUrl: "https://faceoffarcasterart.vercel.app/splash.png",
      splashBackgroundColor: "#1b1423",
      webhookUrl: "https://faceoffarcasterart.vercel.app/api/webhook"
    },
  };

  return Response.json(config);
}