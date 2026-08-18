"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import ApplianceStudio from "./ApplianceStudio";
import { fileToDataUrl, listRecords, LocalRecord, removeRecord, saveRecord } from "./localDb";

type Section = "home" | "smart" | "appliances" | "design" | "materials" | "furniture" | "customization" | "doors" | "budget" | "documents";
type Candidate = { id: string; category: string; brand: string; name: string; model: string; size: string; install?: string; price: number; image: string; note: string; url?: string };
type QuoteRow = { id: string; category: string; name: string; detail: string; value: number };

const sections: { id: Section; no: string; title: string; short: string; stat: string }[] = [
  { id: "smart", no: "01", title: "全屋智能", short: "场景、点位、风险与验收", stat: "6 类系统" },
  { id: "appliances", no: "02", title: "家电选型", short: "多套方案对比与统一报价", stat: "25 件候选" },
  { id: "design", no: "03", title: "设计图纸", short: "户型、铺贴、厨房与立面", stat: "9 张图纸" },
  { id: "materials", no: "04", title: "主材选型", short: "瓷砖、地板、石材、卫浴与五金", stat: "独立候选库" },
  { id: "furniture", no: "05", title: "家具软装", short: "沙发、床垫、餐桌椅与成品柜", stat: "独立候选库" },
  { id: "customization", no: "06", title: "全屋定制", short: "橱柜、衣柜、木作与柜体报价", stat: "独立候选库" },
  { id: "doors", no: "07", title: "门窗系统", short: "入户门、室内门与洞口", stat: "8 款候选" },
  { id: "budget", no: "08", title: "预算台账", short: "按空间、品类与方案汇总", stat: "动态计算" },
  { id: "documents", no: "09", title: "施工资料", short: "交底、安装、验收与合同", stat: "本地归档" },
];

const doors: Candidate[] = [
  ["door-l003", "入户门", "HAMAN 哈曼", "默利斯", "FP-L003", "洞口尺寸待现场复尺", 0, "renovation/doors/fp-l003.png", "免漆秋香木；断桥结构，开启角≥135°"],
  ["door-l006", "入户门", "HAMAN 哈曼", "特普利", "FP-L006", "洞口尺寸待现场复尺", 0, "renovation/doors/fp-l006.png", "竖向肌理配铜色中缝，现代感较强"],
  ["door-l009", "入户门", "HAMAN 哈曼", "伯斯坦", "FP-L009", "洞口尺寸待现场复尺", 0, "renovation/doors/fp-l009.png", "深木纹与金属中轴，适合暖灰空间"],
  ["door-l014", "入户门", "HAMAN 哈曼", "哈格特", "FP-L014", "洞口尺寸待现场复尺", 0, "renovation/doors/fp-l014.png", "艺术青古铜孔纹与鹤纹装饰"],
  ["door-l015", "入户门", "HAMAN 哈曼", "西蒙森", "FP-L015", "洞口尺寸待现场复尺", 0, "renovation/doors/fp-l015.png", "岩石纹面板配金属描边，双开视觉"],
  ["door-l105", "入户门", "HAMAN 哈曼", "琼楼玉宇", "LP-L105", "洞口尺寸待现场复尺", 0, "renovation/doors/lp-l105.png", "抗氧化表面，回纹装饰，暖白/咖色可定制"],
  ["door-x004", "入户门", "HAMAN 哈曼", "扎哈", "EP-X004", "洞口尺寸待现场复尺", 0, "renovation/doors/ep-x004.png", "艺术紫古铜孔纹，隐蔽式拉手"],
  ["door-x003", "入户门", "HAMAN 哈曼", "莱利", "EP-X003", "洞口尺寸待现场复尺", 0, "renovation/doors/ep-x003.png", "氟碳漆砂纹宝灰，金色竖向点缀"],
].map(([id, category, brand, name, model, size, price, image, note]) => ({ id, category, brand, name, model, size, price, image, note } as Candidate));

const drawings = [
  { name: "彩色家具布置总图", group: "总平面", image: "renovation/drawings/floor-plan-color.jpg", note: "整体尺寸 17638 × 12468 mm；作为空间、设备和门洞定位底图" },
  { name: "户型与设备点位参考", group: "总平面", image: "renovation/floor-plan.jpg", note: "含全屋智能、家电及家具位置参考" },
  { name: "厅卧室铺贴方案一", group: "地面铺贴", image: "renovation/drawings/flooring-1.png", note: "长城瓷砖方案；施工前必须现场复尺" },
  { name: "厅卧室铺贴方案二", group: "地面铺贴", image: "renovation/drawings/flooring-2.png", note: "长城瓷砖方案；重点比较对缝与通铺起点" },
  { name: "厅卧室铺贴方案三", group: "地面铺贴", image: "renovation/drawings/flooring-3.png", note: "长城瓷砖方案；重点比较走廊与客厅连续性" },
  { name: "厅卧室铺贴方案四", group: "地面铺贴", image: "renovation/drawings/flooring-4.png", note: "长城瓷砖方案；须结合损耗和窄条位置决定" },
  { name: "厨房铺贴深化", group: "厨房", image: "renovation/drawings/kitchen-1.png", note: "瓦工施工前需与橱柜厂家核对隐藏砖位置" },
  { name: "卫生间立面方案 A", group: "卫生间", image: "renovation/drawings/bathroom-option-a.jpg", note: "600×1350 竖向排版参考，最终以现场尺寸为准" },
  { name: "卫生间立面方案 B", group: "卫生间", image: "renovation/drawings/bathroom-option-b.jpg", note: "含淋浴区与门洞关系，施工前复核收口" },
];

const tileCandidates: Candidate[] = [
  { id: "greatwall", category: "室内通铺", brand: "长城瓷砖", name: "厅卧室地面铺贴方案", model: "方案 1–4", size: "产品规格待清单确认", price: 0, image: "renovation/drawings/flooring-1.png", note: "四种排版方案已录入图纸区；价格、型号和损耗率待补。" },
  { id: "limosi", category: "主卫生间", brand: "爱力蒙特", name: "利莫斯墙地砖组合", model: "C56131RD / C56131Y/J", size: "600 × 1350 mm", price: 0, image: "renovation/tiles/bathroom-quote.png", note: "历史备选：墙面25片、花片8片、地面9片。不会自动计价；若重新考虑该品牌，请按最终复尺和实际报价补录。" },
  { id: "ayers", category: "次卫生间", brand: "爱力蒙特", name: "艾尔斯岩石墙地砖组合", model: "C56211R", size: "600 × 1350 mm", price: 0, image: "renovation/drawings/bathroom-option-b.jpg", note: "历史备选：墙面16片、地面8片；不会自动计价，加工费按实际发生补录。" },
];

const documents = [
  ["全屋智能方案", "PPTX", "docs/全屋智能方案.pptx", "控制、遮阳、网络、灯光与施工流程"],
  ["全屋智能预算", "XLS", "docs/全屋智能预算.xls", "原方案设备与安装调试报价"],
  ["智能方案评审", "DOCX", "docs/智能方案评审.docx", "问题、删减建议与签单前确认清单"],
  ["灯光设计指导", "DOCX", "docs/灯光设计指导.docx", "重点空间调光、色温、回路和验收"],
  ["地面铺贴方案 1–4", "PDF", "docs/地面铺贴方案1-4.pdf", "长城瓷砖厅卧室铺贴排版"],
  ["厨房图纸", "PDF", "docs/厨房图纸.pdf", "厨房立面、尺寸与隐藏砖核对"],
  ["原始设计资料", "PDF", "docs/原始设计资料.pdf", "项目原始设计资料归档"],
];

const money = (value: number) => `¥${Math.round(value).toLocaleString("zh-CN")}`;
const optimizedImage = (path: string) =>
  /^(products|renovation)\//.test(path) ? path.replace(/\.(png|jpe?g)$/i, ".webp") : path;
const readSection = (): Section => {
  const hash = location.hash.replace("#", "") as Section;
  return ["smart", "appliances", "design", "materials", "furniture", "customization", "doors", "budget", "documents"].includes(hash) ? hash : "home";
};

export default function PortalApp() {
  const [section, setSection] = useState<Section>("home");
  const [selected, setSelected] = useState<string[]>([]);
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<LocalRecord[]>([]);
  const [localDocs, setLocalDocs] = useState<LocalRecord[]>([]);
  const [applianceTotal, setApplianceTotal] = useState(0);

  useEffect(() => {
    const update = () => { setSection(readSection()); scrollTo({ top: 0 }); };
    const updateApplianceTotal = (event: Event) => setApplianceTotal(Number((event as CustomEvent<{ total: number }>).detail?.total || 0));
    update(); addEventListener("hashchange", update);
    addEventListener("home-select-updated", updateApplianceTotal);
    try {
      setSelected(JSON.parse(localStorage.getItem("yj-selected-v2") || "[]"));
      setItemPrices(JSON.parse(localStorage.getItem("yj-item-prices-v2") || "{}"));
      const appliance = JSON.parse(localStorage.getItem("home-select-v2") || "null");
      const plan = appliance?.plans?.find((p: { id: string }) => p.id === appliance.activePlanId) || appliance?.plans?.[0];
      if (plan?.items) setApplianceTotal(Object.values(plan.items as Record<string, { qty: number; unitPrice: number }>).reduce((sum, item) => sum + item.qty * item.unitPrice, 0));
    } catch {}
    listRecords("candidate").then(setCustomItems).catch(() => undefined);
    listRecords("document").then(setLocalDocs).catch(() => undefined);
    return () => { removeEventListener("hashchange", update); removeEventListener("home-select-updated", updateApplianceTotal); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSelected = (id: string) => setSelected((current) => {
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    localStorage.setItem("yj-selected-v2", JSON.stringify(next)); return next;
  });
  const updateItemPrice = (id: string, price: number) => setItemPrices((current) => {
    const next = { ...current, [id]: price }; localStorage.setItem("yj-item-prices-v2", JSON.stringify(next)); return next;
  });

  const selectedDoors = doors.filter((item) => selected.includes(item.id));
  const selectedTiles = tileCandidates.filter((item) => selected.includes(item.id));
  const selectedCustom = customItems.filter((item) => selected.includes(item.id));
  const selectedAll = [...selectedDoors, ...selectedTiles, ...selectedCustom];
  const quoteRows: QuoteRow[] = [
    ...(applianceTotal ? [{ id: "appliances", category: "家电", name: "家电当前愿望单", detail: "读取家电选型台当前方案", value: applianceTotal }] : []),
    ...selectedAll.map((item) => ({ id: item.id, category: item.category || "其他", name: `${item.brand || ""} ${item.name}`.trim(), detail: item.model || "型号待补", value: itemPrices[item.id] ?? item.price ?? 0 })),
  ];

  return (
    <main className="yj-app">
      <Topbar section={section} />
      {section === "home" && <HomePage />}
      {section === "smart" && <SmartChoicePage />}
      {section === "appliances" && <div className="yj-appliance-wrap"><ApplianceStudio /></div>}
      {section === "design" && <DesignPage />}
      {section === "materials" && <CollectionPage kind="materials" title="主材选型" eyebrow="MATERIAL LIBRARY" lead="瓷砖、地板、石材、墙面、卫浴与五金独立比较；历史报价只作为候选，不代表已经选定。" presets={tileCandidates} categories={["瓷砖", "地板", "石材", "墙面材料", "卫浴", "五金", "灯具", "窗帘", "其他主材"]} selected={selected} toggle={toggleSelected} prices={itemPrices} setPrice={updateItemPrice} customItems={customItems} onChange={setCustomItems} />}
      {section === "furniture" && <CollectionPage kind="furniture" title="家具软装" eyebrow="FURNITURE & DECOR" lead="沙发、床垫、餐桌椅、成品柜和软装分别记录尺寸、摆位与到家价。" presets={[]} categories={["沙发", "床 / 床垫", "餐桌椅", "茶几 / 边几", "成品柜", "书桌 / 椅", "户外家具", "其他家具"]} selected={selected} toggle={toggleSelected} prices={itemPrices} setPrice={updateItemPrice} customItems={customItems} onChange={setCustomItems} />}
      {section === "customization" && <CollectionPage kind="customization" title="全屋定制" eyebrow="WHOLE-HOME CUSTOMIZATION" lead="橱柜、衣柜与木作按投影面积、展开面积或整单分别报价，记录板材、五金和安装范围。" presets={[]} categories={["橱柜", "玄关柜", "电视柜", "衣柜", "书柜", "浴室柜", "阳台柜", "护墙 / 木作", "其他定制"]} selected={selected} toggle={toggleSelected} prices={itemPrices} setPrice={updateItemPrice} customItems={customItems} onChange={setCustomItems} />}
      {section === "doors" && <DoorsPage selected={selected} toggle={toggleSelected} prices={itemPrices} setPrice={updateItemPrice} />}
      {section === "budget" && <BudgetPage rows={quoteRows} />}
      {section === "documents" && <DocumentsPage records={localDocs} onChange={setLocalDocs} />}
      <MobileNav section={section} />
    </main>
  );
}

function Topbar({ section }: { section: Section }) {
  return <header className="yj-topbar"><a className="yj-brand" href="#home"><span>YJ</span><div><b>悦景新世界</b><small>20-1-19-1 · 家装项目档案</small></div></a><nav>{sections.map((item) => <a className={section === item.id ? "active" : ""} key={item.id} href={`#${item.id}`}>{item.title}</a>)}</nav><a className="yj-quote-link" href="#budget">报价单</a></header>;
}

function MobileNav({ section }: { section: Section }) {
  return <nav className="yj-mobile-nav" aria-label="手机端主导航"><a className={section === "home" ? "active" : ""} href="#home">首页</a><a className={section === "smart" ? "active" : ""} href="#smart">智能</a><a className={section === "appliances" ? "active" : ""} href="#appliances">家电</a><a className={section === "design" ? "active" : ""} href="#design">图纸</a><a className={section === "materials" ? "active" : ""} href="#materials">主材</a><a className={section === "furniture" ? "active" : ""} href="#furniture">家具</a><a className={section === "customization" ? "active" : ""} href="#customization">定制</a><a className={section === "doors" ? "active" : ""} href="#doors">门</a><a className={section === "budget" ? "active" : ""} href="#budget">预算</a><a className={section === "documents" ? "active" : ""} href="#documents">资料</a></nav>;
}

function PageHead({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return <header className="yj-page-head"><p>{eyebrow}</p><h1>{title}</h1><span>{lead}</span></header>;
}

function HomePage() {
  return <>
    <section className="yj-hero"><div><p className="yj-eyebrow">HOME RENOVATION ARCHIVE · 2026</p><h1>把一个家的所有选择，<br /><em>放进同一张图里。</em></h1><p className="yj-lead">从户型、灯光和全屋智能，到家电、主材、家具、全屋定制与门窗，每一次对比、报价和安装尺寸都在这里持续沉淀。</p><div className="yj-actions"><a className="primary" href="#design">先看设计图纸</a><a href="#appliances">打开家电选型台</a></div><dl className="yj-facts"><div><dt>风格</dt><dd>暖白 · 克制 · 低眩光</dd></div><div><dt>重点</dt><dd>调光 / 尺寸 / 收口 / 验收</dd></div><div><dt>存储</dt><dd>本机浏览器 · 可离线</dd></div></dl></div><figure className="yj-plan-card"><img src="renovation/drawings/floor-plan-color.webp" alt="悦景新世界彩色家具布置图" decoding="async" fetchPriority="high" /><figcaption><span>MASTER PLAN</span><b>悦景新世界 20-1-19-1</b><small>总平面 · 17638 × 12468 mm</small></figcaption></figure></section>
    <section className="yj-section yj-index"><div className="yj-section-title"><p>PROJECT INDEX</p><h2>项目分区</h2><span>每个分区独立管理，最终统一汇总预算</span></div><div className="yj-module-grid">{sections.map((item) => <a key={item.id} href={`#${item.id}`}><span>{item.no}</span><div><h3>{item.title}</h3><p>{item.short}</p></div><small>{item.stat}</small><b>↗</b></a>)}</div></section>
    <section className="yj-focus"><article><p>当前设计重点</p><h2>四个重点调光区，<br />一个统一控制入口。</h2><ul><li>客厅 / 餐桌 / 主卧 / 书房分路调光</li><li>卫生间低位夜灯 + 静止存在感应</li><li>墙面按键优先，断网仍可用基础场景</li></ul></article><aside><span>下一步优先级</span><h3>先锁定回路、门洞和设备尺寸，再签主材。</h3><p>补齐逐路灯光表、PoE端口功率、门洞复尺、瓷砖排版和电器安装预留。</p></aside></section>
  </>;
}

function SmartChoicePage() {
  const systems = [["控制与面板","网关、实体场景面板、智能开关与断网可用性"],["灯光调光","客厅、餐桌、主卧、书房按回路与驱动重新核对"],["智能遮阳","窗帘电机、轨道尺寸、电机侧和检修条件"],["全宅网络","PoE 路由、AP 数量、端口与供电功率"],["安防感知","水浸、燃气、人体与静止存在传感器"],["空调 / 新风联动","中央空调、新风、地暖接口协议和本地控制"]];
  return <div className="yj-page"><PageHead eyebrow="WHOLE-HOME INTELLIGENCE" title="全屋智能" lead="当前生态与供应商均未确定。这里保存候选方案、点位和验收条款，不代表采用三翼鸟。" /><section className="yj-smart-overview"><div><span>历史候选报价</span><strong>¥36,788.50</strong><small>仅供比较，不自动进入预算</small></div><div><span>候选生态</span><strong>开放</strong><small>米家 / 三翼鸟 / 其他方案均可继续比较</small></div><div><span>先行条件</span><strong>布线</strong><small>零线、深底盒、网线、干接点与检修口</small></div></section><div className="yj-drawing-note"><b>生态尚未选定</b><span>大型家电按产品力独立选择，不为统一品牌强行接入。供应商和协议确认后，再把最终合同金额手工加入预算台账。</span></div><section className="yj-card-grid yj-system-grid">{systems.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</section><section className="yj-split"><article><p className="yj-kicker">SCENES</p><h2>场景候选</h2><div className="yj-scene-list">{[["日常","3000K · 主灯60–70%"],["会客","重点光70% · 人脸清晰"],["观影","背景光10–15% · 避免全黑"],["用餐","餐桌65–80% · 周边略暗"],["睡前","2700K · 3–5秒渐暗"],["起夜","低位照明1–8%"]].map(([a,b]) => <div key={a}><b>{a}</b><span>{b}</span></div>)}</div></article><aside className="yj-risk"><p className="yj-kicker">BEFORE CONTRACT</p><h2>签单前确认</h2><ol><li><b>系统边界</b><span>明确谁负责设备、布线、调试和售后。</span></li><li><b>回路与协议</b><span>逐路列功率、驱动、协议和墙面按键。</span></li><li><b>网络容量</b><span>提交 AP、PoE 端口及功率计算。</span></li><li><b>联动验收</b><span>断网、本地控制、静止存在和异常告警逐项测试。</span></li></ol></aside></section><div className="yj-download-row"><a href="docs/智能方案评审.docx">下载方案评审</a><a href="docs/灯光设计指导.docx">下载灯光指导</a><a href="docs/全屋智能方案.pptx">查看历史候选方案</a></div></div>;
}

function SmartPage() {
  const systems = [["控制系统","网关、4寸屏、场景面板与智能开关"],["智能照明","客厅、餐桌、主卧、书房 10–12 个重点回路"],["智能遮阳","3 套窗帘电机，现场复尺轨道与电机侧"],["全宅网络","PoE 路由 + 墙壁 AP，端口与功率须重算"],["智能安防","水浸、燃气、人体存在等传感器"],["本地场景","墙面按键优先，断网保留日常/全关"]];
  return <div className="yj-page"><PageHead eyebrow="WHOLE-HOME INTELLIGENCE" title="全屋智能" lead="把销售方案拆成可执行的场景、点位、责任和验收条款。" /><section className="yj-smart-overview"><div><span>原方案预算</span><strong>¥36,788.50</strong><small>设备 ¥31,990 + 15% 安装调试费</small></div><div><span>建议删减</span><strong>≥ ¥6,068.55</strong><small>普通灯具段先剔除，智能灯光按区按路重做</small></div><div><span>重点调光</span><strong>4 个区域</strong><small>客厅 / 餐桌 / 主卧 / 书房</small></div></section><div className="yj-drawing-note"><b>生态选择记录</b><span>历史讨论结论是：自装与后续自由扩展优先米家骨架；若保留当前海尔/卡萨帝成套交付，则三翼鸟可做控制入口，但大型家电仍按产品力选择，不为统一品牌强行接入。无论选哪套，零线、深底盒、网线、RS485/干接点与墙面实体控制都先预留。</span></div><section className="yj-card-grid yj-system-grid">{systems.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</section><section className="yj-split"><article><p className="yj-kicker">SCENES</p><h2>建议场景</h2><div className="yj-scene-list">{[["日常","3000K · 主灯60–70%"],["会客","重点光70% · 人脸清晰"],["观影","背景光10–15% · 避免全黑"],["用餐","餐桌65–80% · 周边略暗"],["睡前","2700K · 3–5秒渐暗"],["阅读/游戏","任务光与间接氛围分路"],["起夜/如厕","2200–2700K · 低位1–8%"]].map(([a,b]) => <div key={a}><b>{a}</b><span>{b}</span></div>)}</div></article><aside className="yj-risk"><p className="yj-kicker">P0 / P1 RISKS</p><h2>签单前必须解决</h2><ol><li><b>PoE端口矛盾</b><span>预算5口路由却配置5个AP，需提交端口及功率计算。</span></li><li><b>卫生间静止存在</b><span>增加毫米波/静止存在传感器，现场静坐5分钟测试。</span></li><li><b>缺少回路与场景表</b><span>逐路列灯具、功率、驱动、协议、按键与参数。</span></li><li><b>布线未计价</b><span>明确零火、网线、PoE、窗帘电源和检修口责任。</span></li></ol></aside></section><div className="yj-download-row"><a href="docs/智能方案评审.docx">下载方案评审</a><a href="docs/灯光设计指导.docx">下载灯光指导</a><a href="docs/全屋智能方案.pptx">查看原始方案</a></div></div>;
}

function DesignPage() {
  const [active, setActive] = useState<(typeof drawings)[number] | null>(null);
  const groups = ["全部", "总平面", "地面铺贴", "厨房", "卫生间"];
  const [group, setGroup] = useState("全部");
  const list = group === "全部" ? drawings : drawings.filter((item) => item.group === group);
  return <div className="yj-page"><PageHead eyebrow="DESIGN DRAWINGS" title="设计图纸" lead="图纸直接展示；点击任意图纸可放大查看细节与尺寸。" /><div className="yj-filter-row">{groups.map((item) => <button className={group === item ? "active" : ""} onClick={() => setGroup(item)} key={item}>{item}</button>)}</div><section className="yj-drawing-grid">{list.map((item) => <button key={item.name} onClick={() => setActive(item)}><div><img src={optimizedImage(item.image)} alt={item.name} loading="lazy" decoding="async" /></div><span>{item.group}</span><h3>{item.name}</h3><p>{item.note}</p></button>)}</section><div className="yj-drawing-note"><b>施工边界</b><span>长城铺贴图和卫生间立面均为排版参考，不代替现场复尺、损耗计算、收口节点及最终施工确认。</span></div>{active && <div className="yj-lightbox" onClick={() => setActive(null)}><button onClick={() => setActive(null)}>关闭 ×</button><img src={optimizedImage(active.image)} alt={active.name} decoding="async" /><footer><b>{active.name}</b><span>{active.note}</span></footer></div>}</div>;
}

function CandidateCard({ item, selected, toggle, priceEditor }: { item: Candidate; selected: boolean; toggle: () => void; priceEditor?: React.ReactNode }) {
  const [detail, setDetail] = useState(false);
  return <><article className={`yj-candidate ${selected ? "selected" : ""}`}><button className="yj-candidate-image" onClick={() => setDetail(true)}><img src={optimizedImage(item.image)} alt={`${item.brand} ${item.name}`} loading="lazy" decoding="async" /><span>{item.category}</span></button><div className="yj-candidate-body"><small>{item.brand}</small><h3>{item.name}</h3><b>{item.model}</b><dl><div><dt>产品尺寸 / 洞口</dt><dd>{item.size || "待补"}</dd></div><div><dt>安装尺寸 / 预留</dt><dd>{item.install || "待现场复尺"}</dd></div></dl>{priceEditor}<button className="yj-detail-button" onClick={() => setDetail(true)}>查看说明与大图 →</button><button onClick={toggle}>{selected ? "✓ 已加入愿望单" : "+ 加入愿望单"}</button></div></article>{detail && <Modal title={`${item.brand} · ${item.name}`} close={() => setDetail(false)}><div className="yj-product-detail"><img src={optimizedImage(item.image)} alt={`${item.brand} ${item.name}`} /><dl><div><dt>型号</dt><dd>{item.model}</dd></div><div><dt>产品尺寸 / 洞口</dt><dd>{item.size || "待补"}</dd></div><div><dt>安装尺寸 / 预留</dt><dd>{item.install || "待现场复尺"}</dd></div><div><dt>当前价格</dt><dd>{item.price ? money(item.price) : "待补"}</dd></div></dl><p>{item.note || "详细说明待补充。"}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer">打开商品 / 购买链接 ↗</a>}</div></Modal>}</>;
}

function CollectionPage({ kind, title, eyebrow, lead, presets, categories, selected, toggle, prices, setPrice, customItems, onChange }: { kind: "materials" | "furniture" | "customization"; title: string; eyebrow: string; lead: string; presets: Candidate[]; categories: string[]; selected: string[]; toggle: (id: string) => void; prices: Record<string, number>; setPrice: (id: string, price: number) => void; customItems: LocalRecord[]; onChange: (items: LocalRecord[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const ownItems = customItems.filter((item) => item.id.startsWith(`${kind}-`));
  const addItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const file = form.get("image") as File;
    const record: LocalRecord = { id: `${kind}-${Date.now()}`, kind: "candidate", name: String(form.get("name") || "未命名候选"), category: String(form.get("category") || "其他"), brand: String(form.get("brand") || ""), model: String(form.get("model") || ""), size: String(form.get("size") || ""), install: String(form.get("install") || ""), price: Number(form.get("price") || 0), note: String(form.get("note") || ""), url: String(form.get("url") || ""), dataUrl: file?.size ? await fileToDataUrl(file) : "", createdAt: Date.now() };
    await saveRecord(record); onChange([record, ...customItems]); setShowForm(false); event.currentTarget.reset();
  };
  const deleteItem = async (id: string) => { await removeRecord(id); onChange(customItems.filter((item) => item.id !== id)); };
  return <div className="yj-page"><PageHead eyebrow={eyebrow} title={title} lead={lead} />{kind === "materials" && <section className="yj-material-hero"><div><img src="renovation/tile-living-room.webp" alt="客厅地砖光影参考" loading="lazy" decoding="async" /></div><article><p className="yj-kicker">HISTORICAL OPTION</p><h2>瓷砖方案仅作为历史候选</h2><p>长城与爱力蒙特都不会自动进入预算。你可以继续添加其他品牌，主动加入愿望单后再填写实际到手价。</p><a href="#design">查看铺贴图 →</a></article></section>}<div className="yj-section-bar"><div><h2>候选清单</h2><span>只有主动加入的项目才进入预算</span></div><button onClick={() => setShowForm(true)}>+ 添加{title}候选</button></div><section className="yj-candidate-grid">{presets.map((item) => <CandidateCard key={item.id} item={{ ...item, price: prices[item.id] ?? 0 }} selected={selected.includes(item.id)} toggle={() => toggle(item.id)} priceEditor={<label className="yj-price-input">实际到手价 ¥<input value={prices[item.id] || ""} onChange={(e) => setPrice(item.id, Number(e.target.value))} type="number" min="0" placeholder="不预设" /></label>} />)}{ownItems.map((item) => <article className={`yj-candidate ${selected.includes(item.id) ? "selected" : ""}`} key={item.id}><div className="yj-candidate-image">{item.dataUrl ? <img src={item.dataUrl} alt={item.name} loading="lazy" decoding="async" /> : <div className="yj-image-placeholder">NO IMAGE</div>}<span>{item.category}</span></div><div className="yj-candidate-body"><small>{item.brand || "用户添加"}</small><h3>{item.name}</h3><b>{item.model || "型号待补"}</b><dl><div><dt>产品尺寸</dt><dd>{item.size || "待补"}</dd></div><div><dt>安装尺寸 / 预留</dt><dd>{item.install || "待现场确认"}</dd></div></dl><label className="yj-price-input">实际到手价 ¥<input value={prices[item.id] ?? item.price ?? ""} onChange={(e) => setPrice(item.id, Number(e.target.value))} type="number" min="0" placeholder="不预设" /></label><p>{item.note}</p>{item.url && <a className="yj-inline-link" href={item.url} target="_blank" rel="noreferrer">商品 / 购买链接 ↗</a>}<div className="yj-card-actions"><button onClick={() => toggle(item.id)}>{selected.includes(item.id) ? "✓ 已加入" : "+ 加入愿望单"}</button><button className="danger" onClick={() => deleteItem(item.id)}>删除</button></div></div></article>)}</section>{!presets.length && !ownItems.length && <p className="yj-empty">这里暂时是空的。点击“添加{title}候选”，从你实际看过的品牌开始记录。</p>}{showForm && <Modal title={`添加${title}候选`} close={() => setShowForm(false)}><form className="yj-form" onSubmit={addItem}><label>品类<select name="category">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>名称<input name="name" required /></label><label>品牌<input name="brand" /></label><label>型号<input name="model" /></label><label>产品尺寸<input name="size" placeholder="长 × 宽 × 高 mm" /></label><label>实际价格<input name="price" type="number" min="0" placeholder="可留空" /></label><label className="wide">安装尺寸 / 预留<input name="install" placeholder="洞口、散热、水电、检修与运输要求" /></label><label className="wide">商品 / 购买链接<input name="url" type="url" placeholder="https://…（可留空）" /></label><label className="wide">图片<input name="image" type="file" accept="image/*" /></label><label className="wide">详情说明<textarea name="note" rows={4} /></label><div className="wide yj-form-actions"><button type="button" onClick={() => setShowForm(false)}>取消</button><button type="submit">保存候选</button></div></form></Modal>}</div>;
}

function DoorsPage({ selected, toggle, prices, setPrice }: { selected: string[]; toggle: (id: string) => void; prices: Record<string, number>; setPrice: (id: string, price: number) => void }) {
  return <div className="yj-page"><PageHead eyebrow="DOOR & OPENING SYSTEM" title="门窗系统" lead="门款独立对比；价格、洞口、开启方向、锁体和收口在复尺后逐项补齐。" /><div className="yj-door-guidance"><div><b>01 · 先复尺</b><span>墙厚、洞口宽高、门槛高度、外开/内开及入户电梯运输条件</span></div><div><b>02 · 再确认</b><span>断桥结构、填充、合页、锁体、智能锁、开门角度与保修</span></div><div><b>03 · 最后定色</b><span>与玄关木饰面、柜门、地砖和金属件放在同一光线下看</span></div></div><section className="yj-candidate-grid yj-door-grid">{doors.map((item) => <CandidateCard key={item.id} item={{ ...item, price: prices[item.id] || 0 }} selected={selected.includes(item.id)} toggle={() => toggle(item.id)} priceEditor={<label className="yj-price-input">补录到手价 ¥<input value={prices[item.id] || ""} onChange={(e) => setPrice(item.id, Number(e.target.value))} type="number" min="0" placeholder="待询价" /></label>} />)}</section></div>;
}

function BudgetPage({ rows }: { rows: QuoteRow[] }) {
  const [manual, setManual] = useState<QuoteRow[]>([]);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    try {
      setManual(JSON.parse(localStorage.getItem("yj-manual-budget-v2") || "[]"));
      setOverrides(JSON.parse(localStorage.getItem("yj-budget-overrides-v2") || "{}"));
      setIncluded(JSON.parse(localStorage.getItem("yj-budget-included-v2") || "{}"));
    } catch {}
  }, []);
  const allRows = [...rows, ...manual];
  const valueOf = (row: QuoteRow) => overrides[row.id] ?? row.value;
  const isIncluded = (row: QuoteRow) => included[row.id] !== false;
  const total = allRows.filter(isIncluded).reduce((sum, row) => sum + valueOf(row), 0);
  const persist = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
  const updateValue = (id: string, value: number) => setOverrides((current) => { const next = { ...current, [id]: value }; persist("yj-budget-overrides-v2", next); return next; });
  const toggle = (id: string) => setIncluded((current) => { const next = { ...current, [id]: current[id] === false }; persist("yj-budget-included-v2", next); return next; });
  const add = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const next = [...manual, { id: `budget-${Date.now()}`, category: String(form.get("category") || "其他"), name: String(form.get("name") || "未命名项目"), detail: String(form.get("detail") || ""), value: Number(form.get("value") || 0) }]; setManual(next); persist("yj-manual-budget-v2", next); setShowForm(false); };
  const remove = (id: string) => { const next = manual.filter((row) => row.id !== id); setManual(next); persist("yj-manual-budget-v2", next); };
  const exportCsv = () => { const body = [["计入", "分类", "项目", "说明", "金额"], ...allRows.map((row) => [isIncluded(row) ? "是" : "否", row.category, row.name, row.detail, String(valueOf(row) || "")]), ["", "", "合计", "", String(total)]]; const csv = `\uFEFF${body.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")}`; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "悦景新世界-装修预算.csv"; a.click(); URL.revokeObjectURL(a.href); };
  return <div className="yj-page"><PageHead eyebrow="UNIFIED QUOTATION" title="预算台账" lead="没有默认品牌和默认金额。只有你主动选择或手工添加的项目才出现，所有价格都可以覆盖修改。" /><section className="yj-budget-hero"><div><span>当前报价合计</span><strong>{money(total)}</strong><small>{allRows.length} 个项目 · 未填价格按 0 计算</small></div><aside><p>全屋智能、瓷砖、家具和全屋定制均不预设品牌。确认供应商后，可在这里手工新增一条，也可以从各自候选库加入。</p></aside></section><div className="yj-budget-actions"><button onClick={() => setShowForm(true)}>+ 添加预算项目</button><button onClick={exportCsv}>导出 CSV（Excel 可打开）</button></div>{allRows.length ? <section className="yj-budget-table"><header><span>计入</span><b>分类 / 项目</b><em>说明</em><strong>可编辑金额</strong></header>{allRows.map((row) => <div key={row.id} className={isIncluded(row) ? "included" : ""}><span><input type="checkbox" checked={isIncluded(row)} onChange={() => toggle(row.id)} aria-label={`计入${row.name}`} /></span><b><small>{row.category}</small>{row.name}</b><em>{row.detail || "—"}</em><strong><label>¥ <input type="number" min="0" value={valueOf(row) || ""} placeholder="待补" onChange={(event) => updateValue(row.id, Number(event.target.value))} /></label>{row.id.startsWith("budget-") && <button onClick={() => remove(row.id)}>删除</button>}</strong></div>)}<footer><span /><b>当前总计</b><em>以最终合同、复尺与实际发生为准</em><strong>{money(total)}</strong></footer></section> : <p className="yj-empty">报价单现在是空的。请先从各分区加入候选，或手工添加一个预算项目。</p>}{showForm && <Modal title="添加预算项目" close={() => setShowForm(false)}><form className="yj-form" onSubmit={add}><label>分类<select name="category"><option>全屋智能</option><option>家电</option><option>主材</option><option>家具</option><option>全屋定制</option><option>门窗</option><option>施工</option><option>其他</option></select></label><label>项目名称<input name="name" required /></label><label className="wide">品牌 / 型号 / 报价说明<input name="detail" /></label><label className="wide">金额<input name="value" type="number" min="0" placeholder="可留空" /></label><div className="wide yj-form-actions"><button type="button" onClick={() => setShowForm(false)}>取消</button><button type="submit">加入报价单</button></div></form></Modal>}</div>;
}

function DocumentsPage({ records, onChange }: { records: LocalRecord[]; onChange: (items: LocalRecord[]) => void }) {
  const upload = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const file = form.get("file") as File; if (!file?.size) return; const record: LocalRecord = { id: `doc-${Date.now()}`, kind: "document", name: String(form.get("name") || file.name), note: String(form.get("note") || ""), fileName: file.name, mime: file.type, dataUrl: await fileToDataUrl(file), createdAt: Date.now() }; await saveRecord(record); onChange([record, ...records]); event.currentTarget.reset(); };
  const remove = async (id: string) => { await removeRecord(id); onChange(records.filter((item) => item.id !== id)); };
  return <div className="yj-page"><PageHead eyebrow="PROJECT DOCUMENTS" title="施工资料" lead="原始图纸、方案、报价、评审、交底和验收记录集中归档；本地上传不会发到网络。" /><section className="yj-doc-grid">{documents.map(([name, type, url, note]) => <a href={url} key={name}><span>{type}</span><h3>{name}</h3><p>{note}</p><b>打开 / 下载 ↗</b></a>)}</section><section className="yj-upload-zone"><div><p className="yj-kicker">LOCAL ARCHIVE</p><h2>补充本地资料</h2><p>适合继续添加门店报价、沙发尺寸图、合同、现场照片和验收记录。数据保存在当前浏览器中。</p></div><form onSubmit={upload}><label>资料名称<input name="name" placeholder="例如：客厅沙发门店报价" /></label><label>选择文件<input name="file" type="file" required /></label><label>备注<textarea name="note" rows={3} /></label><button type="submit">保存到本地资料库</button></form></section>{records.length > 0 && <section className="yj-local-docs"><h2>我添加的资料</h2>{records.map((item) => <div key={item.id}><span>{item.fileName}</span><b>{item.name}</b><em>{item.note}</em>{item.dataUrl && <a href={item.dataUrl} download={item.fileName}>下载</a>}<button onClick={() => remove(item.id)}>删除</button></div>)}</section>}</div>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="yj-modal"><div><header><h2>{title}</h2><button onClick={close}>关闭 ×</button></header>{children}</div></div>;
}
