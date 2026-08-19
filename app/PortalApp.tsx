"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import ApplianceStudio from "./ApplianceStudio";
import { getCloudStatus, setCloudKey } from "./cloudSync";
import {
  fileToDataUrl,
  listRecords,
  LocalRecord,
  removeRecord,
  saveRecord,
} from "./localDb";

type Section =
  | "home"
  | "smart"
  | "appliances"
  | "design"
  | "materials"
  | "furniture"
  | "customization"
  | "doors"
  | "budget"
  | "documents";
type Candidate = {
  id: string;
  category: string;
  brand: string;
  name: string;
  model: string;
  size: string;
  install?: string;
  price: number;
  image: string;
  note: string;
  url?: string;
};
type QuoteRow = {
  id: string;
  category: string;
  name: string;
  detail: string;
  value: number;
};

const sections: {
  id: Section;
  no: string;
  title: string;
  short: string;
  stat: string;
}[] = [
  {
    id: "smart",
    no: "01",
    title: "全屋智能",
    short: "场景、点位、风险与验收",
    stat: "6 类系统",
  },
  {
    id: "appliances",
    no: "02",
    title: "家电选型",
    short: "多套方案对比与统一报价",
    stat: "25 件候选",
  },
  {
    id: "design",
    no: "03",
    title: "设计图纸",
    short: "户型、铺贴、厨房与立面",
    stat: "18 张图纸",
  },
  {
    id: "materials",
    no: "04",
    title: "主材选型",
    short: "瓷砖、地板、石材、卫浴与五金",
    stat: "独立候选库",
  },
  {
    id: "furniture",
    no: "05",
    title: "家具软装",
    short: "沙发、床垫、餐桌椅与成品柜",
    stat: "独立候选库",
  },
  {
    id: "customization",
    no: "06",
    title: "全屋定制",
    short: "橱柜、衣柜、木作与柜体报价",
    stat: "独立候选库",
  },
  {
    id: "doors",
    no: "07",
    title: "门窗系统",
    short: "入户门、室内门、窗型与洞口",
    stat: "8 门款 · 11 窗型",
  },
  {
    id: "budget",
    no: "08",
    title: "预算台账",
    short: "按空间、品类与方案汇总",
    stat: "动态计算",
  },
  {
    id: "documents",
    no: "09",
    title: "施工资料",
    short: "交底、安装、验收与合同",
    stat: "本地归档",
  },
];

const doors: Candidate[] = [
  [
    "door-l003",
    "入户门",
    "HAMAN 哈曼",
    "默利斯",
    "FP-L003",
    "洞口尺寸待现场复尺",
    0,
    "renovation/doors/fp-l003.png",
    "免漆秋香木；断桥结构，开启角≥135°",
  ],
  [
    "door-l006",
    "入户门",
    "HAMAN 哈曼",
    "特普利",
    "FP-L006",
    "洞口尺寸待现场复尺",
    0,
    "renovation/doors/fp-l006.png",
    "竖向肌理配铜色中缝，现代感较强",
  ],
  [
    "door-l009",
    "入户门",
    "HAMAN 哈曼",
    "伯斯坦",
    "FP-L009",
    "洞口尺寸待现场复尺",
    0,
    "renovation/doors/fp-l009.png",
    "深木纹与金属中轴，适合暖灰空间",
  ],
  [
    "door-l014",
    "入户门",
    "HAMAN 哈曼",
    "哈格特",
    "FP-L014",
    "洞口尺寸待现场复尺",
    0,
    "renovation/doors/fp-l014.png",
    "艺术青古铜孔纹与鹤纹装饰",
  ],
  [
    "door-l015",
    "入户门",
    "HAMAN 哈曼",
    "西蒙森",
    "FP-L015",
    "洞口尺寸待现场复尺",
    0,
    "renovation/doors/fp-l015.png",
    "岩石纹面板配金属描边，双开视觉",
  ],
  [
    "door-l105",
    "入户门",
    "HAMAN 哈曼",
    "琼楼玉宇",
    "LP-L105",
    "洞口尺寸待现场复尺",
    0,
    "renovation/doors/lp-l105.png",
    "抗氧化表面，回纹装饰，暖白/咖色可定制",
  ],
  [
    "door-x004",
    "入户门",
    "HAMAN 哈曼",
    "扎哈",
    "EP-X004",
    "洞口尺寸待现场复尺",
    0,
    "renovation/doors/ep-x004.png",
    "艺术紫古铜孔纹，隐蔽式拉手",
  ],
  [
    "door-x003",
    "入户门",
    "HAMAN 哈曼",
    "莱利",
    "EP-X003",
    "洞口尺寸待现场复尺",
    0,
    "renovation/doors/ep-x003.png",
    "氟碳漆砂纹宝灰，金色竖向点缀",
  ],
].map(
  ([id, category, brand, name, model, size, price, image, note]) =>
    ({
      id,
      category,
      brand,
      name,
      model,
      size,
      price,
      image,
      note,
    }) as Candidate,
);

const drawings = [
  {
    name: "彩色家具布置总图",
    group: "总平面",
    image: "renovation/drawings/floor-plan-color.jpg",
    note: "整体尺寸 17638 × 12468 mm；作为空间、设备和门洞定位底图",
  },
  {
    name: "户型与设备点位参考",
    group: "总平面",
    image: "renovation/floor-plan.jpg",
    note: "含全屋智能、家电及家具位置参考",
  },
  {
    name: "厅卧室铺贴方案一",
    group: "地面铺贴",
    image: "renovation/drawings/flooring-1.png",
    note: "长城瓷砖方案；施工前必须现场复尺",
  },
  {
    name: "厅卧室铺贴方案二",
    group: "地面铺贴",
    image: "renovation/drawings/flooring-2.png",
    note: "长城瓷砖方案；重点比较对缝与通铺起点",
  },
  {
    name: "厅卧室铺贴方案三",
    group: "地面铺贴",
    image: "renovation/drawings/flooring-3.png",
    note: "长城瓷砖方案；重点比较走廊与客厅连续性",
  },
  {
    name: "厅卧室铺贴方案四",
    group: "地面铺贴",
    image: "renovation/drawings/flooring-4.png",
    note: "长城瓷砖方案；须结合损耗和窄条位置决定",
  },
  {
    name: "厨房铺贴深化",
    group: "厨房",
    image: "renovation/drawings/kitchen-1.png",
    note: "瓦工施工前需与橱柜厂家核对隐藏砖位置",
  },
  {
    name: "卫生间立面方案 A",
    group: "卫生间",
    image: "renovation/drawings/bathroom-option-a.jpg",
    note: "600×1350 竖向排版参考，最终以现场尺寸为准",
  },
  {
    name: "卫生间立面方案 B",
    group: "卫生间",
    image: "renovation/drawings/bathroom-option-b.jpg",
    note: "含淋浴区与门洞关系，施工前复核收口",
  },
  {
    name: "拆除图",
    group: "施工图",
    image: "renovation/drawings/new-world/page-1.webp",
    note: "原墙体、拆除范围与施工边界；开工前与物业及施工方复核",
  },
  {
    name: "砌筑图",
    group: "施工图",
    image: "renovation/drawings/new-world/page-2.webp",
    note: "新建墙体与门洞定位；需结合现场结构和完成面尺寸确认",
  },
  {
    name: "棚面图",
    group: "施工图",
    image: "renovation/drawings/new-world/page-3.webp",
    note: "吊顶造型、标高与检修关系参考",
  },
  {
    name: "悬浮铝型材位置图",
    group: "施工图",
    image: "renovation/drawings/new-world/page-4.webp",
    note: "悬浮顶铝型材位置与连续收口关系",
  },
  {
    name: "灯位图",
    group: "机电点位",
    image: "renovation/drawings/new-world/page-5.webp",
    note: "灯具定位参考；最终需与家具、吊顶及调光回路统一核对",
  },
  {
    name: "开关图",
    group: "机电点位",
    image: "renovation/drawings/new-world/page-6.webp",
    note: "开关、场景面板与控制关系参考",
  },
  {
    name: "插座位置图",
    group: "机电点位",
    image: "renovation/drawings/new-world/page-7.webp",
    note: "强弱电插座定位；需结合家电安装尺寸和柜体深化复核",
  },
  {
    name: "上下水点位位置图",
    group: "机电点位",
    image: "renovation/drawings/new-world/page-8.webp",
    note: "给排水点位参考；施工前核对设备接口、坡度与检修空间",
  },
  {
    name: "平面布置图",
    group: "总平面",
    image: "renovation/drawings/new-world/page-9.webp",
    note: "家具、柜体与空间动线布置总图",
  },
];

const windowReferences = [
  {
    name: "窗型尺寸表 · 第 1 页",
    image: "renovation/windows/window-schedule-1.webp",
    note: "C001 / C002 / C005 / C006 / C007 / C008；90/90 方压线系列",
  },
  {
    name: "窗型尺寸表 · 第 2 页",
    image: "renovation/windows/window-schedule-2.webp",
    note: "C009 / C010 / C011；含 4620 × 1980 mm 大窗组合",
  },
  {
    name: "窗户现场样图",
    image: "renovation/windows/window-sample.webp",
    note: "星空灰窄框样窗与侧开启扇效果参考；颜色以现场光线和实物封样为准",
  },
];

const tileCandidates: Candidate[] = [
  {
    id: "greatwall",
    category: "室内通铺",
    brand: "长城瓷砖",
    name: "厅卧室地面铺贴方案",
    model: "方案 1–4",
    size: "产品规格待清单确认",
    price: 0,
    image: "renovation/drawings/flooring-1.png",
    note: "四种排版方案已录入图纸区；价格、型号和损耗率待补。",
  },
  {
    id: "limosi",
    category: "主卫生间",
    brand: "爱力蒙特",
    name: "利莫斯墙地砖组合",
    model: "C56131RD / C56131Y/J",
    size: "600 × 1350 mm",
    price: 0,
    image: "renovation/tiles/bathroom-quote.png",
    note: "历史备选：墙面25片、花片8片、地面9片。不会自动计价；若重新考虑该品牌，请按最终复尺和实际报价补录。",
  },
  {
    id: "ayers",
    category: "次卫生间",
    brand: "爱力蒙特",
    name: "艾尔斯岩石墙地砖组合",
    model: "C56211R",
    size: "600 × 1350 mm",
    price: 0,
    image: "renovation/drawings/bathroom-option-b.jpg",
    note: "历史备选：墙面16片、地面8片；不会自动计价，加工费按实际发生补录。",
  },
];

const documents = [
  [
    "全屋智能方案",
    "PPTX",
    "docs/全屋智能方案.pptx",
    "控制、遮阳、网络、灯光与施工流程",
  ],
  ["全屋智能预算", "XLS", "docs/全屋智能预算.xls", "原方案设备与安装调试报价"],
  [
    "智能方案评审",
    "DOCX",
    "docs/智能方案评审.docx",
    "问题、删减建议与签单前确认清单",
  ],
  [
    "灯光设计指导",
    "DOCX",
    "docs/灯光设计指导.docx",
    "重点空间调光、色温、回路和验收",
  ],
  [
    "地面铺贴方案 1–4",
    "PDF",
    "docs/地面铺贴方案1-4.pdf",
    "长城瓷砖厅卧室铺贴排版",
  ],
  ["厨房图纸", "PDF", "docs/厨房图纸.pdf", "厨房立面、尺寸与隐藏砖核对"],
  ["原始设计资料", "PDF", "docs/原始设计资料.pdf", "项目原始设计资料归档"],
  [
    "新世界户型施工图 · 9 页",
    "PDF",
    "docs/新世界_户型图_A4单页.pdf",
    "拆除、砌筑、棚面、灯位、开关、插座、上下水与平面布置",
  ],
];

const money = (value: number) =>
  `¥${Math.round(value).toLocaleString("zh-CN")}`;
const optimizedImage = (path: string) =>
  /^(products|renovation)\//.test(path)
    ? path.replace(/\.(png|jpe?g)$/i, ".webp")
    : path;
const readSection = (): Section => {
  const hash = location.hash.replace("#", "") as Section;
  return [
    "smart",
    "appliances",
    "design",
    "materials",
    "furniture",
    "customization",
    "doors",
    "budget",
    "documents",
  ].includes(hash)
    ? hash
    : "home";
};

export default function PortalApp() {
  const [section, setSection] = useState<Section>("home");
  const [selected, setSelected] = useState<string[]>([]);
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<LocalRecord[]>([]);
  const [localDocs, setLocalDocs] = useState<LocalRecord[]>([]);
  const [applianceTotal, setApplianceTotal] = useState(0);
  const [smartTotal, setSmartTotal] = useState(0);

  useEffect(() => {
    const update = () => {
      setSection(readSection());
      scrollTo({ top: 0 });
    };
    const updateApplianceTotal = (event: Event) =>
      setApplianceTotal(
        Number((event as CustomEvent<{ total: number }>).detail?.total || 0),
      );
    const updateSmartTotal = (event: Event) =>
      setSmartTotal(
        Number((event as CustomEvent<{ total: number }>).detail?.total || 0),
      );
    update();
    addEventListener("hashchange", update);
    addEventListener("home-select-updated", updateApplianceTotal);
    addEventListener("yj-smart-updated", updateSmartTotal);
    try {
      setSelected(JSON.parse(localStorage.getItem("yj-selected-v2") || "[]"));
      setItemPrices(
        JSON.parse(localStorage.getItem("yj-item-prices-v2") || "{}"),
      );
      const appliance = JSON.parse(
        localStorage.getItem("home-select-v2") || "null",
      );
      const plan =
        appliance?.plans?.find(
          (p: { id: string }) => p.id === appliance.activePlanId,
        ) || appliance?.plans?.[0];
      if (plan?.items)
        setApplianceTotal(
          Object.values(
            plan.items as Record<string, { qty: number; unitPrice: number }>,
          ).reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
        );
      const smart = JSON.parse(
        localStorage.getItem("yj-smart-studio-v1") || "null",
      );
      if (smart?.items)
        setSmartTotal(
          Object.values(
            smart.items as Record<string, { qty: number; unitPrice: number }>,
          ).reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
        );
    } catch {}
    listRecords("candidate")
      .then(setCustomItems)
      .catch(() => undefined);
    listRecords("document")
      .then(setLocalDocs)
      .catch(() => undefined);
    return () => {
      removeEventListener("hashchange", update);
      removeEventListener("home-select-updated", updateApplianceTotal);
      removeEventListener("yj-smart-updated", updateSmartTotal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSelected = (id: string) =>
    setSelected((current) => {
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      localStorage.setItem("yj-selected-v2", JSON.stringify(next));
      return next;
    });
  const updateItemPrice = (id: string, price: number) =>
    setItemPrices((current) => {
      const next = { ...current, [id]: price };
      localStorage.setItem("yj-item-prices-v2", JSON.stringify(next));
      return next;
    });

  const selectedDoors = doors.filter((item) => selected.includes(item.id));
  const selectedTiles = tileCandidates.filter((item) =>
    selected.includes(item.id),
  );
  const selectedCustom = customItems.filter((item) =>
    selected.includes(item.id),
  );
  const selectedAll = [...selectedDoors, ...selectedTiles, ...selectedCustom];
  const quoteRows: QuoteRow[] = [
    ...(smartTotal
      ? [
          {
            id: "smart-home",
            category: "全屋智能",
            name: "全屋智能当前方案",
            detail: "读取全屋智能选型台当前部件",
            value: smartTotal,
          },
        ]
      : []),
    ...(applianceTotal
      ? [
          {
            id: "appliances",
            category: "家电",
            name: "家电当前愿望单",
            detail: "读取家电选型台当前方案",
            value: applianceTotal,
          },
        ]
      : []),
    ...selectedAll.map((item) => ({
      id: item.id,
      category: item.category || "其他",
      name: `${item.brand || ""} ${item.name}`.trim(),
      detail: item.model || "型号待补",
      value: itemPrices[item.id] ?? item.price ?? 0,
    })),
  ];

  return (
    <main className="yj-app">
      <Topbar section={section} />
      {section === "home" && <HomePage rows={quoteRows} />}
      {section === "smart" && <SmartChoicePage />}
      {section === "appliances" && (
        <div className="yj-appliance-wrap">
          <ApplianceStudio />
        </div>
      )}
      {section === "design" && <DesignPage />}
      {section === "materials" && (
        <CollectionPage
          kind="materials"
          title="主材选型"
          eyebrow="MATERIAL LIBRARY"
          lead="瓷砖、地板、石材、墙面、卫浴与五金独立比较；历史报价只作为候选，不代表已经选定。"
          presets={tileCandidates}
          categories={[
            "瓷砖",
            "地板",
            "石材",
            "墙面材料",
            "卫浴",
            "五金",
            "灯具",
            "窗帘",
            "其他主材",
          ]}
          selected={selected}
          toggle={toggleSelected}
          prices={itemPrices}
          setPrice={updateItemPrice}
          customItems={customItems}
          onChange={setCustomItems}
        />
      )}
      {section === "furniture" && (
        <CollectionPage
          kind="furniture"
          title="家具软装"
          eyebrow="FURNITURE & DECOR"
          lead="沙发、床垫、餐桌椅、成品柜和软装分别记录尺寸、摆位与到家价。"
          presets={[]}
          categories={[
            "沙发",
            "床 / 床垫",
            "餐桌椅",
            "茶几 / 边几",
            "成品柜",
            "书桌 / 椅",
            "户外家具",
            "其他家具",
          ]}
          selected={selected}
          toggle={toggleSelected}
          prices={itemPrices}
          setPrice={updateItemPrice}
          customItems={customItems}
          onChange={setCustomItems}
        />
      )}
      {section === "customization" && (
        <CollectionPage
          kind="customization"
          title="全屋定制"
          eyebrow="WHOLE-HOME CUSTOMIZATION"
          lead="橱柜、衣柜与木作按投影面积、展开面积或整单分别报价，记录板材、五金和安装范围。"
          presets={[]}
          categories={[
            "橱柜",
            "玄关柜",
            "电视柜",
            "衣柜",
            "书柜",
            "浴室柜",
            "阳台柜",
            "护墙 / 木作",
            "其他定制",
          ]}
          selected={selected}
          toggle={toggleSelected}
          prices={itemPrices}
          setPrice={updateItemPrice}
          customItems={customItems}
          onChange={setCustomItems}
        />
      )}
      {section === "doors" && (
        <DoorsPage
          selected={selected}
          toggle={toggleSelected}
          prices={itemPrices}
          setPrice={updateItemPrice}
        />
      )}
      {section === "budget" && <BudgetPage rows={quoteRows} />}
      {section === "documents" && (
        <DocumentsPage records={localDocs} onChange={setLocalDocs} />
      )}
      <MobileNav section={section} />
    </main>
  );
}

function Topbar({ section }: { section: Section }) {
  return (
    <header className="yj-topbar">
      <a className="yj-brand" href="#home">
        <span>YJ</span>
        <div>
          <b>悦景新世界</b>
          <small>20-1-19-1 · 家装项目档案</small>
        </div>
      </a>
      <nav>
        <a className={section === "home" ? "active" : ""} href="#home">
          首页
        </a>
        {sections.map((item) => (
          <a
            className={section === item.id ? "active" : ""}
            key={item.id}
            href={`#${item.id}`}
          >
            {item.title}
          </a>
        ))}
      </nav>
      <CloudStatus />
      <a className="yj-quote-link" href="#budget">
        报价单
      </a>
    </header>
  );
}

function CloudStatus() {
  const initial = getCloudStatus();
  const [status, setStatus] = useState(initial.status);
  const [detail, setDetail] = useState(initial.detail);
  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<{ status: string; detail?: string }>)
        .detail;
      setStatus(next?.status || "未连接");
      setDetail(next?.detail || "");
    };
    addEventListener("yj-cloud-status", update);
    return () => removeEventListener("yj-cloud-status", update);
  }, []);
  const configure = () => {
    const key = prompt(
      "输入悦景项目云端访问口令。口令只保存在当前浏览器。",
      "",
    );
    if (key?.trim()) {
      setCloudKey(key);
      location.reload();
    }
  };
  return (
    <button
      className={`yj-cloud-status ${status === "已同步" ? "online" : ""}`}
      onClick={configure}
      title={detail || "设置跨设备同步"}
    >
      <i />
      {status}
    </button>
  );
}

function MobileNav({ section }: { section: Section }) {
  return (
    <nav className="yj-mobile-nav" aria-label="手机端主导航">
      <a className={section === "home" ? "active" : ""} href="#home">
        首页
      </a>
      <a className={section === "smart" ? "active" : ""} href="#smart">
        智能
      </a>
      <a
        className={section === "appliances" ? "active" : ""}
        href="#appliances"
      >
        家电
      </a>
      <a className={section === "design" ? "active" : ""} href="#design">
        图纸
      </a>
      <a className={section === "materials" ? "active" : ""} href="#materials">
        主材
      </a>
      <a className={section === "furniture" ? "active" : ""} href="#furniture">
        家具
      </a>
      <a
        className={section === "customization" ? "active" : ""}
        href="#customization"
      >
        定制
      </a>
      <a className={section === "doors" ? "active" : ""} href="#doors">
        门
      </a>
      <a className={section === "budget" ? "active" : ""} href="#budget">
        预算
      </a>
      <a className={section === "documents" ? "active" : ""} href="#documents">
        资料
      </a>
    </nav>
  );
}

function PageHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <header className="yj-page-head">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{lead}</span>
    </header>
  );
}

const dashboardColors = [
  "#274b3c",
  "#a46f45",
  "#71816f",
  "#c8a97e",
  "#5f706b",
  "#8c6b59",
  "#b7b2a5",
];
const defaultPhases = [
  "拆除 / 砸墙",
  "砌筑 / 门洞",
  "水电改造",
  "中央空调 / 新风",
  "防水 / 闭水",
  "瓦工 / 瓷砖",
  "吊顶 / 墙面",
  "全屋定制 / 门窗",
  "设备 / 灯具安装",
  "家具软装",
  "调试 / 验收",
].map((name) => ({ name, status: "未开始", note: "" }));
type ProjectPhase = (typeof defaultPhases)[number];

function HomePage({ rows }: { rows: QuoteRow[] }) {
  const [progress, setProgress] = useState(0);
  const [phases, setPhases] = useState<ProjectPhase[]>(defaultPhases);
  const [budget, setBudget] = useState({
    total: 0,
    count: 0,
    missing: 0,
    categories: [] as { name: string; value: number }[],
  });
  useEffect(() => {
    const sync = () => {
      try {
        const manual = JSON.parse(
          localStorage.getItem("yj-manual-budget-v2") || "[]",
        ) as QuoteRow[];
        const overrides = JSON.parse(
          localStorage.getItem("yj-budget-overrides-v2") || "{}",
        ) as Record<string, number>;
        const included = JSON.parse(
          localStorage.getItem("yj-budget-included-v2") || "{}",
        ) as Record<string, boolean>;
        const active = [...rows, ...manual].filter(
          (row) => included[row.id] !== false,
        );
        const grouped = active.reduce<Record<string, number>>((map, row) => {
          const value = overrides[row.id] ?? row.value ?? 0;
          map[row.category || "其他"] =
            (map[row.category || "其他"] || 0) + value;
          return map;
        }, {});
        const ranked = Object.entries(grouped)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
        const categories =
          ranked.length > 6
            ? [
                ...ranked.slice(0, 6),
                {
                  name: "其他",
                  value: ranked
                    .slice(6)
                    .reduce((sum, item) => sum + item.value, 0),
                },
              ]
            : ranked;
        setBudget({
          total: active.reduce(
            (sum, row) => sum + (overrides[row.id] ?? row.value ?? 0),
            0,
          ),
          count: active.length,
          missing: active.filter(
            (row) => !(overrides[row.id] ?? row.value ?? 0),
          ).length,
          categories,
        });
      } catch {
        setBudget({ total: 0, count: 0, missing: 0, categories: [] });
      }
    };
    sync();
    addEventListener("yj-budget-updated", sync);
    return () => removeEventListener("yj-budget-updated", sync);
  }, [rows]);
  useEffect(() => {
    const saved = Number(localStorage.getItem("yj-project-progress-v1") || 0);
    setProgress(Math.min(100, Math.max(0, saved)));
    try {
      const savedPhases = JSON.parse(
        localStorage.getItem("yj-project-phases-v1") || "null",
      );
      if (Array.isArray(savedPhases) && savedPhases.length)
        setPhases(savedPhases);
    } catch {}
  }, []);
  const updateProgress = (value: number) => {
    const next = Math.min(100, Math.max(0, value || 0));
    setProgress(next);
    localStorage.setItem("yj-project-progress-v1", String(next));
  };
  const updatePhase = (
    index: number,
    field: "status" | "note",
    value: string,
  ) =>
    setPhases((current) => {
      const next = current.map((phase, phaseIndex) =>
        phaseIndex === index ? { ...phase, [field]: value } : phase,
      );
      localStorage.setItem("yj-project-phases-v1", JSON.stringify(next));
      return next;
    });
  let cursor = 0;
  const segments = budget.total
    ? budget.categories.map((item, index) => {
        const start = cursor;
        cursor += (item.value / budget.total) * 100;
        return `${dashboardColors[index % dashboardColors.length]} ${start}% ${cursor}%`;
      })
    : ["#ded9cf 0 100%"];
  return (
    <>
      <section className="yj-dashboard">
        <header className="yj-dashboard-head">
          <div>
            <p className="yj-eyebrow">PROJECT COCKPIT · 2026</p>
            <h1>
              悦景新世界
              <br />
              <em>装修项目驾驶舱</em>
            </h1>
            <p>
              预算、进度、图纸和选型持续汇总；数据保存在本机浏览器，可随时手动调整。
            </p>
          </div>
          <div className="yj-dashboard-actions">
            <a href="#budget">打开预算台账</a>
            <a href="#design">查看全部图纸</a>
          </div>
        </header>
        <section className="yj-metric-grid">
          <article>
            <span>目前计入花费</span>
            <strong>{money(budget.total)}</strong>
            <small>来自预算台账的已勾选项目</small>
          </article>
          <article>
            <span>当前进度</span>
            <strong>{progress}%</strong>
            <small>可在下方手动修改</small>
          </article>
          <article>
            <span>计价项目</span>
            <strong>{budget.count}</strong>
            <small>含选型台和手工预算项目</small>
          </article>
          <article>
            <span>待补价格</span>
            <strong>{budget.missing}</strong>
            <small>金额为空或为 0 的已计入项目</small>
          </article>
        </section>
        <section className="yj-dashboard-panels">
          <article className="yj-spend-panel">
            <header>
              <span>各项花费</span>
              <a href="#budget">编辑金额 ↗</a>
            </header>
            <div className="yj-spend-chart">
              <div
                className="yj-donut"
                style={{ background: `conic-gradient(${segments.join(",")})` }}
              >
                <span>
                  <b>{money(budget.total)}</b>
                  <small>当前合计</small>
                </span>
              </div>
              {budget.categories.length ? (
                <ol>
                  {budget.categories.map((item, index) => (
                    <li key={item.name}>
                      <i
                        style={{
                          background:
                            dashboardColors[index % dashboardColors.length],
                        }}
                      />
                      <span>{item.name}</span>
                      <b>{money(item.value)}</b>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="yj-chart-empty">预算台账尚未录入金额</p>
              )}
            </div>
          </article>
          <article className="yj-progress-panel">
            <header>
              <span>整体施工进度</span>
              <small>手动维护</small>
            </header>
            <div className="yj-progress-body">
              <div
                className="yj-progress-ring"
                style={{
                  background: `conic-gradient(var(--green) 0 ${progress}%, #ded9cf ${progress}% 100%)`,
                }}
              >
                <span>
                  <b>{progress}%</b>
                  <small>已完成</small>
                </span>
              </div>
              <div className="yj-progress-editor">
                <label htmlFor="project-progress">拖动更新目前进度</label>
                <input
                  id="project-progress"
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(event) =>
                    updateProgress(Number(event.target.value))
                  }
                />
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(event) =>
                      updateProgress(Number(event.target.value))
                    }
                  />
                  <span>%</span>
                </div>
                <p>进度仅用于项目总览，不会修改预算金额。</p>
              </div>
            </div>
            <div className="yj-phase-timeline">
              <div className="yj-phase-head">
                <b>文字施工进度</b>
                <span>阶段、状态和现场说明均自动保存</span>
              </div>
              {phases.map((phase, index) => (
                <div
                  className={`yj-phase-row status-${phase.status}`}
                  key={phase.name}
                >
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <b>{phase.name}</b>
                  <select
                    value={phase.status}
                    onChange={(event) =>
                      updatePhase(index, "status", event.target.value)
                    }
                    aria-label={`${phase.name}状态`}
                  >
                    <option>未开始</option>
                    <option>进行中</option>
                    <option>已完成</option>
                    <option>暂停</option>
                  </select>
                  <input
                    value={phase.note}
                    onChange={(event) =>
                      updatePhase(index, "note", event.target.value)
                    }
                    placeholder="填写现场进度、日期或待办…"
                    aria-label={`${phase.name}说明`}
                  />
                </div>
              ))}
            </div>
          </article>
          <a className="yj-dashboard-plan" href="#design">
            <img
              src="renovation/drawings/floor-plan-color.webp"
              alt="悦景新世界彩色家具布置图"
              decoding="async"
              fetchPriority="high"
            />
            <div>
              <span>MASTER PLAN</span>
              <b>悦景新世界 20-1-19-1</b>
              <small>总平面 · 17638 × 12468 mm · 18 张图纸</small>
            </div>
          </a>
        </section>
      </section>
      <section className="yj-section yj-index">
        <div className="yj-section-title">
          <p>PROJECT INDEX</p>
          <h2>项目分区</h2>
          <span>每个分区独立管理，最终统一汇总预算</span>
        </div>
        <div className="yj-module-grid">
          {sections.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              <span>{item.no}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.short}</p>
              </div>
              <small>{item.stat}</small>
              <b>↗</b>
            </a>
          ))}
        </div>
      </section>
      <section className="yj-focus">
        <article>
          <p>当前设计重点</p>
          <h2>
            四个重点调光区，
            <br />
            一个统一控制入口。
          </h2>
          <ul>
            <li>客厅 / 餐桌 / 主卧 / 书房分路调光</li>
            <li>卫生间低位夜灯 + 静止存在感应</li>
            <li>墙面按键优先，断网仍可用基础场景</li>
          </ul>
        </article>
        <aside>
          <span>下一步优先级</span>
          <h3>先锁定回路、门洞和设备尺寸，再签主材。</h3>
          <p>补齐逐路灯光表、PoE端口功率、门洞复尺、瓷砖排版和电器安装预留。</p>
        </aside>
      </section>
    </>
  );
}

type SmartPart = {
  id: string;
  ecosystem: "小米" | "涂鸦" | "三翼鸟";
  category: string;
  name: string;
  model: string;
  note: string;
};
type SmartPlanItem = { qty: number; unitPrice: number; rooms: string[] };
const smartEcosystems = [
  {
    id: "小米",
    title: "小米 / 米家",
    protocol: "Matter · 蓝牙 Mesh · Zigbee",
    strength: "零售生态完整、自助扩展方便、设备选择多",
    caution: "跨品牌联动和本地化能力需逐项核实",
  },
  {
    id: "涂鸦",
    title: "涂鸦智能",
    protocol: "Matter · Zigbee · Wi-Fi",
    strength: "品牌与品类覆盖广，适合定制面板和多供应商",
    caution: "不同厂商固件、售后和 App 体验差异较大",
  },
  {
    id: "三翼鸟",
    title: "三翼鸟 / 海尔智家",
    protocol: "UHomeOS · Wi-Fi · 网关",
    strength: "成套交付和服务组织能力强，海尔家电联动方便",
    caution: "生态边界、第三方接入及持续服务费用要写入合同",
  },
] as const;
const smartParts: SmartPart[] = [
  [
    "mi-gateway",
    "小米",
    "控制",
    "多模网关",
    "米家多模网关 2",
    "作为米家设备入口，位置需兼顾覆盖与供电",
  ],
  [
    "mi-panel",
    "小米",
    "控制",
    "智能场景面板",
    "中控屏 / 场景屏候选",
    "墙面实体控制优先，断网保留基础开关",
  ],
  [
    "mi-switch",
    "小米",
    "照明",
    "零火智能开关",
    "1–4 键按回路选型",
    "所有开关底盒预留零线和深底盒",
  ],
  [
    "mi-presence",
    "小米",
    "传感",
    "人体存在传感器",
    "毫米波存在传感器",
    "卫生间、客厅需测试静坐和误触发",
  ],
  [
    "mi-curtain",
    "小米",
    "遮阳",
    "智能窗帘电机",
    "米家窗帘电机候选",
    "复尺轨道长度、电机侧和插座位置",
  ],
  [
    "mi-leak",
    "小米",
    "安防",
    "水浸传感器",
    "米家水浸卫士",
    "厨房、卫生间、净水设备附近布置",
  ],
  [
    "tuya-gateway",
    "涂鸦",
    "控制",
    "Zigbee / Matter 网关",
    "Tuya 网关候选",
    "要求本地场景能力和断网可用说明",
  ],
  [
    "tuya-panel",
    "涂鸦",
    "控制",
    "智能中控屏",
    "涂鸦中控屏候选",
    "确认 OEM 品牌、固件升级和售后主体",
  ],
  [
    "tuya-switch",
    "涂鸦",
    "照明",
    "零火智能开关",
    "涂鸦 Zigbee 开关",
    "按回路数量、负载和调光协议拆分",
  ],
  [
    "tuya-sensor",
    "涂鸦",
    "传感",
    "人体存在传感器",
    "Zigbee / 毫米波候选",
    "在卫生间做静止存在现场测试",
  ],
  [
    "tuya-curtain",
    "涂鸦",
    "遮阳",
    "智能窗帘电机",
    "涂鸦窗帘电机候选",
    "确认电机噪声、轨道和断电手拉",
  ],
  [
    "tuya-air",
    "涂鸦",
    "暖通",
    "空调 / 新风控制器",
    "干接点 / 网关模块",
    "与中央空调厂家协议表逐项核对",
  ],
  [
    "sy-gateway",
    "三翼鸟",
    "控制",
    "全屋智能网关",
    "三翼鸟网关候选",
    "要求提交离线能力、设备上限和协议清单",
  ],
  [
    "sy-panel",
    "三翼鸟",
    "控制",
    "智家中控屏",
    "海尔智家中控屏",
    "明确屏幕、语音、场景和家电控制边界",
  ],
  [
    "sy-switch",
    "三翼鸟",
    "照明",
    "智能开关 / 面板",
    "三翼鸟场景面板",
    "逐路列功率、驱动和墙面按键逻辑",
  ],
  [
    "sy-sensor",
    "三翼鸟",
    "传感",
    "人体 / 环境传感器",
    "智家传感器组合",
    "合同列明型号、数量、点位和验收方法",
  ],
  [
    "sy-appliance",
    "三翼鸟",
    "家电联动",
    "海尔智家联动模块",
    "UHomeOS 家电联动",
    "大型家电仍按产品力选择，不强制统一品牌",
  ],
  [
    "sy-service",
    "三翼鸟",
    "交付",
    "安装调试服务",
    "全屋交付服务",
    "施工、编程、培训和售后费用单独列项",
  ],
].map(
  ([id, ecosystem, category, name, model, note]) =>
    ({ id, ecosystem, category, name, model, note }) as SmartPart,
);
const smartRooms = [
  "玄关",
  "客厅",
  "餐厅",
  "厨房",
  "主卧",
  "次卧",
  "书房",
  "主卫",
  "次卫",
  "阳台",
  "全屋",
];

function SmartChoicePage() {
  const [ecosystem, setEcosystem] = useState<SmartPart["ecosystem"]>("小米");
  const [items, setItems] = useState<Record<string, SmartPlanItem>>({});
  const [roomDraft, setRoomDraft] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("yj-smart-studio-v1") || "null",
      );
      if (saved?.ecosystem) setEcosystem(saved.ecosystem);
      if (saved?.items) setItems(saved.items);
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      "yj-smart-studio-v1",
      JSON.stringify({ ecosystem, items }),
    );
    const total = Object.values(items).reduce(
      (sum, item) => sum + item.qty * item.unitPrice,
      0,
    );
    dispatchEvent(new CustomEvent("yj-smart-updated", { detail: { total } }));
  }, [ecosystem, items, hydrated]);
  const addPart = (part: SmartPart) => {
    const room = roomDraft[part.id] || "全屋";
    setItems((current) => {
      const existing = current[part.id];
      return {
        ...current,
        [part.id]: existing
          ? {
              ...existing,
              qty: existing.qty + 1,
              rooms: [...existing.rooms, room],
            }
          : { qty: 1, unitPrice: 0, rooms: [room] },
      };
    });
  };
  const removePart = (id: string) =>
    setItems((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  const total = Object.values(items).reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0,
  );
  const systems = [
    ["控制与面板", "网关、实体场景面板、智能开关与断网可用性"],
    ["灯光调光", "客厅、餐桌、主卧、书房按回路与驱动重新核对"],
    ["智能遮阳", "窗帘电机、轨道尺寸、电机侧和检修条件"],
    ["全宅网络", "PoE 路由、AP 数量、端口与供电功率"],
    ["安防感知", "水浸、燃气、人体与静止存在传感器"],
    ["空调 / 新风联动", "中央空调、新风、地暖接口协议和本地控制"],
  ];
  return (
    <div className="yj-page">
      <PageHead
        eyebrow="WHOLE-HOME INTELLIGENCE"
        title="全屋智能"
        lead="当前生态与供应商均未确定。这里保存候选方案、点位和验收条款，不代表采用三翼鸟。"
      />
      <section className="yj-smart-studio">
        <div className="yj-section-title">
          <p>ECOSYSTEM PLANNER</p>
          <h2>先选系统，再选部件</h2>
          <span>
            三套生态可切换比较；加入的部件、房间、数量和价格会自动保存并进入统一预算。
          </span>
        </div>
        <div className="yj-ecosystem-grid">
          {smartEcosystems.map((item) => (
            <button
              key={item.id}
              className={ecosystem === item.id ? "active" : ""}
              onClick={() => setEcosystem(item.id)}
            >
              <span>{item.protocol}</span>
              <h3>{item.title}</h3>
              <p>{item.strength}</p>
              <small>{item.caution}</small>
            </button>
          ))}
        </div>
        <div className="yj-smart-workspace">
          <section className="yj-smart-catalog">
            <header>
              <div>
                <b>{ecosystem}部件库</b>
                <span>
                  {
                    smartParts.filter((part) => part.ecosystem === ecosystem)
                      .length
                  }{" "}
                  类候选
                </span>
              </div>
              <strong>{money(total)}</strong>
            </header>
            <div className="yj-smart-part-grid">
              {smartParts
                .filter((part) => part.ecosystem === ecosystem)
                .map((part) => {
                  const selected = items[part.id];
                  return (
                    <article
                      className={selected ? "selected" : ""}
                      key={part.id}
                    >
                      <span>{part.category}</span>
                      <h3>{part.name}</h3>
                      <b>{part.model}</b>
                      <p>{part.note}</p>
                      <label>
                        放置位置
                        <select
                          value={roomDraft[part.id] || "全屋"}
                          onChange={(event) =>
                            setRoomDraft((current) => ({
                              ...current,
                              [part.id]: event.target.value,
                            }))
                          }
                        >
                          {smartRooms.map((room) => (
                            <option key={room}>{room}</option>
                          ))}
                        </select>
                      </label>
                      <button onClick={() => addPart(part)}>
                        {selected
                          ? `再加一个（已有 ${selected.qty}）`
                          : "+ 加入智能方案"}
                      </button>
                    </article>
                  );
                })}
            </div>
          </section>
          <aside className="yj-smart-plan">
            <header>
              <div>
                <span>CURRENT PLAN</span>
                <h3>当前部件与房间</h3>
              </div>
              <strong>{money(total)}</strong>
            </header>
            {Object.entries(items).length ? (
              Object.entries(items).map(([id, item]) => {
                const part = smartParts.find(
                  (candidate) => candidate.id === id,
                );
                if (!part) return null;
                return (
                  <div className="yj-smart-plan-row" key={id}>
                    <div>
                      <b>
                        {part.name} × {item.qty}
                      </b>
                      <span>{item.rooms.join(" / ")}</span>
                    </div>
                    <label>
                      ¥
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice || ""}
                        placeholder="单价"
                        onChange={(event) =>
                          setItems((current) => ({
                            ...current,
                            [id]: {
                              ...current[id],
                              unitPrice: Number(event.target.value),
                            },
                          }))
                        }
                      />
                    </label>
                    <button onClick={() => removePart(id)}>×</button>
                  </div>
                );
              })
            ) : (
              <p className="yj-empty">
                从左侧选择系统部件，并指定放在哪个房间。
              </p>
            )}
          </aside>
        </div>
        <section className="yj-room-simulation">
          <header>
            <span>ROOM SIMULATION</span>
            <h3>各空间放什么</h3>
            <p>这是点位讨论用的模拟，不代替施工图。</p>
          </header>
          <div>
            {smartRooms
              .filter((room) => room !== "全屋")
              .map((room) => {
                const assigned = Object.entries(items).flatMap(([id, item]) => {
                  const part = smartParts.find(
                    (candidate) => candidate.id === id,
                  );
                  return item.rooms
                    .filter((value) => value === room || value === "全屋")
                    .map(() => part?.name || "");
                });
                return (
                  <article key={room}>
                    <b>{room}</b>
                    {assigned.length ? (
                      <p>{assigned.join(" · ")}</p>
                    ) : (
                      <span>暂未放置</span>
                    )}
                  </article>
                );
              })}
          </div>
        </section>
      </section>
      <section className="yj-smart-overview">
        <div>
          <span>历史候选报价</span>
          <strong>¥36,788.50</strong>
          <small>仅供比较，不自动进入预算</small>
        </div>
        <div>
          <span>候选生态</span>
          <strong>开放</strong>
          <small>米家 / 三翼鸟 / 其他方案均可继续比较</small>
        </div>
        <div>
          <span>先行条件</span>
          <strong>布线</strong>
          <small>零线、深底盒、网线、干接点与检修口</small>
        </div>
      </section>
      <div className="yj-drawing-note">
        <b>生态尚未选定</b>
        <span>
          大型家电按产品力独立选择，不为统一品牌强行接入。供应商和协议确认后，再把最终合同金额手工加入预算台账。
        </span>
      </div>
      <section className="yj-card-grid yj-system-grid">
        {systems.map(([title, text], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <section className="yj-split">
        <article>
          <p className="yj-kicker">SCENES</p>
          <h2>场景候选</h2>
          <div className="yj-scene-list">
            {[
              ["日常", "3000K · 主灯60–70%"],
              ["会客", "重点光70% · 人脸清晰"],
              ["观影", "背景光10–15% · 避免全黑"],
              ["用餐", "餐桌65–80% · 周边略暗"],
              ["睡前", "2700K · 3–5秒渐暗"],
              ["起夜", "低位照明1–8%"],
            ].map(([a, b]) => (
              <div key={a}>
                <b>{a}</b>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </article>
        <aside className="yj-risk">
          <p className="yj-kicker">BEFORE CONTRACT</p>
          <h2>签单前确认</h2>
          <ol>
            <li>
              <b>系统边界</b>
              <span>明确谁负责设备、布线、调试和售后。</span>
            </li>
            <li>
              <b>回路与协议</b>
              <span>逐路列功率、驱动、协议和墙面按键。</span>
            </li>
            <li>
              <b>网络容量</b>
              <span>提交 AP、PoE 端口及功率计算。</span>
            </li>
            <li>
              <b>联动验收</b>
              <span>断网、本地控制、静止存在和异常告警逐项测试。</span>
            </li>
          </ol>
        </aside>
      </section>
      <div className="yj-download-row">
        <a href="docs/智能方案评审.docx">下载方案评审</a>
        <a href="docs/灯光设计指导.docx">下载灯光指导</a>
        <a href="docs/全屋智能方案.pptx">查看历史候选方案</a>
      </div>
    </div>
  );
}

function SmartPage() {
  const systems = [
    ["控制系统", "网关、4寸屏、场景面板与智能开关"],
    ["智能照明", "客厅、餐桌、主卧、书房 10–12 个重点回路"],
    ["智能遮阳", "3 套窗帘电机，现场复尺轨道与电机侧"],
    ["全宅网络", "PoE 路由 + 墙壁 AP，端口与功率须重算"],
    ["智能安防", "水浸、燃气、人体存在等传感器"],
    ["本地场景", "墙面按键优先，断网保留日常/全关"],
  ];
  return (
    <div className="yj-page">
      <PageHead
        eyebrow="WHOLE-HOME INTELLIGENCE"
        title="全屋智能"
        lead="把销售方案拆成可执行的场景、点位、责任和验收条款。"
      />
      <section className="yj-smart-overview">
        <div>
          <span>原方案预算</span>
          <strong>¥36,788.50</strong>
          <small>设备 ¥31,990 + 15% 安装调试费</small>
        </div>
        <div>
          <span>建议删减</span>
          <strong>≥ ¥6,068.55</strong>
          <small>普通灯具段先剔除，智能灯光按区按路重做</small>
        </div>
        <div>
          <span>重点调光</span>
          <strong>4 个区域</strong>
          <small>客厅 / 餐桌 / 主卧 / 书房</small>
        </div>
      </section>
      <div className="yj-drawing-note">
        <b>生态选择记录</b>
        <span>
          历史讨论结论是：自装与后续自由扩展优先米家骨架；若保留当前海尔/卡萨帝成套交付，则三翼鸟可做控制入口，但大型家电仍按产品力选择，不为统一品牌强行接入。无论选哪套，零线、深底盒、网线、RS485/干接点与墙面实体控制都先预留。
        </span>
      </div>
      <section className="yj-card-grid yj-system-grid">
        {systems.map(([title, text], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <section className="yj-split">
        <article>
          <p className="yj-kicker">SCENES</p>
          <h2>建议场景</h2>
          <div className="yj-scene-list">
            {[
              ["日常", "3000K · 主灯60–70%"],
              ["会客", "重点光70% · 人脸清晰"],
              ["观影", "背景光10–15% · 避免全黑"],
              ["用餐", "餐桌65–80% · 周边略暗"],
              ["睡前", "2700K · 3–5秒渐暗"],
              ["阅读/游戏", "任务光与间接氛围分路"],
              ["起夜/如厕", "2200–2700K · 低位1–8%"],
            ].map(([a, b]) => (
              <div key={a}>
                <b>{a}</b>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </article>
        <aside className="yj-risk">
          <p className="yj-kicker">P0 / P1 RISKS</p>
          <h2>签单前必须解决</h2>
          <ol>
            <li>
              <b>PoE端口矛盾</b>
              <span>预算5口路由却配置5个AP，需提交端口及功率计算。</span>
            </li>
            <li>
              <b>卫生间静止存在</b>
              <span>增加毫米波/静止存在传感器，现场静坐5分钟测试。</span>
            </li>
            <li>
              <b>缺少回路与场景表</b>
              <span>逐路列灯具、功率、驱动、协议、按键与参数。</span>
            </li>
            <li>
              <b>布线未计价</b>
              <span>明确零火、网线、PoE、窗帘电源和检修口责任。</span>
            </li>
          </ol>
        </aside>
      </section>
      <div className="yj-download-row">
        <a href="docs/智能方案评审.docx">下载方案评审</a>
        <a href="docs/灯光设计指导.docx">下载灯光指导</a>
        <a href="docs/全屋智能方案.pptx">查看原始方案</a>
      </div>
    </div>
  );
}

function DesignPage() {
  const [active, setActive] = useState<(typeof drawings)[number] | null>(null);
  const groups = [
    "全部",
    "总平面",
    "施工图",
    "机电点位",
    "地面铺贴",
    "厨房",
    "卫生间",
  ];
  const [group, setGroup] = useState("全部");
  const list =
    group === "全部"
      ? drawings
      : drawings.filter((item) => item.group === group);
  return (
    <div className="yj-page">
      <PageHead
        eyebrow="DESIGN DRAWINGS"
        title="设计图纸"
        lead="图纸直接展示；点击任意图纸可放大查看细节与尺寸。"
      />
      <div className="yj-filter-row">
        {groups.map((item) => (
          <button
            className={group === item ? "active" : ""}
            onClick={() => setGroup(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      <section className="yj-drawing-grid">
        {list.map((item) => (
          <button key={item.name} onClick={() => setActive(item)}>
            <div>
              <img
                src={optimizedImage(item.image)}
                alt={item.name}
                loading="lazy"
                decoding="async"
              />
            </div>
            <span>{item.group}</span>
            <h3>{item.name}</h3>
            <p>{item.note}</p>
          </button>
        ))}
      </section>
      <div className="yj-drawing-note">
        <b>施工边界</b>
        <span>
          长城铺贴图和卫生间立面均为排版参考，不代替现场复尺、损耗计算、收口节点及最终施工确认。
        </span>
      </div>
      {active && (
        <div className="yj-lightbox" onClick={() => setActive(null)}>
          <button onClick={() => setActive(null)}>关闭 ×</button>
          <img
            src={optimizedImage(active.image)}
            alt={active.name}
            decoding="async"
          />
          <footer>
            <b>{active.name}</b>
            <span>{active.note}</span>
          </footer>
        </div>
      )}
    </div>
  );
}

function CandidateCard({
  item,
  selected,
  toggle,
  priceEditor,
}: {
  item: Candidate;
  selected: boolean;
  toggle: () => void;
  priceEditor?: React.ReactNode;
}) {
  const [detail, setDetail] = useState(false);
  return (
    <>
      <article className={`yj-candidate ${selected ? "selected" : ""}`}>
        <button className="yj-candidate-image" onClick={() => setDetail(true)}>
          <img
            src={optimizedImage(item.image)}
            alt={`${item.brand} ${item.name}`}
            loading="lazy"
            decoding="async"
          />
          <span>{item.category}</span>
        </button>
        <div className="yj-candidate-body">
          <small>{item.brand}</small>
          <h3>{item.name}</h3>
          <b>{item.model}</b>
          <dl>
            <div>
              <dt>产品尺寸 / 洞口</dt>
              <dd>{item.size || "待补"}</dd>
            </div>
            <div>
              <dt>安装尺寸 / 预留</dt>
              <dd>{item.install || "待现场复尺"}</dd>
            </div>
          </dl>
          {priceEditor}
          <button className="yj-detail-button" onClick={() => setDetail(true)}>
            查看说明与大图 →
          </button>
          <button onClick={toggle}>
            {selected ? "✓ 已加入愿望单" : "+ 加入愿望单"}
          </button>
        </div>
      </article>
      {detail && (
        <Modal
          title={`${item.brand} · ${item.name}`}
          close={() => setDetail(false)}
        >
          <div className="yj-product-detail">
            <img
              src={optimizedImage(item.image)}
              alt={`${item.brand} ${item.name}`}
            />
            <dl>
              <div>
                <dt>型号</dt>
                <dd>{item.model}</dd>
              </div>
              <div>
                <dt>产品尺寸 / 洞口</dt>
                <dd>{item.size || "待补"}</dd>
              </div>
              <div>
                <dt>安装尺寸 / 预留</dt>
                <dd>{item.install || "待现场复尺"}</dd>
              </div>
              <div>
                <dt>当前价格</dt>
                <dd>{item.price ? money(item.price) : "待补"}</dd>
              </div>
            </dl>
            <p>{item.note || "详细说明待补充。"}</p>
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer">
                打开商品 / 购买链接 ↗
              </a>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

function CollectionPage({
  kind,
  title,
  eyebrow,
  lead,
  presets,
  categories,
  selected,
  toggle,
  prices,
  setPrice,
  customItems,
  onChange,
}: {
  kind: "materials" | "furniture" | "customization";
  title: string;
  eyebrow: string;
  lead: string;
  presets: Candidate[];
  categories: string[];
  selected: string[];
  toggle: (id: string) => void;
  prices: Record<string, number>;
  setPrice: (id: string, price: number) => void;
  customItems: LocalRecord[];
  onChange: (items: LocalRecord[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [customDetail, setCustomDetail] = useState<LocalRecord | null>(null);
  const ownItems = customItems.filter((item) => item.id.startsWith(`${kind}-`));
  const addItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("image") as File;
    const record: LocalRecord = {
      id: `${kind}-${Date.now()}`,
      kind: "candidate",
      name: String(form.get("name") || "未命名候选"),
      category: String(form.get("category") || "其他"),
      brand: String(form.get("brand") || ""),
      model: String(form.get("model") || ""),
      size: String(form.get("size") || ""),
      install: String(form.get("install") || ""),
      price: Number(form.get("price") || 0),
      note: String(form.get("note") || ""),
      url: String(form.get("url") || ""),
      dataUrl: file?.size ? await fileToDataUrl(file) : "",
      createdAt: Date.now(),
    };
    await saveRecord(record);
    onChange([record, ...customItems]);
    setShowForm(false);
    formElement.reset();
  };
  const deleteItem = async (id: string) => {
    await removeRecord(id);
    onChange(customItems.filter((item) => item.id !== id));
  };
  return (
    <div className="yj-page">
      <PageHead eyebrow={eyebrow} title={title} lead={lead} />
      {kind === "materials" && (
        <section className="yj-material-hero">
          <div>
            <img
              src="renovation/tile-living-room.webp"
              alt="客厅地砖光影参考"
              loading="lazy"
              decoding="async"
            />
          </div>
          <article>
            <p className="yj-kicker">HISTORICAL OPTION</p>
            <h2>瓷砖方案仅作为历史候选</h2>
            <p>
              长城与爱力蒙特都不会自动进入预算。你可以继续添加其他品牌，主动加入愿望单后再填写实际到手价。
            </p>
            <a href="#design">查看铺贴图 →</a>
          </article>
        </section>
      )}
      <div className="yj-section-bar">
        <div>
          <h2>候选清单</h2>
          <span>只有主动加入的项目才进入预算</span>
        </div>
        <button onClick={() => setShowForm(true)}>+ 添加{title}候选</button>
      </div>
      <section className="yj-candidate-grid">
        {presets.map((item) => (
          <CandidateCard
            key={item.id}
            item={{ ...item, price: prices[item.id] ?? 0 }}
            selected={selected.includes(item.id)}
            toggle={() => toggle(item.id)}
            priceEditor={
              <label className="yj-price-input">
                实际到手价 ¥
                <input
                  value={prices[item.id] || ""}
                  onChange={(e) => setPrice(item.id, Number(e.target.value))}
                  type="number"
                  min="0"
                  placeholder="不预设"
                />
              </label>
            }
          />
        ))}
        {ownItems.map((item) => (
          <article
            className={`yj-candidate ${selected.includes(item.id) ? "selected" : ""}`}
            key={item.id}
          >
            <button
              type="button"
              className="yj-candidate-image"
              onClick={() => setCustomDetail(item)}
              aria-label={`查看${item.name}详情`}
            >
              {item.dataUrl ? (
                <img
                  src={item.dataUrl}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="yj-image-placeholder">NO IMAGE</div>
              )}
              <span>{item.category}</span>
            </button>
            <div className="yj-candidate-body">
              <small>{item.brand || "用户添加"}</small>
              <h3>{item.name}</h3>
              <b>{item.model || "型号待补"}</b>
              <dl>
                <div>
                  <dt>产品尺寸</dt>
                  <dd>{item.size || "待补"}</dd>
                </div>
                <div>
                  <dt>安装尺寸 / 预留</dt>
                  <dd>{item.install || "待现场确认"}</dd>
                </div>
              </dl>
              <label className="yj-price-input">
                实际到手价 ¥
                <input
                  value={prices[item.id] ?? item.price ?? ""}
                  onChange={(e) => setPrice(item.id, Number(e.target.value))}
                  type="number"
                  min="0"
                  placeholder="不预设"
                />
              </label>
              <button
                type="button"
                className="yj-detail-button"
                onClick={() => setCustomDetail(item)}
              >
                查看说明与大图 →
              </button>
              <p>{item.note}</p>
              {item.url && (
                <a
                  className="yj-inline-link"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  商品 / 购买链接 ↗
                </a>
              )}
              <div className="yj-card-actions">
                <button onClick={() => toggle(item.id)}>
                  {selected.includes(item.id) ? "✓ 已加入" : "+ 加入愿望单"}
                </button>
                <button className="danger" onClick={() => deleteItem(item.id)}>
                  删除
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
      {customDetail && (
        <Modal
          title={`${customDetail.brand || "用户添加"} · ${customDetail.name}`}
          close={() => setCustomDetail(null)}
        >
          <div className="yj-product-detail">
            {customDetail.dataUrl ? (
              <img src={customDetail.dataUrl} alt={customDetail.name} />
            ) : (
              <div className="yj-image-placeholder">NO IMAGE</div>
            )}
            <dl>
              <div>
                <dt>品类</dt>
                <dd>{customDetail.category || "其他"}</dd>
              </div>
              <div>
                <dt>型号</dt>
                <dd>{customDetail.model || "待补"}</dd>
              </div>
              <div>
                <dt>产品尺寸</dt>
                <dd>{customDetail.size || "待补"}</dd>
              </div>
              <div>
                <dt>安装尺寸 / 预留</dt>
                <dd>{customDetail.install || "待现场确认"}</dd>
              </div>
              <div>
                <dt>当前价格</dt>
                <dd>
                  {(prices[customDetail.id] ?? customDetail.price)
                    ? money(prices[customDetail.id] ?? customDetail.price)
                    : "待补"}
                </dd>
              </div>
            </dl>
            <p>{customDetail.note || "详细说明待补充。"}</p>
            {customDetail.url && (
              <a href={customDetail.url} target="_blank" rel="noreferrer">
                打开商品 / 购买链接 ↗
              </a>
            )}
          </div>
        </Modal>
      )}
      {!presets.length && !ownItems.length && (
        <p className="yj-empty">
          这里暂时是空的。点击“添加{title}候选”，从你实际看过的品牌开始记录。
        </p>
      )}
      {showForm && (
        <Modal title={`添加${title}候选`} close={() => setShowForm(false)}>
          <form className="yj-form" onSubmit={addItem}>
            <label>
              品类
              <select name="category">
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              名称
              <input name="name" required />
            </label>
            <label>
              品牌
              <input name="brand" />
            </label>
            <label>
              型号
              <input name="model" />
            </label>
            <label>
              产品尺寸
              <input name="size" placeholder="长 × 宽 × 高 mm" />
            </label>
            <label>
              实际价格
              <input name="price" type="number" min="0" placeholder="可留空" />
            </label>
            <label className="wide">
              安装尺寸 / 预留
              <input
                name="install"
                placeholder="洞口、散热、水电、检修与运输要求"
              />
            </label>
            <label className="wide">
              商品 / 购买链接
              <input name="url" type="url" placeholder="https://…（可留空）" />
            </label>
            <label className="wide">
              图片
              <input name="image" type="file" accept="image/*" />
            </label>
            <label className="wide">
              详情说明
              <textarea name="note" rows={4} />
            </label>
            <div className="wide yj-form-actions">
              <button type="button" onClick={() => setShowForm(false)}>
                取消
              </button>
              <button type="submit">保存候选</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function DoorsPage({
  selected,
  toggle,
  prices,
  setPrice,
}: {
  selected: string[];
  toggle: (id: string) => void;
  prices: Record<string, number>;
  setPrice: (id: string, price: number) => void;
}) {
  const [windowDetail, setWindowDetail] = useState<
    (typeof windowReferences)[number] | null
  >(null);
  return (
    <div className="yj-page">
      <PageHead
        eyebrow="DOOR & OPENING SYSTEM"
        title="门窗系统"
        lead="门款独立对比；价格、洞口、开启方向、锁体和收口在复尺后逐项补齐。"
      />
      <div className="yj-door-guidance">
        <div>
          <b>01 · 先复尺</b>
          <span>墙厚、洞口宽高、门槛高度、外开/内开及入户电梯运输条件</span>
        </div>
        <div>
          <b>02 · 再确认</b>
          <span>断桥结构、填充、合页、锁体、智能锁、开门角度与保修</span>
        </div>
        <div>
          <b>03 · 最后定色</b>
          <span>与玄关木饰面、柜门、地砖和金属件放在同一光线下看</span>
        </div>
      </div>
      <section className="yj-candidate-grid yj-door-grid">
        {doors.map((item) => (
          <CandidateCard
            key={item.id}
            item={{ ...item, price: prices[item.id] || 0 }}
            selected={selected.includes(item.id)}
            toggle={() => toggle(item.id)}
            priceEditor={
              <label className="yj-price-input">
                补录到手价 ¥
                <input
                  value={prices[item.id] || ""}
                  onChange={(e) => setPrice(item.id, Number(e.target.value))}
                  type="number"
                  min="0"
                  placeholder="待询价"
                />
              </label>
            }
          />
        ))}
      </section>
      <section className="yj-window-section">
        <div className="yj-section-title">
          <p>WINDOW SCHEDULE</p>
          <h2>窗型图与现场样窗</h2>
          <span>
            点击图片可放大查看窗号、开启方式和尺寸；最终生产尺寸必须以厂家复尺单为准。
          </span>
        </div>
        <div className="yj-window-grid">
          {windowReferences.map((item) => (
            <button key={item.name} onClick={() => setWindowDetail(item)}>
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                decoding="async"
              />
              <div>
                <b>{item.name}</b>
                <span>{item.note}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
      {windowDetail && (
        <div className="yj-lightbox" onClick={() => setWindowDetail(null)}>
          <button onClick={() => setWindowDetail(null)}>关闭 ×</button>
          <img
            src={windowDetail.image}
            alt={windowDetail.name}
            decoding="async"
          />
          <footer>
            <b>{windowDetail.name}</b>
            <span>{windowDetail.note}</span>
          </footer>
        </div>
      )}
    </div>
  );
}

function BudgetPage({ rows }: { rows: QuoteRow[] }) {
  const [manual, setManual] = useState<QuoteRow[]>([]);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    try {
      setManual(
        JSON.parse(localStorage.getItem("yj-manual-budget-v2") || "[]"),
      );
      setOverrides(
        JSON.parse(localStorage.getItem("yj-budget-overrides-v2") || "{}"),
      );
      setIncluded(
        JSON.parse(localStorage.getItem("yj-budget-included-v2") || "{}"),
      );
    } catch {}
  }, []);
  const allRows = [...rows, ...manual];
  const valueOf = (row: QuoteRow) => overrides[row.id] ?? row.value;
  const isIncluded = (row: QuoteRow) => included[row.id] !== false;
  const total = allRows
    .filter(isIncluded)
    .reduce((sum, row) => sum + valueOf(row), 0);
  const persist = (key: string, value: unknown) =>
    localStorage.setItem(key, JSON.stringify(value));
  const notify = () =>
    queueMicrotask(() => dispatchEvent(new CustomEvent("yj-budget-updated")));
  const updateValue = (id: string, value: number) =>
    setOverrides((current) => {
      const next = { ...current, [id]: value };
      persist("yj-budget-overrides-v2", next);
      notify();
      return next;
    });
  const toggle = (id: string) =>
    setIncluded((current) => {
      const next = { ...current, [id]: current[id] === false };
      persist("yj-budget-included-v2", next);
      notify();
      return next;
    });
  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = [
      ...manual,
      {
        id: `budget-${Date.now()}`,
        category: String(form.get("category") || "其他"),
        name: String(form.get("name") || "未命名项目"),
        detail: String(form.get("detail") || ""),
        value: Number(form.get("value") || 0),
      },
    ];
    setManual(next);
    persist("yj-manual-budget-v2", next);
    notify();
    setShowForm(false);
  };
  const remove = (id: string) => {
    const next = manual.filter((row) => row.id !== id);
    setManual(next);
    persist("yj-manual-budget-v2", next);
    notify();
  };
  const exportCsv = () => {
    const body = [
      ["计入", "分类", "项目", "说明", "金额"],
      ...allRows.map((row) => [
        isIncluded(row) ? "是" : "否",
        row.category,
        row.name,
        row.detail,
        String(valueOf(row) || ""),
      ]),
      ["", "", "合计", "", String(total)],
    ];
    const csv = `\uFEFF${body.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    a.download = "悦景新世界-装修预算.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="yj-page">
      <PageHead
        eyebrow="UNIFIED QUOTATION"
        title="预算台账"
        lead="没有默认品牌和默认金额。只有你主动选择或手工添加的项目才出现，所有价格都可以覆盖修改。"
      />
      <section className="yj-budget-hero">
        <div>
          <span>当前报价合计</span>
          <strong>{money(total)}</strong>
          <small>{allRows.length} 个项目 · 未填价格按 0 计算</small>
        </div>
        <aside>
          <p>
            全屋智能、瓷砖、家具和全屋定制均不预设品牌。确认供应商后，可在这里手工新增一条，也可以从各自候选库加入。
          </p>
        </aside>
      </section>
      <div className="yj-budget-actions">
        <button onClick={() => setShowForm(true)}>+ 添加预算项目</button>
        <button onClick={exportCsv}>导出 CSV（Excel 可打开）</button>
      </div>
      {allRows.length ? (
        <section className="yj-budget-table">
          <header>
            <span>计入</span>
            <b>分类 / 项目</b>
            <em>说明</em>
            <strong>可编辑金额</strong>
          </header>
          {allRows.map((row) => (
            <div key={row.id} className={isIncluded(row) ? "included" : ""}>
              <span>
                <input
                  type="checkbox"
                  checked={isIncluded(row)}
                  onChange={() => toggle(row.id)}
                  aria-label={`计入${row.name}`}
                />
              </span>
              <b>
                <small>{row.category}</small>
                {row.name}
              </b>
              <em>{row.detail || "—"}</em>
              <strong>
                <label>
                  ¥{" "}
                  <input
                    type="number"
                    min="0"
                    value={valueOf(row) || ""}
                    placeholder="待补"
                    onChange={(event) =>
                      updateValue(row.id, Number(event.target.value))
                    }
                  />
                </label>
                {row.id.startsWith("budget-") && (
                  <button onClick={() => remove(row.id)}>删除</button>
                )}
              </strong>
            </div>
          ))}
          <footer>
            <span />
            <b>当前总计</b>
            <em>以最终合同、复尺与实际发生为准</em>
            <strong>{money(total)}</strong>
          </footer>
        </section>
      ) : (
        <p className="yj-empty">
          报价单现在是空的。请先从各分区加入候选，或手工添加一个预算项目。
        </p>
      )}
      {showForm && (
        <Modal title="添加预算项目" close={() => setShowForm(false)}>
          <form className="yj-form" onSubmit={add}>
            <label>
              分类
              <select name="category">
                <option>全屋智能</option>
                <option>家电</option>
                <option>主材</option>
                <option>家具</option>
                <option>全屋定制</option>
                <option>门窗</option>
                <option>施工</option>
                <option>其他</option>
              </select>
            </label>
            <label>
              项目名称
              <input name="name" required />
            </label>
            <label className="wide">
              品牌 / 型号 / 报价说明
              <input name="detail" />
            </label>
            <label className="wide">
              金额
              <input name="value" type="number" min="0" placeholder="可留空" />
            </label>
            <div className="wide yj-form-actions">
              <button type="button" onClick={() => setShowForm(false)}>
                取消
              </button>
              <button type="submit">加入报价单</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function DocumentsPage({
  records,
  onChange,
}: {
  records: LocalRecord[];
  onChange: (items: LocalRecord[]) => void;
}) {
  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file") as File;
    if (!file?.size) return;
    const record: LocalRecord = {
      id: `doc-${Date.now()}`,
      kind: "document",
      name: String(form.get("name") || file.name),
      note: String(form.get("note") || ""),
      fileName: file.name,
      mime: file.type,
      dataUrl: await fileToDataUrl(file),
      createdAt: Date.now(),
    };
    await saveRecord(record);
    onChange([record, ...records]);
    formElement.reset();
  };
  const remove = async (id: string) => {
    await removeRecord(id);
    onChange(records.filter((item) => item.id !== id));
  };
  return (
    <div className="yj-page">
      <PageHead
        eyebrow="PROJECT DOCUMENTS"
        title="施工资料"
        lead="原始图纸、方案、报价、评审、交底和验收记录集中归档；连接项目云端后可跨设备同步，离线预览时保存在本机。"
      />
      <section className="yj-doc-grid">
        {documents.map(([name, type, url, note]) => (
          <a href={url} key={name}>
            <span>{type}</span>
            <h3>{name}</h3>
            <p>{note}</p>
            <b>打开 / 下载 ↗</b>
          </a>
        ))}
      </section>
      <section className="yj-upload-zone">
        <div>
          <p className="yj-kicker">LOCAL ARCHIVE</p>
          <h2>补充本地资料</h2>
          <p>
            适合继续添加门店报价、沙发尺寸图、合同、现场照片和验收记录。连接项目云端后资料会跨设备同步；未连接时保存在当前浏览器中。
          </p>
        </div>
        <form onSubmit={upload}>
          <label>
            资料名称
            <input name="name" placeholder="例如：客厅沙发门店报价" />
          </label>
          <label>
            选择文件
            <input name="file" type="file" required />
          </label>
          <label>
            备注
            <textarea name="note" rows={3} />
          </label>
          <button type="submit">保存资料</button>
        </form>
      </section>
      {records.length > 0 && (
        <section className="yj-local-docs">
          <h2>我添加的资料</h2>
          {records.map((item) => (
            <div key={item.id}>
              <span>{item.fileName}</span>
              <b>{item.name}</b>
              <em>{item.note}</em>
              {item.dataUrl && (
                <a href={item.dataUrl} download={item.fileName}>
                  下载
                </a>
              )}
              <button onClick={() => remove(item.id)}>删除</button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="yj-modal">
      <div>
        <header>
          <h2>{title}</h2>
          <button onClick={close}>关闭 ×</button>
        </header>
        {children}
      </div>
    </div>
  );
}
