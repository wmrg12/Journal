import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Rect,
  Path,
  Image as SvgImage,
  Text as SvgText,
  G,
  Circle,
  Polygon,
  Line,
} from "react-native-svg";
import { STICKER_SOURCES } from "@/constants/stickers";

type TextItem = {
  id: string;
  content: string;
  position_x: number;
  position_y: number;
  font_size?: number;
  color?: string;
  rotation?: number;
};
type DrawItem = {
  id: string;
  path_d: string;
  color?: string;
  width?: number;
  opacity?: number;
};
type ShapeItem = {
  id: string;
  shape_type?: string;
  position_x: number;
  position_y: number;
  width?: number;
  height?: number;
  color?: string;
  rotation?: number;
};
type ImageItem = {
  id: string;
  uri?: string;
  position_x: number;
  position_y: number;
  width?: number;
  height?: number;
  rotation?: number;
};
type StickerItem = {
  id: string;
  sticker_url?: string;
  position_x: number;
  position_y: number;
  width?: number;
  height?: number;
  rotation?: number;
};

type Props = {
  width?: number;
  height?: number;
  style?: any;
  bgColor?: string;
  texts?: TextItem[];
  draws?: DrawItem[];
  shapes?: ShapeItem[];
  images?: ImageItem[];
  stickers?: StickerItem[];
  sourceWidth?: number;
  sourceHeight?: number;
  extraScale?: number; // factor para agrandar un poco
  alignVertical?: "top" | "center" | "bottom";
  offsetX?: number; // mover contenido en px (positivo => derecha)
  offsetY?: number; // mover contenido en px (positivo => abajo)
  centerNullPositions?: boolean; // si true, null => centro; si false, null => 0 (izq/arriba)
};

export default function SmallPagePreview({
  width,
  height,
  style,
  bgColor = "#fff",
  texts = [],
  draws = [],
  shapes = [],
  images = [],
  stickers = [],
  sourceWidth = 720,
  sourceHeight = 1280,
  extraScale = 1.08,
  alignVertical = "center",
  offsetX = 0,
  offsetY = 0,
  centerNullPositions = true,
}: Props) {
  // normalizar coordenadas (si vienen en 0..1)
  const norm = (v: number | undefined, max: number) => {
    if (v == null) return centerNullPositions ? max / 2 : 0;
    if (typeof v !== "number") return 0;
    if (v >= 0 && v <= 1) return v * max;
    return v;
  };

  // safe color helper (evita valores vacíos o undefined)
  const safeColor = (c: any, fallback = "#000000") => {
    if (!c) return fallback;
    if (typeof c !== "string") return fallback;
    const clean = c.trim();
    if (clean.length === 0) return fallback;
    if (!clean.startsWith("#")) return fallback; // evitar cosas inválidas
    return clean;
  };

  // Modo fill cuando no se pasan width/height numéricos
  const fillContainer = typeof width !== "number" || typeof height !== "number";

  const containerW = typeof width === "number" ? width : 150;
  const containerH = typeof height === "number" ? height : 220;

  // escala base para modo numérico (retrocompatibilidad)
  const scaleX = containerW / sourceWidth;
  const scaleY = containerH / sourceHeight;
  const baseScale = Math.min(scaleX, scaleY);
  const scale = Math.min(
    baseScale * extraScale,
    baseScale * Math.max(extraScale, 1)
  );
  const svgRenderW = sourceWidth * scale;
  const svgRenderH = sourceHeight * scale;
  const left = (containerW - svgRenderW) / 2 + offsetX;
  let top = 0;
  if (alignVertical === "center") top = (containerH - svgRenderH) / 2 + offsetY;
  if (alignVertical === "top") top = 0 + offsetY;
  if (alignVertical === "bottom") top = containerH - svgRenderH + offsetY;

  // render block para evitar duplicar mucho código: devuelve los children <G> con contenido
  const renderContent = () => (
    <G>
      {/* DIBUJOS */}
      {draws.map((d) => (
        <Path
          key={`draw-${d.id}`}
          d={d.path_d}
          fill="none"
          stroke={safeColor(d.color, "#222")}
          strokeWidth={Math.max(0.8, d.width ?? 2)}
          opacity={d.opacity ?? 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* SHAPES */}
      {shapes.map((sh) => {
        const x = norm(sh.position_x, sourceWidth);
        const y = norm(sh.position_y, sourceHeight);
        const w = sh.width ?? 60;
        const h = sh.height ?? 60;
        const color = safeColor(sh.color, "#000");
        const rot = sh.rotation ?? 0;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const transform = rot ? `rotate(${rot}, ${cx}, ${cy})` : undefined;

        // Cada case retorna un elemento con key único
        switch (sh.shape_type) {
          case "circle":
            return (
              <Circle
                key={`shape-circle-${sh.id}`}
                cx={cx}
                cy={cy}
                r={Math.min(w, h) / 2}
                fill={sh.color}
                stroke={sh.color}
                transform={transform}
              />
            );

          case "triangle":
            return (
              <Polygon
                key={`shape-triangle-${sh.id}`}
                points={`${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}`}
                fill={sh.color}
                stroke={sh.color}
                transform={transform}
              />
            );

          case "square":
          case "rectangle":
            return (
              <Rect
                key={`shape-rect-${sh.id}`}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={sh.color}
                stroke={sh.color}
                transform={transform}
              />
            );

          case "line":
            return (
              <Line
                key={`shape-line-${sh.id}`}
                x1={x}
                y1={y + h / 2}
                x2={x + w}
                y2={y + h / 2}
                stroke={color}
                strokeWidth={Math.max(2, Math.min(w, h) / 8)}
                strokeLinecap="round"
                transform={transform}
              />
            );

          case "arrow":
            return (
              <G key={`shape-arrow-${sh.id}`} transform={transform}>
                <Line
                  x1={x}
                  y1={y + h / 2}
                  x2={x + w * 0.85}
                  y2={y + h / 2}
                  stroke={color}
                  strokeWidth={Math.max(2, Math.min(w, h) / 8)}
                  strokeLinecap="round"
                />
                <Polygon
                  key={`shape-arrow-head-${sh.id}`}
                  points={`${x + w},${y + h / 2} ${x + w * 0.85},${
                    y + h * 0.4
                  } ${x + w * 0.85},${y + h * 0.6}`}
                  fill={sh.color}
                  stroke={sh.color}
                />
              </G>
            );

          case "heart":
            return (
              <Path
                key={`shape-heart-${sh.id}`}
                d="M50 85 C 50 85, 10 55, 10 35 C 10 20, 25 10, 40 15 C 50 20, 60 20, 70 15 C 85 10, 90 20, 90 35 C 90 55, 50 85, 50 85 Z"
                fill={sh.color}
                stroke={sh.color}
                transform={`translate(${x - 50},${y - 35}) scale(${
                  Math.min(w, h) / 100
                })`}
              />
            );

          case "star": {
            const pts: string[] = [];
            const outer = Math.min(w, h) * 0.45;
            const inner = outer * 0.45;
            for (let i = 0; i < 10; i++) {
              const angle = (Math.PI / 5) * i - Math.PI / 2;
              const r = i % 2 === 0 ? outer : inner;
              pts.push(
                `${x + w / 2 + r * Math.cos(angle)},${
                  y + h / 2 + r * Math.sin(angle)
                }`
              );
            }
            return (
              <Polygon
                key={`shape-star-${sh.id}`}
                points={pts.join(" ")}
                fill={sh.color}
                stroke={sh.color}
                transform={transform}
              />
            );
          }

          case "diamond":
            return (
              <Polygon
                key={`shape-diamond-${sh.id}`}
                points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${
                  y + h
                } ${x},${y + h / 2}`}
                fill={sh.color}
                stroke={sh.color}
                transform={transform}
              />
            );

          case "pentagon": {
            const pts: string[] = [];
            const r = Math.min(w, h) * 0.45;
            for (let i = 0; i < 5; i++) {
              const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
              pts.push(
                `${x + w / 2 + r * Math.cos(angle)},${
                  y + h / 2 + r * Math.sin(angle)
                }`
              );
            }
            return (
              <Polygon
                key={`shape-pentagon-${sh.id}`}
                points={pts.join(" ")}
                fill={sh.color}
                stroke={sh.color}
                transform={transform}
              />
            );
          }

          case "sun": {
            const pts: string[] = [];
            for (let i = 0; i < 16; i++) {
              const angle = (Math.PI / 8) * i;
              const r =
                i % 2 === 0 ? Math.min(w, h) * 0.45 : Math.min(w, h) * 0.25;
              pts.push(
                `${x + w / 2 + r * Math.cos(angle)},${
                  y + h / 2 + r * Math.sin(angle)
                }`
              );
            }
            return (
              <Polygon
                key={`shape-sun-${sh.id}`}
                points={pts.join(" ")}
                fill={sh.color}
                stroke={sh.color}
                transform={transform}
              />
            );
          }

          case "bolt":
            return (
              <Path
                key={`shape-bolt-${sh.id}`}
                d="M60 5 L25 55 L45 55 L35 95 L80 45 L55 45 Z"
                fill={sh.color}
                stroke={sh.color}
                transform={`translate(${x - 5},${y - 5}) scale(${
                  Math.min(w, h) / 100
                })`}
              />
            );

          case "flower":
            return (
              <G key={`shape-flower-${sh.id}`} transform={transform}>
                {[0, 60, 120, 180, 240, 300].map((a, i) => {
                  const rad = (a * Math.PI) / 180;
                  return (
                    <Circle
                      key={`flower-${sh.id}-${i}`}
                      cx={x + w / 2 + Math.min(w, h) * 0.3 * Math.cos(rad)}
                      cy={y + h / 2 + Math.min(w, h) * 0.3 * Math.sin(rad)}
                      r={Math.min(w, h) * 0.14}
                      fill={sh.color}
                      stroke={sh.color}
                    />
                  );
                })}
                <Circle
                  key={`flower-center-${sh.id}`}
                  cx={x + w / 2}
                  cy={y + h / 2}
                  r={Math.min(w, h) * 0.12}
                  fill={sh.color}
                  stroke={sh.color}
                />
              </G>
            );

          case "mountain":
            return (
              <G key={`shape-mountain-${sh.id}`} transform={transform}>
                <Polygon
                  points={`${x + w * 0.05},${y + h * 0.95} ${x + w * 0.25},${
                    y + h * 0.5
                  } ${x + w * 0.5},${y + h * 0.95}`}
                  fill={sh.color}
                  stroke={sh.color}
                  opacity="0.7"
                />
                <Polygon
                  points={`${x + w * 0.15},${y + h * 0.95} ${x + w * 0.4},${
                    y + h * 0.15
                  } ${x + w * 0.85},${y + h * 0.95}`}
                  fill={sh.color}
                  stroke={sh.color}
                />
              </G>
            );

          default:
            return null;
        }
      })}

      {/* IMÁGENES */}
      {images.map((im) => {
        const src =
          im.uri && (im.uri.startsWith("http") || im.uri.startsWith("file"))
            ? { uri: im.uri }
            : undefined;
        if (!src) return null;
        return (
          <SvgImage
            key={`image-${im.id}`}
            x={norm(im.position_x, sourceWidth)}
            y={norm(im.position_y, sourceHeight)}
            width={im.width ?? 100}
            height={im.height ?? 100}
            href={src as any}
            preserveAspectRatio="xMidYMid slice"
          />
        );
      })}

      {/* STICKERS */}
      {stickers.map((st) => {
        const asset = STICKER_SOURCES[st.sticker_url ?? ""];
        if (!asset) {
          return (
            <Rect
              key={`sticker-placeholder-${st.id}`}
              x={norm(st.position_x, sourceWidth)}
              y={norm(st.position_y, sourceHeight)}
              width={st.width ?? 80}
              height={st.height ?? 80}
              fill="rgba(200,200,200,0.3)"
            />
          );
        }

        return (
          <SvgImage
            key={`sticker-${st.id}`}
            x={norm(st.position_x, sourceWidth)}
            y={norm(st.position_y, sourceHeight)}
            width={st.width ?? 80}
            height={st.height ?? 80}
            href={asset as any}
          />
        );
      })}

      {/* TEXTOS */}
      {texts.map((t) => (
        <SvgText
          key={`text-${t.id}`}
          x={norm(t.position_x, sourceWidth)}
          y={norm(t.position_y, sourceHeight)}
          fontSize={Math.max(8, t.font_size ?? 16)}
          fill={safeColor(t.color, "#111")}
        >
          {t.content}
        </SvgText>
      ))}
    </G>
  );

  return (
    <View
      style={[
        styles.container,
        style,
        fillContainer
          ? { width: "100%", height: "100%" }
          : { width: containerW, height: containerH },
      ]}
    >
      {fillContainer ? (
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${sourceWidth} ${sourceHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <Rect
            x={0}
            y={0}
            width={sourceWidth}
            height={sourceHeight}
            fill={bgColor}
          />
          {renderContent()}
        </Svg>
      ) : (
        <Svg
          width={svgRenderW}
          height={svgRenderH}
          viewBox={`0 0 ${sourceWidth} ${sourceHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: "absolute", left, top }}
        >
          <Rect
            x={0}
            y={0}
            width={sourceWidth}
            height={sourceHeight}
            fill={bgColor}
          />
          {renderContent()}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
});
