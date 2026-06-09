import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export function GET(
  _req: NextRequest,
  { params }: { params: { size: string } }
) {
  const size = params.size === "512" ? 512 : 192;
  const radius = Math.round(size * 0.1875); // ~18.75% → esquinas redondeadas
  const strokeW = Math.round(size * 0.09);
  const padding = Math.round(size * 0.1);
  const inner = size - padding * 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "#4f46e5",
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 352 144 L 204 144 C 136 144 88 192 88 260 C 88 328 136 376 204 376 L 336 376"
            stroke="white"
            strokeWidth={strokeW * (512 / inner)}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 288 100 L 352 144 L 408 96"
            stroke="white"
            strokeWidth={strokeW * (512 / inner)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
