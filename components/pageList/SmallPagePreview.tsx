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

type TextItem = { id: string; content: string; position_x?: number | null; position_y?: number | null; font_size?: number; color?: string; rotation?: number; };
type DrawItem = { id: string; path_d: string; color?: string; width?: number; opacity?: number; rotation?: number; };
type ShapeItem = { id: string; shape_type?: string | null; position_x?: number | null; position_y?: number | null; width?: number; height?: number; color?: string; rotation?: number; };
type ImageItem = { id: string; uri?: string; position_x?: number | null; position_y?: number | null; width?: number; height?: number; rotation?: number; };
type StickerItem = { id: string; sticker_url?: string; position_x?: number | null; position_y?: number | null; width?: number; height?: number; rotation?: number; };

type Props = {
  style?: any;
  bgColor?: string;
  texts?: TextItem[];
  draws?: DrawItem[];
  shapes?: ShapeItem[];
  images?: ImageItem[];
  stickers?: StickerItem[];
  sourceWidth?: number;
  sourceHeight?: number;
  positionMode?: "topleft" | "center";
  debug?: boolean;
};

export default function SmallPagePreview({
  style,
  bgColor = "#fff",
  texts = [],
  draws = [],
  shapes = [],
  images = [],
  stickers = [],
  sourceWidth = 555,
  sourceHeight = 850,
  positionMode = "topleft",
  debug = false,
}: Props) {
  const norm = (v: number | null | undefined, max: number) => {
    if (v == null) return max / 2;
    if (typeof v !== "number") return 0;
    if (v >= 0 && v <= 1) return v * max;
    return v;
  };

  const safeColor = (c: any, fallback = "#000000") => {
    if (!c) return fallback;
    if (typeof c !== "string") return fallback;
    const clean = c.trim();
    if (clean.length === 0) return fallback;
    if (!clean.startsWith("#")) return fallback;
    return clean;
  };

  function getCenter(posX: number | null | undefined, posY: number | null | undefined, w = 0, h = 0) {
    const x = norm(posX, sourceWidth);
    const y = norm(posY, sourceHeight);
    if (positionMode === "center") {
      return { cx: x, cy: y };
    }
    return { cx: x + w / 2, cy: y + h / 2 };
  }

  function normalizeType(raw?: string | null) {
    if (!raw) return "";
    return raw.toString().trim().toLowerCase();
  }

  function guessShapeType(sh: ShapeItem) {
    const explicit = normalizeType(sh.shape_type);
    if (explicit) return explicit;

    const w = sh.width ?? 0;
    const h = sh.height ?? 0;

    if (w <= 0 || h <= 0) return "rectangle"; // fallback

    // heurísticas:
    if (Math.abs(w - h) < Math.min(w, h) * 0.2) {
      if (Math.min(w, h) < 40) return "circle";
      return "square";
    }
    if (Math.min(w, h) < Math.min(w, h) * 0.2 || Math.min(w, h) < 10) {
      return "line";
    }
    if (w / h > 2 || h / w > 2) return "rectangle";
    return "rectangle";
  }

  function starPoints(cx: number, cy: number, w: number, h: number, spikes = 5) {
    const pts: string[] = [];
    const outer = Math.min(w, h) * 0.45;
    const inner = outer * 0.45;
    const total = spikes * 2;
    for (let i = 0; i < total; i++) {
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return pts.join(" ");
  }

  function pentagonPoints(cx: number, cy: number, w: number, h: number) {
    const pts: string[] = [];
    const r = Math.min(w, h) * 0.45;
    for (let i = 0; i < 5; i++) {
      const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return pts.join(" ");
  }

  const renderContent = () => {
    if (debug) console.debug("SmallPagePreview debug shapes:", shapes);

    return (
      <G>
        {/* Draws */}
        {draws.map((d) => (
          <Path
            key={`draw-${d.id}`}
            d={d.path_d}
            fill="none"
            stroke={safeColor(d.color, "#222")}
            strokeWidth={d.width ?? 2}
            opacity={d.opacity ?? 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={d.rotation ? `rotate(${d.rotation} ${sourceWidth / 2} ${sourceHeight / 2})` : undefined}
          />
        ))}

        {/* Shapes */}
        {shapes.map((sh) => {
          const w = Math.max(1, sh.width ?? 60);
          const h = Math.max(1, sh.height ?? 60);
          const { cx, cy } = getCenter(sh.position_x, sh.position_y, w, h);
          const rotation = Number(sh.rotation ?? 0);
          const transform = rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined;
          const color = safeColor(sh.color, "#8B5CF6");
          const rawType = normalizeType(sh.shape_type);
          const type = rawType || guessShapeType(sh);

          const dbgOutline = debug ? <Rect key={`dbg-${sh.id}`} x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={1} /> : null;

          switch (type) {
            case "circle":
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Circle cx={cx} cy={cy} r={Math.min(w, h) / 2} fill={color} transform={transform} />
                </G>
              );

            case "triangle":
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Polygon points={`${cx},${cy - h/2} ${cx - w/2},${cy + h/2} ${cx + w/2},${cy + h/2}`} fill={color} transform={transform} />
                </G>
              );

            case "square":
            case "rectangle":
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={Math.min(12, Math.min(w, h) * 0.08)} fill={color} transform={transform} />
                </G>
              );

            case "diamond":
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Polygon points={`${cx},${cy - h/2} ${cx + w/2},${cy} ${cx},${cy + h/2} ${cx - w/2},${cy}`} fill={color} transform={transform} />
                </G>
              );

            case "line": {
              const x1 = cx - w / 2;
              const x2 = cx + w / 2;
              const y = cy;
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={Math.max(2, Math.min(w, h) * 0.12)} strokeLinecap="round" transform={transform} />
                </G>
              );
            }

            case "arrow": {
              const shaftStartX = cx - w / 2;
              const shaftEndX = cx + w / 2 * 0.85;
              const centerY = cy;
              const headX = cx + w / 2;
              return (
                <G key={`shape-${sh.id}`} transform={transform}>
                  {dbgOutline}
                  <Line x1={shaftStartX} y1={centerY} x2={shaftEndX} y2={centerY} stroke={color} strokeWidth={Math.max(2, Math.min(w, h) * 0.12)} strokeLinecap="round" />
                  <Polygon points={`${headX},${centerY} ${shaftEndX},${centerY - h*0.15} ${shaftEndX},${centerY + h*0.15}`} fill={color} />
                </G>
              );
            }

            case "star":
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Polygon points={starPoints(cx, cy, w, h, 5)} fill={color} transform={transform} />
                </G>
              );

            case "pentagon":
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Polygon points={pentagonPoints(cx, cy, w, h)} fill={color} transform={transform} />
                </G>
              );

            case "sun": {
              const pts: string[] = [];
              for (let i = 0; i < 16; i++) {
                const angle = (Math.PI / 8) * i;
                const r = i % 2 === 0 ? Math.min(w, h) * 0.45 : Math.min(w, h) * 0.25;
                pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
              }
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Polygon points={pts.join(" ")} fill={color} transform={transform} />
                </G>
              );
            }

            case "bolt":
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Path d={`M ${cx - w*0.05} ${cy - h*0.4} L ${cx - w*0.3} ${cy + h*0.1} L ${cx - w*0.05} ${cy + h*0.05} L ${cx - w*0.2} ${cy + h*0.45} L ${cx + w*0.35} ${cy - h*0.05} L ${cx + w*0.05} ${cy - h*0.05} Z`} fill={color} transform={transform} />
                </G>
              );

            case "flower": {
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  {[0, 60, 120, 180, 240, 300].map((a, i) => {
                    const rad = (a * Math.PI) / 180;
                    return <Circle key={`flower-${sh.id}-${i}`} cx={cx + Math.min(w, h) * 0.3 * Math.cos(rad)} cy={cy + Math.min(w, h) * 0.3 * Math.sin(rad)} r={Math.min(w, h) * 0.14} fill={color} />;
                  })}
                  <Circle cx={cx} cy={cy} r={Math.min(w, h) * 0.12} fill={color} />
                </G>
              );
            }

            case "mountain": {
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Polygon points={`${cx - w*0.45},${cy + h*0.45} ${cx - w*0.25},${cy - h*0.05} ${cx},${cy + h*0.45}`} fill={color} transform={transform} opacity={0.9} />
                  <Polygon points={`${cx - w*0.35},${cy + h*0.45} ${cx + w*0.1},${cy - h*0.4} ${cx + w*0.4},${cy + h*0.45}`} fill={color} transform={transform} />
                </G>
              );
            }

            case "heart": {
              const path = `M ${cx} ${cy + h * 0.12} C ${cx + w * 0.35} ${cy - h * 0.12} ${cx + w * 0.8} ${cy + h * 0.35} ${cx} ${cy + h * 0.8} C ${cx - w * 0.8} ${cy + h * 0.35} ${cx - w * 0.35} ${cy - h * 0.12} ${cx} ${cy + h * 0.12} Z`;
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Path d={path} fill={color} transform={transform} />
                </G>
              );
            }

            default:
              return (
                <G key={`shape-${sh.id}`}>
                  {dbgOutline}
                  <Rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill={color} transform={transform} />
                </G>
              );
          }
        })}

        {/* Images */}
        {images.map((im) => {
          const w = im.width ?? 100;
          const h = im.height ?? 100;
          const { cx, cy } = getCenter(im.position_x, im.position_y, w, h);
          const x = cx - w / 2;
          const y = cy - h / 2;
          const transform = im.rotation ? `rotate(${im.rotation} ${cx} ${cy})` : undefined;
          const src = im.uri && (im.uri.startsWith("http") || im.uri.startsWith("file")) ? { uri: im.uri } : undefined;
          if (!src) return null;
          return <SvgImage key={`image-${im.id}`} x={x} y={y} width={w} height={h} href={src as any} preserveAspectRatio="xMidYMid slice" transform={transform} />;
        })}

        {/* Stickers */}
        {stickers.map((st) => {
          const w = st.width ?? 80;
          const h = st.height ?? 80;
          const { cx, cy } = getCenter(st.position_x, st.position_y, w, h);
          const x = cx - w / 2;
          const y = cy - h / 2;
          const transform = st.rotation ? `rotate(${st.rotation} ${cx} ${cy})` : undefined;
          const asset = STICKER_SOURCES[st.sticker_url ?? ""];
          if (!asset) {
            return <Rect key={`st-placeholder-${st.id}`} x={x} y={y} width={w} height={h} fill="rgba(200,200,200,0.3)" transform={transform} />;
          }
          return <SvgImage key={`sticker-${st.id}`} x={x} y={y} width={w} height={h} href={asset as any} transform={transform} />;
        })}

        {/* Texts */}
        {texts.map((t) => {
          const fontSize = Math.max(8, t.font_size ?? 16);
          const { cx, cy } = getCenter(t.position_x, t.position_y, 0, 0);
          const transform = t.rotation ? `rotate(${t.rotation} ${cx} ${cy})` : undefined;
          return (
            <SvgText key={`text-${t.id}`} x={cx} y={cy} fontSize={fontSize} fill={safeColor(t.color, "#111")} transform={transform}>
              {t.content}
            </SvgText>
          );
        })}
      </G>
    );
  };

  const viewBox = `0 0 ${sourceWidth} ${sourceHeight}`;

  return (
    <View style={[localStyles.container, style]}>
      <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        <Rect x={0} y={0} width={sourceWidth} height={sourceHeight} fill={bgColor} />
        {renderContent()}
      </Svg>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
});
