import { useEffect, useRef, useState } from "react";
import { Circle, Group, Layer, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import { DemoCard } from "../components/demo-card";

const STAGE_HEIGHT = 620;
const NOTE_WIDTH = 180;
const NOTE_HEIGHT = 260;
const NOTE_BODY_WIDTH = 132;
const ROTATION_MIN = -10;
const ROTATION_MAX = 10;
const TAPE_ROTATION_MIN = -12;
const TAPE_ROTATION_MAX = 12;
const MIN_STAGE_WIDTH = 320;
const STAGE_SIDE_PADDING = 24;
const DELETE_BUTTON_RADIUS = 13;
const TAPE_WIDTH = 26;
const TAPE_HEIGHT = 42;

/**
 * 便签配色定义
 */
type StickyPalette = {
  /** 便签背景色 */
  background: string;
  /** 主文字颜色 */
  text: string;
  /** 辅助文字颜色 */
  accentText: string;
};

/**
 * 胶带样式定义
 */
type TapeStyle = {
  /** 胶带填充色 */
  fill: string;
  /** 胶带透明度 */
  opacity: number;
  /** 胶带旋转角度 */
  rotation: number;
};

/**
 * 便签数据
 */
type StickyNote = {
  /** 唯一标识 */
  id: number;
  /** 分类标签 */
  topic: string;
  /** 标题 */
  title: string;
  /** 正文 */
  body: string;
  /** 页脚文案 */
  footer: string;
  /** 横坐标 */
  x: number;
  /** 纵坐标 */
  y: number;
  /** 倾斜角度 */
  rotation: number;
  /** 配色方案 */
  palette: StickyPalette;
  /** 顶部胶带 */
  topTape: TapeStyle;
  /** 底部胶带 */
  bottomTape: TapeStyle;
};

/**
 * 预置便签内容
 */
type StickyTemplate = Omit<
  StickyNote,
  "id" | "rotation" | "palette" | "topTape" | "bottomTape"
>;

/**
 * 便签色板
 */
const STICKY_PALETTES: StickyPalette[] = [
  { background: "#f6f0d8", text: "#191919", accentText: "#5e5847" },
  { background: "#0f8cdc", text: "#f4fbff", accentText: "#d4ecff" },
  { background: "#f4b8c2", text: "#2d1d22", accentText: "#6d4b54" },
  { background: "#232323", text: "#faf7f1", accentText: "#c9c2b8" },
  { background: "#b86a3d", text: "#fff6e9", accentText: "#f6d9bf" },
];

/**
 * 胶带色板
 * 采用半透明暖黄、雾蓝、浅绿等贴纸质感颜色。
 */
const TAPE_COLORS = [
  "rgba(227, 196, 73, 0.48)",
  "rgba(157, 210, 235, 0.44)",
  "rgba(185, 221, 179, 0.42)",
  "rgba(242, 196, 170, 0.42)",
  "rgba(223, 214, 166, 0.4)",
];

/**
 * 内置便签模板
 */
const STICKY_TEMPLATES: StickyTemplate[] = [
  {
    topic: "TOPIC / START",
    title: "开始给用",
    body: "先把思路本流程走通，再逐步补充状态与交互。",
    footer: "边做边验",
    x: 92,
    y: 86,
  },
  {
    topic: "TOPIC / WORK",
    title: "发进第一个任务",
    body: "拆出最小页面骨架，确认拖拽、层级和随机角度行为。",
    footer: "Focus 1",
    x: 308,
    y: 172,
  },
  {
    topic: "MAIN AGENT",
    title: "主 Agent",
    body: "常带需求并拆任务，拖拽或点击后需要置顶，确保层级可控。",
    footer: "置顶优先",
    x: 554,
    y: 42,
  },
  {
    topic: "PATTERN",
    title: "常用模板",
    body: "配色从预置集合中随机抽取，倾斜角度保持轻微波动。",
    footer: "Rotate softly",
    x: 646,
    y: 330,
  },
  {
    topic: "ORCHESTRATE",
    title: "任务编排",
    body: "新增标签按钮用于快速追加卡片，便于后续继续试验更多交互。",
    footer: "Queue next",
    x: 808,
    y: 138,
  },
];

/**
 * 在给定区间内生成随机整数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机整数
 */
function randomInt(min: number, max: number) {
  const delta = max - min + 1;
  return Math.floor(Math.random() * delta) + min;
}

/**
 * 在给定区间内生成带小数的随机数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机浮点数
 */
function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/**
 * 生成轻微随机倾斜角度
 * @returns 便签倾斜角度
 */
function randomRotation() {
  return Number(randomFloat(ROTATION_MIN, ROTATION_MAX).toFixed(2));
}

/**
 * 生成胶带旋转角度
 * @returns 胶带的轻微随机偏转
 */
function randomTapeRotation() {
  return Number(randomFloat(TAPE_ROTATION_MIN, TAPE_ROTATION_MAX).toFixed(2));
}

/**
 * 随机获取一个便签色板
 * @returns 配色方案
 */
function randomPalette() {
  return STICKY_PALETTES[randomInt(0, STICKY_PALETTES.length - 1)];
}

/**
 * 随机生成一段胶带样式
 * @returns 稳定的胶带渲染参数
 */
function randomTapeStyle(): TapeStyle {
  return {
    fill: TAPE_COLORS[randomInt(0, TAPE_COLORS.length - 1)],
    // 提高不透明度，让胶带本体更明显，但仍保留材质透感
    opacity: Number(randomFloat(0.72, 0.86).toFixed(2)),
    rotation: randomTapeRotation(),
  };
}

/**
 * 基于模板创建便签实体
 * @param id 便签唯一标识
 * @param template 便签模板
 * @returns 可渲染的便签数据
 */
function createStickyNote(id: number, template: StickyTemplate): StickyNote {
  return {
    ...template,
    id,
    rotation: randomRotation(),
    palette: randomPalette(),
    topTape: randomTapeStyle(),
    bottomTape: randomTapeStyle(),
  };
}

/**
 * 生成初始便签集合
 * @returns 带随机配色和角度的初始便签
 */
function createInitialNotes() {
  return STICKY_TEMPLATES.map((template, index) => createStickyNote(index + 1, template));
}

/**
 * 将某个便签移动到数组末尾，使其成为视觉顶层
 * @param notes 当前便签列表
 * @param id 需要置顶的便签 id
 * @returns 重新排序后的便签列表
 */
function bringNoteToFront(notes: StickyNote[], id: number) {
  const activeNote = notes.find((note) => note.id === id);

  if (!activeNote) {
    return notes;
  }

  return [...notes.filter((note) => note.id !== id), activeNote];
}

/**
 * 更新便签位置，并在拖拽结束后刷新它的倾斜角度
 * @param notes 当前便签列表
 * @param id 便签 id
 * @param position 新坐标
 * @returns 更新坐标和角度后的便签列表
 */
function updateNotePosition(notes: StickyNote[], id: number, position: { x: number; y: number }) {
  return notes.map((note) =>
    note.id === id
      ? {
          ...note,
          x: position.x - NOTE_WIDTH / 2,
          y: position.y - NOTE_HEIGHT / 2,
          rotation: randomRotation(),
        }
      : note,
  );
}

/**
 * 删除指定便签
 * @param notes 当前便签列表
 * @param id 便签 id
 * @returns 删除后的便签列表
 */
function removeNote(notes: StickyNote[], id: number) {
  return notes.filter((note) => note.id !== id);
}

/**
 * 便签墙 demo 页
 * @returns 支持拖拽和置顶的便签墙页面
 */
export function StickyNotesDemoPage() {
  const [notes, setNotes] = useState<StickyNote[]>(() => createInitialNotes());
  const [nextId, setNextId] = useState(() => STICKY_TEMPLATES.length + 1);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(960);

  useEffect(() => {
    const panelElement = panelRef.current;

    if (!panelElement) {
      return;
    }

    const currentPanelElement = panelElement;

    /**
     * 将容器可用宽度同步到 Stage，避免画布固定宽度导致无法撑满
     */
    function syncStageWidth() {
      const nextWidth = Math.max(
        MIN_STAGE_WIDTH,
        currentPanelElement.clientWidth - STAGE_SIDE_PADDING,
      );
      setStageWidth(nextWidth);
    }

    syncStageWidth();

    const resizeObserver = new ResizeObserver(() => {
      syncStageWidth();
    });

    resizeObserver.observe(currentPanelElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * 置顶指定便签
   * @param id 便签 id
   */
  function handleBringToFront(id: number) {
    setNotes((currentNotes) => bringNoteToFront(currentNotes, id));
  }

  /**
   * 关闭便签删除按钮
   */
  function handleHideDeleteButton() {
    setDeleteTargetId(null);
  }

  /**
   * 新建一个便签，并将它直接放到顶层
   */
  function handleCreateNote() {
    const newNote = createStickyNote(nextId, {
      topic: "NEW NOTE",
      title: `新标签 ${nextId}`,
      body: "这里可以继续写你的 Konva 试验内容，例如节点说明、操作记录或布局草图。",
      footer: "Draft",
      x: randomInt(80, 720),
      y: randomInt(90, 300),
    });

    setNotes((currentNotes) => [...currentNotes, newNote]);
    setNextId((currentId) => currentId + 1);
    setDeleteTargetId(null);
  }

  /**
   * 在拖拽结束后提交便签位置
   * @param id 便签 id
   * @param event Konva 拖拽事件
   */
  function handleDragEnd(id: number, event: Konva.KonvaEventObject<DragEvent>) {
    const position = event.target.position();

    setNotes((currentNotes) => updateNotePosition(currentNotes, id, position));
    setDeleteTargetId(null);
  }

  /**
   * 删除指定便签
   * @param id 便签 id
   */
  function handleDeleteNote(id: number) {
    setNotes((currentNotes) => removeNote(currentNotes, id));
    setDeleteTargetId((currentId) => (currentId === id ? null : currentId));
  }

  return (
    <DemoCard
      title="便签墙 Demo"
      description="模拟一组带随机倾斜和随机配色的便签卡片，支持拖拽、点击置顶和外部新增。"
    >
      <div className="sticky-toolbar">
        <div className="sticky-toolbar-copy">
          <span>便签数量</span>
          <strong>{notes.length}</strong>
        </div>
        <button className="create-note-button" type="button" onClick={handleCreateNote}>
          新建标签
        </button>
      </div>

      <div ref={panelRef} className="canvas-panel sticky-wall-panel">
        <Stage
          width={stageWidth}
          height={STAGE_HEIGHT}
          className="konva-stage sticky-wall-stage"
          onMouseDown={(event) => {
            // 只在点击空白画布时关闭删除按钮，避免误伤按钮自身点击
            if (event.target === event.target.getStage()) {
              handleHideDeleteButton();
            }
          }}
          onTouchStart={(event) => {
            if (event.target === event.target.getStage()) {
              handleHideDeleteButton();
            }
          }}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={stageWidth}
              height={STAGE_HEIGHT}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: stageWidth, y: STAGE_HEIGHT }}
              fillLinearGradientColorStops={[0, "#faf4eb", 0.56, "#f7f0e8", 1, "#efe6dc"]}
              onMouseDown={() => {
                handleHideDeleteButton();
              }}
              onTouchStart={() => {
                handleHideDeleteButton();
              }}
            />

            {notes.map((note) => (
              <Group
                key={note.id}
                x={note.x + NOTE_WIDTH / 2}
                y={note.y + NOTE_HEIGHT / 2}
                offsetX={NOTE_WIDTH / 2}
                offsetY={NOTE_HEIGHT / 2}
                rotation={note.rotation}
                draggable
                onClick={(event) => {
                  // 右键流程不应触发“关闭删除按钮”的普通点击逻辑
                  if (event.evt.button === 2) {
                    return;
                  }

                  handleBringToFront(note.id);
                  handleHideDeleteButton();
                }}
                onTap={() => {
                  handleBringToFront(note.id);
                  handleHideDeleteButton();
                }}
                onMouseDown={(event) => {
                  // 右键按下立即进入删除态，避免必须按住右键才看得到按钮
                  if (event.evt.button === 2) {
                    event.evt.preventDefault();
                    handleBringToFront(note.id);
                    setDeleteTargetId(note.id);
                  }
                }}
                onContextMenu={(event) => {
                  // 仅拦截浏览器默认右键菜单，显示逻辑放到右键按下时处理
                  event.evt.preventDefault();
                }}
                onDragStart={() => {
                  handleBringToFront(note.id);
                  handleHideDeleteButton();
                }}
                onDragEnd={(event) => {
                  handleDragEnd(note.id, event);
                }}
              >
                <Rect
                  width={NOTE_WIDTH}
                  height={NOTE_HEIGHT}
                  cornerRadius={3}
                  fill={note.palette.background}
                  stroke="rgba(255, 255, 255, 0.36)"
                  strokeWidth={1}
                  shadowColor="#5a4130"
                  shadowBlur={28}
                  shadowOffset={{ x: 10, y: 18 }}
                  shadowOpacity={0.28}
                />
                <Text
                  x={18}
                  y={18}
                  width={NOTE_BODY_WIDTH}
                  text={note.topic}
                  fontSize={11}
                  fontStyle="bold"
                  letterSpacing={1}
                  fill={note.palette.accentText}
                />
                <Text
                  x={18}
                  y={42}
                  width={NOTE_BODY_WIDTH}
                  text={note.title}
                  fontSize={32}
                  lineHeight={1.06}
                  fontStyle="bold"
                  fill={note.palette.text}
                />
                <Text
                  x={18}
                  y={114}
                  width={NOTE_BODY_WIDTH}
                  text={note.body}
                  fontSize={15}
                  lineHeight={1.6}
                  fill={note.palette.text}
                />
                <Text
                  x={18}
                  y={220}
                  width={NOTE_BODY_WIDTH}
                  text={note.footer}
                  fontSize={12}
                  fontStyle="bold"
                  fill={note.palette.accentText}
                />
                {/* 胶带在同一个便签组内晚于底板渲染，确保它压在便签上方但不跨便签串层 */}
                <Rect
                  x={NOTE_WIDTH / 2 - TAPE_WIDTH / 2}
                  y={-18}
                  width={TAPE_WIDTH}
                  height={TAPE_HEIGHT}
                  rotation={note.topTape.rotation}
                  fill={note.topTape.fill}
                  opacity={note.topTape.opacity}
                  cornerRadius={2}
                />
                <Rect
                  x={NOTE_WIDTH / 2 - TAPE_WIDTH / 2}
                  y={NOTE_HEIGHT - 16}
                  width={TAPE_WIDTH}
                  height={TAPE_HEIGHT}
                  rotation={note.bottomTape.rotation}
                  fill={note.bottomTape.fill}
                  opacity={note.bottomTape.opacity}
                  cornerRadius={2}
                />
                {deleteTargetId === note.id ? (
                  <Group
                    x={NOTE_WIDTH - 18}
                    y={18}
                    onClick={(event) => {
                      event.cancelBubble = true;
                      handleDeleteNote(note.id);
                    }}
                    onTap={(event) => {
                      event.cancelBubble = true;
                      handleDeleteNote(note.id);
                    }}
                  >
                    {/* 删除按钮固定在右上角，避免和便签正文交互混淆 */}
                    <Circle
                      radius={DELETE_BUTTON_RADIUS}
                      fill="#fff8f1"
                      stroke="rgba(78, 43, 29, 0.2)"
                      strokeWidth={1}
                      shadowColor="rgba(43, 30, 20, 0.18)"
                      shadowBlur={10}
                      shadowOffset={{ x: 0, y: 3 }}
                      shadowOpacity={0.28}
                    />
                    <Text
                      x={-6}
                      y={-8}
                      width={12}
                      align="center"
                      text="×"
                      fontSize={18}
                      fontStyle="bold"
                      fill="#7a3f2f"
                    />
                  </Group>
                ) : null}
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
    </DemoCard>
  );
}
