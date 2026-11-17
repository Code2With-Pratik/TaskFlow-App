import { ImageResponse } from "next/og";

export const alt =
  "TaskFlow project and task management by Pratik Dhandare, Code2WithPratik";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "76px",
        background: "#f7f7f7",
        color: "#171717",
      }}
    >
      <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
        TaskFlow
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
          Project and task management
        </div>
        <div style={{ fontSize: 30, color: "#5b616b" }}>
          Plan work. Coordinate teams. Track progress.
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 24, color: "#5b616b" }}>
        By Pratik Dhandare · Code2WithPratik
      </div>
    </div>,
    size,
  );
}
