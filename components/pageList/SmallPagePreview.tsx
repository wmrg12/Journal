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
  Ellipse,
} from "react-native-svg";
import { STICKER_SOURCES } from "@/constants/stickers";
import { PagePatternBackground } from "@/components/optionsCreatePage/PagePatterns";

type TextItem = { id: string; content: string; position_x?: number | null; position_y?: number | null; font_size?: number; color?: string; rotation?: number; };
type DrawItem = { id: string; path_d: string; color?: string; width?: number; opacity?: number; rotation?: number; };
type ShapeItem = { id: string; shape_type?: string | null; position_x?: number | null; position_y?: number | null; width?: number; height?: number; color?: string; rotation?: number; };
type ImageItem = { id: string; uri?: string; position_x?: number | null; position_y?: number | null; width?: number; height?: number; rotation?: number; };
type StickerItem = { id: string; sticker_url?: string; position_x?: number | null; position_y?: number | null; width?: number; height?: number; rotation?: number; };
type AudioItem = { id: string; position_x?: number | null; position_y?: number | null; };

type PagePattern = "none" | "lines" | "dots" | "grid" | "squared" | "checkerboard" | "crosses" | "diamonds" | "stars" | "vertical" | "dotscrosses" | "music";

type Props = {
  style?: any;
  bgColor?: string;
  pattern?: PagePattern | string;
  texts?: TextItem[];
  draws?: DrawItem[];
  shapes?: ShapeItem[];
  images?: ImageItem[];
  stickers?: StickerItem[];
  audios?: AudioItem[]; 
  sourceWidth?: number;
  sourceHeight?: number;
  originalCanvasWidth?: number;
  originalCanvasHeight?: number;
  positionMode?: "topleft" | "center";
  debug?: boolean;
};

export default function SmallPagePreview({
  style,
  bgColor = "#fff",
  pattern = "none",
  texts = [],
  draws = [],
  shapes = [],
  images = [],
  stickers = [],
  audios = [],  
  sourceWidth = 400,
  sourceHeight = 700,
  originalCanvasWidth = 400,
  originalCanvasHeight = 700,
  positionMode = "topleft",
  debug = false,
}: Props) {
  
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
  
  const scaleX = sourceWidth / originalCanvasWidth;
  const scaleY = sourceHeight / originalCanvasHeight;
  const uniformScale = Math.min(scaleX, scaleY);

  const normX = (v: number | null | undefined) => {
    if (v == null) return sourceWidth / 2;
    if (typeof v !== "number") return 0;
    return v * scaleX;
  };

  const normY = (v: number | null | undefined) => {
    if (v == null) return sourceHeight / 2;
    if (typeof v !== "number") return 0;
    return v * scaleY;
  };

  const scaleW = (v: number | undefined, fallback = 60) => {
    return (v ?? fallback) * scaleX;
  };

  const scaleH = (v: number | undefined, fallback = 60) => {
    return (v ?? fallback) * scaleY;
  };

  const safeColor = (c: any, fallback = "#000000") => {
    if (!c) return fallback;
    if (typeof c !== "string") return fallback;
    const clean = c.trim();
    if (clean.length === 0) return fallback;
    return clean;
  };

  function getCenter(posX: number | null | undefined, posY: number | null | undefined, w = 0, h = 0) {
    const x = normX(posX);
    const y = normY(posY);
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

  const scalePathD = (pathD: string): string => {
    if (!pathD) return "";
    return pathD.replace(/([ML])\s*([\d.-]+)\s+([\d.-]+)/gi, (match, cmd, x, y) => {
      const scaledX = parseFloat(x) * scaleX;
      const scaledY = parseFloat(y) * scaleY;
      return `${cmd} ${scaledX.toFixed(2)} ${scaledY.toFixed(2)}`;
    });
  };

  // Renderizar icono de audio como nota musical
  // Renderizar icono de audio como una nota musical simple
const renderAudioIcon = (cx: number, cy: number, size: number) => {
  const s = size;
  const halfS = s / 2;
  
  return (
    <G>
      {/* Fondo circular oscuro */}
      <Circle 
        cx={cx} 
        cy={cy} 
        r={halfS} 
        fill="#ffffffff" 
      />
      {/* Cabeza de la nota (óvalo inclinado) */}
      <Ellipse
        cx={cx - s * 0.05}
        cy={cy + s * 0.15}
        rx={s * 0.15}
        ry={s * 0.1}
        fill="#282214ff"
        transform={`rotate(-25 ${cx - s * 0.05} ${cy + s * 0.15})`}
      />
      {/* Línea vertical de la nota */}
      <Line
        x1={cx + s * 0.08}
        y1={cy + s * 0.1}
        x2={cx + s * 0.08}
        y2={cy - s * 0.25}
        stroke="#282214ff"
        strokeWidth={s * 0.06}
        strokeLinecap="round"
      />
      {/* Bandera de la nota */}
      <Path
        d={`
          M ${cx + s * 0.08} ${cy - s * 0.25}
          Q ${cx + s * 0.25} ${cy - s * 0.15} ${cx + s * 0.2} ${cy}
        `}
        stroke="#282214ff"
        strokeWidth={s * 0.05}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
};

  const renderContent = () => {
    if (debug) {
      console.debug("SmallPagePreview debug:", {
        bgColor,
        pattern,
        containerSize,
        shapes: shapes.map(s => ({ id: s.id, x: s.position_x, y: s.position_y, type: s.shape_type })),
        texts: texts.map(t => ({ id: t.id, x: t.position_x, y: t.position_y, content: t.content })),
        audios: audios.map(a => ({ id: a.id, x: a.position_x, y: a.position_y })),
      });
    }

    return (
      <G>
        {/* Draws */}
        {draws.map((d) => (
          <Path
            key={`draw-${d.id}`}
            d={scalePathD(d.path_d)}
            fill="none"
            stroke={safeColor(d.color, "#222")}
            strokeWidth={Math.max(1, (d.width ?? 2) * uniformScale)}
            opacity={d.opacity ?? 1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Shapes */}
        {shapes.map((sh) => {
          const w = scaleW(sh.width, 60);
          const h = scaleH(sh.height, 60);
          const { cx, cy } = getCenter(sh.position_x, sh.position_y, w, h);
          const rotation = Number(sh.rotation ?? 0);
          const transform = rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined;
          const color = safeColor(sh.color, "#8B5CF6");
          const type = normalizeType(sh.shape_type) || guessShapeType(sh);

          switch (type) {
            case "circle":
              return <Circle key={`shape-${sh.id}`} cx={cx} cy={cy} r={Math.min(w, h) / 2} fill={color} transform={transform} />;
            case "triangle":
              return <Polygon key={`shape-${sh.id}`} points={`${cx},${cy - h/2} ${cx - w/2},${cy + h/2} ${cx + w/2},${cy + h/2}`} fill={color} transform={transform} />;
            case "square":
            case "rectangle":
              return <Rect key={`shape-${sh.id}`} x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={Math.min(8, Math.min(w, h) * 0.08)} fill={color} transform={transform} />;
            case "diamond":
              return <Polygon key={`shape-${sh.id}`} points={`${cx},${cy - h/2} ${cx + w/2},${cy} ${cx},${cy + h/2} ${cx - w/2},${cy}`} fill={color} transform={transform} />;
            case "line":
              return <Line key={`shape-${sh.id}`} x1={cx - w/2} y1={cy} x2={cx + w/2} y2={cy} stroke={color} strokeWidth={Math.max(2, h * 0.12)} strokeLinecap="round" transform={transform} />;
            case "star":
              return <Polygon key={`shape-${sh.id}`} points={starPoints(cx, cy, w, h, 5)} fill={color} transform={transform} />;
            case "pentagon":
              return <Polygon key={`shape-${sh.id}`} points={pentagonPoints(cx, cy, w, h)} fill={color} transform={transform} />;
            case "heart": {
              const path = `M ${cx} ${cy + h * 0.12} C ${cx + w * 0.35} ${cy - h * 0.12} ${cx + w * 0.8} ${cy + h * 0.35} ${cx} ${cy + h * 0.8} C ${cx - w * 0.8} ${cy + h * 0.35} ${cx - w * 0.35} ${cy - h * 0.12} ${cx} ${cy + h * 0.12} Z`;
              return <Path key={`shape-${sh.id}`} d={path} fill={color} transform={transform} />;
            }
            default:
              return <Rect key={`shape-${sh.id}`} x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill={color} transform={transform} />;
          }
        })}

        {/* Images */}
        {images.map((im) => {
          const w = scaleW(im.width, 100);
          const h = scaleH(im.height, 100);
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
          const w = scaleW(st.width, 80);
          const h = scaleH(st.height, 80);
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

        {/* Audios - mostrar icono en la posición */}
        {audios.map((audio) => {
          const audioSize = 30 * uniformScale; 
          const { cx, cy } = getCenter(audio.position_x, audio.position_y, audioSize, audioSize);
          return (
            <G key={`audio-${audio.id}`}>
              {renderAudioIcon(cx, cy, audioSize)}
            </G>
          );
        })}

        {/* Texts */}
        {texts.map((t) => {
          const fontSize = Math.max(6, (t.font_size ?? 16) * uniformScale);
          const { cx, cy } = getCenter(t.position_x, t.position_y, 0, 0);
          const transform = t.rotation ? `rotate(${t.rotation} ${cx} ${cy})` : undefined;
          return (
            <SvgText 
              key={`text-${t.id}`} 
              x={cx} 
              y={cy} 
              fontSize={fontSize} 
              fill={safeColor(t.color, "#111")} 
              textAnchor="start"
              alignmentBaseline="hanging"
              transform={transform}
            >
              {t.content}
            </SvgText>
          );
        })}
      </G>
    );
  };

  const viewBox = `0 0 ${sourceWidth} ${sourceHeight}`;
  const safeBgColor = safeColor(bgColor, "#FFFFFF");
  const safePattern = (pattern || "none") as PagePattern;

  return (
    <View 
      style={[localStyles.container, { backgroundColor: safeBgColor }, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }}
    >
      {/* Patrón de fondo */}
      {containerSize.width > 0 && containerSize.height > 0 && safePattern !== "none" && (
        <View style={localStyles.patternLayer}>
          <PagePatternBackground
            pattern={safePattern}
            width={containerSize.width}
            height={containerSize.height}
            color="#888888"
          />
        </View>
      )}

      {/*  Contenido SVG */}
      <View style={localStyles.contentLayer}>
        <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
          {renderContent()}
        </Svg>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  patternLayer: {
    position: "absolute",
    top: 1,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  contentLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
});