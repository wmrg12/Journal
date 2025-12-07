import { PagePatternBackground } from "@/components/optionsCreatePage/PagePatterns";
import { fontFamilyMap, TextFont } from "@/constants/fonts";
import { STICKER_SOURCES } from "@/constants/stickers";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Image as SvgImage,
  Text as SvgText,
} from "react-native-svg";

type TextItem = {
  id: string;
  content: string;
  position_x?: number | null;
  position_y?: number | null;
  font_size?: number;
  color?: string;
  rotation?: number;
  font_family?: string;
};

type DrawItem = {
  id: string;
  path_d: string;
  color?: string;
  width?: number;
  opacity?: number;
  rotation?: number;
  tool?: string;
};

type ShapeItem = {
  id: string;
  shape_type?: string | null;
  position_x?: number | null;
  position_y?: number | null;
  width?: number;
  height?: number;
  color?: string;
  rotation?: number;
};

type ImageItem = {
  id: string;
  uri?: string;
  position_x?: number | null;
  position_y?: number | null;
  width?: number;
  height?: number;
  rotation?: number;
};

type StickerItem = {
  id: string;
  sticker_url?: string;
  position_x?: number | null;
  position_y?: number | null;
  width?: number;
  height?: number;
  rotation?: number;
};

type AudioItem = {
  id: string;
  position_x?: number | null;
  position_y?: number | null;
};

type PagePattern =
  | "none"
  | "lines"
  | "dots"
  | "grid"
  | "squared"
  | "checkerboard"
  | "crosses"
  | "diamonds"
  | "stars"
  | "vertical"
  | "dotscrosses"
  | "music";

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
  sourceHeight = 780,
  originalCanvasWidth = 450,
  originalCanvasHeight = 790,
  positionMode = "topleft",
  debug = false,
}: Props) {
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });

  const scaleX = sourceWidth / originalCanvasWidth;
  const scaleY = sourceHeight / originalCanvasHeight;
  const uniformScale = Math.min(scaleX, scaleY);

  //  UTILIDADES 

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

  function getCenter(
    posX: number | null | undefined,
    posY: number | null | undefined,
    w = 0,
    h = 0
  ) {
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

  // === ESCALADO DE PATH SVG COMPLETO ===
  const scalePathD = (pathD: string): string => {
    if (!pathD) return "";

    // Regex para capturar comandos SVG y sus coordenadas
    const commandRegex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;

    return pathD.replace(commandRegex, (match, cmd: string, args: string) => {
      const nums = args.match(/-?[\d.]+/g);
      if (!nums) return cmd;

      const upperCmd = cmd.toUpperCase();
      const isRelative = cmd === cmd.toLowerCase() && cmd !== "z" && cmd !== "Z";

      if (isRelative) {
        return match;
      }

      let scaled: number[] = [];

      switch (upperCmd) {
        case "M":
        case "L":
        case "T":
          for (let i = 0; i < nums.length; i += 2) {
            scaled.push(parseFloat(nums[i]) * scaleX);
            scaled.push(parseFloat(nums[i + 1]) * scaleY);
          }
          break;

        case "H":
          scaled = nums.map((n) => parseFloat(n) * scaleX);
          break;

        case "V":
          scaled = nums.map((n) => parseFloat(n) * scaleY);
          break;

        case "C":
        
          for (let i = 0; i < nums.length; i += 6) {
            scaled.push(parseFloat(nums[i]) * scaleX);
            scaled.push(parseFloat(nums[i + 1]) * scaleY);
            scaled.push(parseFloat(nums[i + 2]) * scaleX);
            scaled.push(parseFloat(nums[i + 3]) * scaleY);
            scaled.push(parseFloat(nums[i + 4]) * scaleX);
            scaled.push(parseFloat(nums[i + 5]) * scaleY);
          }
          break;

        case "S":
        case "Q":
          for (let i = 0; i < nums.length; i += 4) {
            scaled.push(parseFloat(nums[i]) * scaleX);
            scaled.push(parseFloat(nums[i + 1]) * scaleY);
            scaled.push(parseFloat(nums[i + 2]) * scaleX);
            scaled.push(parseFloat(nums[i + 3]) * scaleY);
          }
          break;

        case "A":
          for (let i = 0; i < nums.length; i += 7) {
            scaled.push(parseFloat(nums[i]) * scaleX);
            scaled.push(parseFloat(nums[i + 1]) * scaleY); 
            scaled.push(parseFloat(nums[i + 2])); 
            scaled.push(parseFloat(nums[i + 3])); 
            scaled.push(parseFloat(nums[i + 4])); 
            scaled.push(parseFloat(nums[i + 5]) * scaleX); 
            scaled.push(parseFloat(nums[i + 6]) * scaleY); 
          }
          break;

        case "Z":
          return "Z";

        default:
          return match;
      }

      return cmd + " " + scaled.map((n) => n.toFixed(2)).join(" ");
    });
  };

  // === GENERADORES DE PUNTOS PARA FORMAS ===

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

  function sunPoints(cx: number, cy: number, w: number, h: number) {
    const pts: string[] = [];
    const outerRadius = Math.min(w, h) / 2;
    const innerRadius = outerRadius * 0.5;
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return pts.join(" ");
  }

  // === RENDERIZADO DE AUDIO ===

  const renderAudioIcon = (cx: number, cy: number, size: number) => {
    const s = size;
    const halfS = s / 2;

    return (
      <G>
        <Circle cx={cx} cy={cy} r={halfS} fill="#ffffff" stroke="#ddd" strokeWidth={1} />
        <Ellipse
          cx={cx - s * 0.05}
          cy={cy + s * 0.15}
          rx={s * 0.15}
          ry={s * 0.1}
          fill="#282214"
          transform={`rotate(-25 ${cx - s * 0.05} ${cy + s * 0.15})`}
        />
        <Line
          x1={cx + s * 0.08}
          y1={cy + s * 0.1}
          x2={cx + s * 0.08}
          y2={cy - s * 0.25}
          stroke="#282214"
          strokeWidth={s * 0.06}
          strokeLinecap="round"
        />
        <Path
          d={`M ${cx + s * 0.08} ${cy - s * 0.25} Q ${cx + s * 0.25} ${cy - s * 0.15} ${cx + s * 0.2} ${cy}`}
          stroke="#282214"
          strokeWidth={s * 0.05}
          fill="none"
          strokeLinecap="round"
        />
      </G>
    );
  };

  // === RENDERIZADO DE FORMAS ===

  const renderShape = (sh: ShapeItem) => {
    const w = scaleW(sh.width, 60);
    const h = scaleH(sh.height, 60);
    const { cx, cy } = getCenter(sh.position_x, sh.position_y, w, h);
    const rotation = Number(sh.rotation ?? 0);
    const transform = rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined;
    const color = safeColor(sh.color, "#8B5CF6");
    const type = normalizeType(sh.shape_type) || "rectangle";

    switch (type) {
      case "circle":
        return (
          <Circle
            key={`shape-${sh.id}`}
            cx={cx}
            cy={cy}
            r={Math.min(w, h) / 2}
            fill={color}
            transform={transform}
          />
        );

      case "triangle":
        return (
          <Polygon
            key={`shape-${sh.id}`}
            points={`${cx},${cy - h / 2} ${cx - w / 2},${cy + h / 2} ${cx + w / 2},${cy + h / 2}`}
            fill={color}
            transform={transform}
          />
        );

      case "square":
      case "rectangle":
        return (
          <Rect
            key={`shape-${sh.id}`}
            x={cx - w / 2}
            y={cy - h / 2}
            width={w}
            height={h}
            rx={Math.min(4, Math.min(w, h) * 0.05)}
            fill={color}
            transform={transform}
          />
        );

      case "diamond":
        return (
          <Polygon
            key={`shape-${sh.id}`}
            points={`${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`}
            fill={color}
            transform={transform}
          />
        );

      case "line":
        return (
          <Line
            key={`shape-${sh.id}`}
            x1={cx - w / 2}
            y1={cy}
            x2={cx + w / 2}
            y2={cy}
            stroke={color}
            strokeWidth={Math.max(2, h * 0.1)}
            strokeLinecap="round"
            transform={transform}
          />
        );

      case "arrow": {
        const arrowHeadSize = Math.min(w, h) * 0.2;
        return (
          <G key={`shape-${sh.id}`} transform={transform}>
            <Line
              x1={cx - w / 2}
              y1={cy}
              x2={cx + w / 2 - arrowHeadSize}
              y2={cy}
              stroke={color}
              strokeWidth={Math.max(2, h * 0.1)}
              strokeLinecap="round"
            />
            <Polygon
              points={`${cx + w / 2},${cy} ${cx + w / 2 - arrowHeadSize},${cy - arrowHeadSize / 2} ${cx + w / 2 - arrowHeadSize},${cy + arrowHeadSize / 2}`}
              fill={color}
            />
          </G>
        );
      }

      case "star":
        return (
          <Polygon
            key={`shape-${sh.id}`}
            points={starPoints(cx, cy, w, h, 5)}
            fill={color}
            transform={transform}
          />
        );

      case "pentagon":
        return (
          <Polygon
            key={`shape-${sh.id}`}
            points={pentagonPoints(cx, cy, w, h)}
            fill={color}
            transform={transform}
          />
        );

    case "heart": {
    const scale = Math.min(w, h) / 100;
  
    const path = `
    M ${cx} ${cy - 18 * scale}
    C ${cx + 22 * scale} ${cy - 55 * scale},
      ${cx + 70 * scale} ${cy - 25 * scale},
      ${cx + 45 * scale} ${cy + 10 * scale}
    C ${cx + 28 * scale} ${cy + 35 * scale},
      ${cx + 12 * scale} ${cy + 48 * scale},
      ${cx} ${cy + 53 * scale}    
    C ${cx - 12 * scale} ${cy + 48 * scale},
      ${cx - 28 * scale} ${cy + 35 * scale},
      ${cx - 45 * scale} ${cy + 10 * scale}
    C ${cx - 70 * scale} ${cy - 25 * scale},
      ${cx - 22 * scale} ${cy - 55 * scale},
      ${cx} ${cy - 18 * scale}
    Z
  `;
  
    return (
      <Path 
        key={`shape-${sh.id}`} 
        d={path} 
        fill={color} 
        transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
      />
    );
  }

      case "sun":
        return (
          <Polygon
            key={`shape-${sh.id}`}
            points={sunPoints(cx, cy, w, h)}
            fill={color}
            transform={transform}
          />
        );

      case "bolt": {
        const scale = Math.min(w, h) / 100;
        const path = `
          M ${cx + 5 * scale} ${cy - 50 * scale}
          L ${cx - 30 * scale} ${cy}
          L ${cx - 10 * scale} ${cy}
          L ${cx - 20 * scale} ${cy + 50 * scale}
          L ${cx + 25 * scale} ${cy - 10 * scale}
          L ${cx} ${cy - 10 * scale}
          Z
        `;
        return <Path key={`shape-${sh.id}`} d={path} fill={color} transform={transform} />;
      }

      case "flower": {
        const petalRadius = Math.min(w, h) / 4;
        const centerRadius = petalRadius * 0.4;
        return (
          <G key={`shape-${sh.id}`} transform={transform}>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const px = cx + petalRadius * Math.cos(rad);
              const py = cy + petalRadius * Math.sin(rad);
              return (
                <Circle
                  key={i}
                  cx={px}
                  cy={py}
                  r={petalRadius * 0.6}
                  fill={color}
                  opacity={0.8}
                />
              );
            })}
            <Circle cx={cx} cy={cy} r={centerRadius} fill={color} />
          </G>
        );
      }

      case "mountain":
        return (
          <G key={`shape-${sh.id}`} transform={transform}>
            <Polygon
              points={`${cx - w / 2},${cy + h / 2} ${cx - w * 0.2},${cy - h * 0.2} ${cx},${cy + h / 2}`}
              fill={color}
              opacity={0.7}
            />
            <Polygon
              points={`${cx - w * 0.3},${cy + h / 2} ${cx + w * 0.1},${cy - h / 2} ${cx + w / 2},${cy + h / 2}`}
              fill={color}
            />
          </G>
        );

      default:
        return (
          <Rect
            key={`shape-${sh.id}`}
            x={cx - w / 2}
            y={cy - h / 2}
            width={w}
            height={h}
            fill={color}
            transform={transform}
          />
        );
    }
  };

  // === RENDER PRINCIPAL ===

  const renderContent = () => {
    if (debug) {
      console.debug("SmallPagePreview debug:", {
        bgColor,
        pattern,
        containerSize,
        shapes: shapes.map((s) => ({
          id: s.id,
          x: s.position_x,
          y: s.position_y,
          type: s.shape_type,
        })),
        texts: texts.map((t) => ({
          id: t.id,
          x: t.position_x,
          y: t.position_y,
          content: t.content,
        })),
        draws: draws.length,
        images: images.length,
        stickers: stickers.length,
        audios: audios.length,
      });
    }

    return (
      <G>
        {(() => {
          const segments = new Set<string>();
          const parentIds = new Set<string>();
          
          for (const draw of draws) {
            const match = draw.id.match(/^(.+?)_seg_\d+_\d+$/);
            if (match) {
              segments.add(draw.id);
              parentIds.add(match[1]); 
            }
          }
          
          const filteredDraws = draws.filter((d) => {
            if (segments.has(d.id)) return true;
            if (parentIds.has(d.id)) return false;
            return true;
          });
          
          return filteredDraws.map((d) => (
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
          ));
        })()}

        {/* Shapes */}
        {shapes.map((sh) => renderShape(sh))}

        {/* Images */}
        {images.map((im) => {
          const w = scaleW(im.width, 100);
          const h = scaleH(im.height, 100);
          const { cx, cy } = getCenter(im.position_x, im.position_y, w, h);
          const x = cx - w / 2;
          const y = cy - h / 2;
          const transform = im.rotation ? `rotate(${im.rotation} ${cx} ${cy})` : undefined;
          const src =
            im.uri && (im.uri.startsWith("http") || im.uri.startsWith("file"))
              ? { uri: im.uri }
              : undefined;

          if (!src) {
            return (
              <Rect
                key={`image-placeholder-${im.id}`}
                x={x}
                y={y}
                width={w}
                height={h}
                fill="rgba(200,200,200,0.5)"
                stroke="#ccc"
                strokeWidth={1}
                transform={transform}
              />
            );
          }

          return (
            <SvgImage
              key={`image-${im.id}`}
              x={x}
              y={y}
              width={w}
              height={h}
              href={src as any}
              preserveAspectRatio="xMidYMid slice"
              transform={transform}
            />
          );
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
            return (
              <Rect
                key={`st-placeholder-${st.id}`}
                x={x}
                y={y}
                width={w}
                height={h}
                fill="rgba(200,200,200,0.3)"
                stroke="#ccc"
                strokeWidth={1}
                strokeDasharray="4,2"
                transform={transform}
              />
            );
          }

          return (
            <SvgImage
              key={`sticker-${st.id}`}
              x={x}
              y={y}
              width={w}
              height={h}
              href={asset as any}
              transform={transform}
            />
          );
        })}

        {/* Audios */}
        {audios.map((audio) => {
          const audioSize = 30 * uniformScale;
          const { cx, cy } = getCenter(audio.position_x, audio.position_y, audioSize, audioSize);
          return <G key={`audio-${audio.id}`}>{renderAudioIcon(cx, cy, audioSize)}</G>;
        })}

        {/* Texts */}
{texts.map((t) => {
  const fontSize = Math.max(6, (t.font_size ?? 16) * uniformScale);
  const { cx, cy } = getCenter(t.position_x, t.position_y, 0, 0);
  const rotation = t.rotation ?? 0;
  const transform = rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined;

  // Obtener font family
  const fontFamily =
    fontFamilyMap[t.font_family as TextFont] ?? t.font_family ?? undefined;

  // Dividir el texto en líneas
  const lines = t.content.split('\n');
  const lineHeight = fontSize * 1.2; // Espacio entre líneas

  return (
    <G key={`text-${t.id}`} transform={transform}>
      {lines.map((line, index) => (
        <SvgText
          key={`${t.id}-line-${index}`}
          x={cx}
          y={cy + (index * lineHeight)}
          fontSize={fontSize}
          fill={safeColor(t.color, "#111")}
          fontFamily={fontFamily}
          textAnchor="start"
          alignmentBaseline="hanging"
        >
          {line}
        </SvgText>
      ))}
    </G>
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
      {containerSize.width > 0 &&
        containerSize.height > 0 &&
        safePattern !== "none" && (
          <View style={localStyles.patternLayer}>
            <PagePatternBackground
              pattern={safePattern}
              width={containerSize.width}
              height={containerSize.height}
              color="#888888"
            />
          </View>
        )}

      {/* Contenido SVG */}
      <View style={localStyles.contentLayer}>
        <Svg
          width="100%"
          height="100%"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
        >
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  contentLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});