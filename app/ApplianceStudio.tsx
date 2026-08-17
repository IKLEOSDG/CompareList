"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Source = "网上看" | "现场看" | "新增推荐" | "用户添加";
type Product = {
  id: string;
  category: string;
  brand: string;
  name: string;
  model: string;
  size: string;
  install?: string;
  price: number;
  source: Source;
  image: string;
  features: string[];
  note?: string;
  custom?: boolean;
  url?: string;
  taobaoPrice?: number;
  taobaoNote?: string;
};
type PlanItem = { qty: number; unitPrice: number };
type Plan = { id: string; name: string; items: Record<string, PlanItem> };

const optimizedImage = (path: string) =>
  /^(products|renovation)\//.test(path) ? path.replace(/\.(png|jpe?g)$/i, ".webp") : path;

const seedProducts: Product[] = [
  {
    id: "fridge487",
    category: "冰箱",
    brand: "卡萨帝",
    name: "零嵌法式冰箱",
    model: "BCD-487WGCFDM4WKU1",
    size: "830 × 594 × 1900 mm",
    install: "建议预留：宽 ≥ 840、深 ≥ 600、高 ≥ 1910 mm",
    price: 5100,
    taobaoPrice: 5499,
    taobaoNote: "公开电商行情参考",
    source: "网上看",
    image: "products/casarte-fridge-487.png",
    features: [
      "487L 大容量",
      "594mm 超薄零嵌",
      "一级能效 · 35dB",
      "手动制冰盒",
    ],
    note: "带制冰功能；制冰盒及冰铲建议定期温水清洁、彻底晾干。",
    url: "https://www.casarte.com/cooling/20251128_283469.shtml",
  },
  {
    id: "fridge551",
    category: "冰箱",
    brand: "卡萨帝",
    name: "551L 零嵌冰箱",
    model: "BCD-551WGCTDMGWJU1",
    size: "830 × 594 × 1925 mm",
    install: "建议预留：宽 ≥ 840、深 ≥ 600、高 ≥ 1935 mm",
    price: 10499,
    source: "现场看",
    image: "products/casarte-fridge-551.jpg",
    features: ["551L", "594mm 超薄", "现场标价"],
    note: "现场样机方案，购买前向门店确认制冰方式与最新能效信息。",
  },
  {
    id: "bosch605",
    category: "冰箱",
    brand: "博世",
    name: "605L 四门冰箱",
    model: "KCG89AA31C",
    size: "尺寸待门店确认",
    install: "以产品安装图为准，先按宽 ≥ 920、深 ≥ 750、高 ≥ 1850 mm 复核现场",
    price: 0,
    source: "现场看",
    image: "products/bosch-fridge-605.jpg",
    features: ["605L", "自动制冰", "活氧净味"],
    note: "照片能效标识显示冷藏303L、冷冻228L、冰温74L；报价与准确机身尺寸待补。",
  },
  {
    id: "boschkfb89",
    category: "冰箱",
    brand: "博世",
    name: "502L 储水自动制冰冰箱",
    model: "KFB89VA20C / KFB89VA27C",
    size: "842 × 594 × 1925 mm",
    install: "冰箱位净宽建议 ≥ 850 mm；复核门体开启、插座与底部散热",
    price: 0,
    taobaoPrice: 11200,
    taobaoNote: "历史调研活动区间中值，购买日需重新询价",
    source: "新增推荐",
    image: "products/bosch-kfb89.jpg",
    features: ["502L法式多门", "储水自动制冰", "无需外接水管", "594mm超薄"],
    note: "历史清单的850mm机位首选；下单须写明完整颜色后缀、储水式制冰及无需外接自来水。",
  },
  {
    id: "fridge521",
    category: "冰箱",
    brand: "卡萨帝",
    name: "521L 十字门自动制冰冰箱",
    model: "BCD-521WGCTDMGCTU1",
    size: "830 × 594 × 1925 mm",
    install: "适合830mm级机位；柜位仍需复核散热与开门净空",
    price: 0,
    taobaoPrice: 11100,
    taobaoNote: "历史调研区间中值，购买日需重新询价",
    source: "新增推荐",
    image: "products/casarte-fridge-521.jpg",
    features: ["521L", "594mm超薄", "双系统", "自动制冰"],
    note: "冰箱位无法扩到850mm时的免改柜备选；人工加水还是外接水须让商家书面确认。",
  },
  {
    id: "washer10",
    category: "洗衣机",
    brand: "卡萨帝",
    name: "10kg 滚筒洗衣机",
    model: "CEB10LWDKLBU1",
    size: "595 × 599 × 850 mm",
    install: "建议预留：宽 ≥ 650、深 ≥ 650、高 ≥ 870 mm；后侧留水电位",
    price: 3800,
    taobaoPrice: 4599,
    taobaoNote: "公开电商未补贴行情",
    source: "网上看",
    image: "products/casarte-washer-10.png",
    features: ["直驱变频", "精华洗", "智能投放"],
    note: "与 CGS10FKLBU1 套装国补后合计 ¥7,600，本工具按各 ¥3,800 拆分，可改价。",
    url: "https://www.casarte.com/laundry/20260319_288064.shtml",
  },
  {
    id: "wallwasher",
    category: "洗衣机",
    brand: "卡萨帝",
    name: "3kg 壁挂洗衣机",
    model: "CB B3EDUHBU1",
    size: "520 × 322 × 590 mm",
    install: "需承重实心墙；两侧及顶部建议各留 ≥ 20 mm，排水按官方图定位",
    price: 3999,
    source: "网上看",
    image: "products/casarte-wall-washer.png",
    features: ["壁挂小筒", "60℃除敏", "UVC除菌"],
    note: "已按你的要求归入“洗衣机”品类。",
    url: "https://www.casarte.com/laundry/20260316_287891.shtml",
  },
  {
    id: "washer12",
    category: "洗衣机",
    brand: "卡萨帝",
    name: "12kg 滚筒洗衣机",
    model: "CEB12SWNMHKU1",
    size: "595 × 589 × 850 mm",
    install: "建议预留：宽 ≥ 650、深 ≥ 640、高 ≥ 870 mm",
    price: 9999,
    source: "现场看",
    image: "products/casarte-laundry-12.jpg",
    features: ["12kg 大容量", "现场样机", "可与干衣机叠放"],
  },
  {
    id: "dryer10",
    category: "干衣机",
    brand: "卡萨帝",
    name: "10kg 热泵干衣机",
    model: "CGS10FKLBU1",
    size: "595 × 586 × 850 mm",
    install: "建议预留：宽 ≥ 650、深 ≥ 640、高 ≥ 870 mm；叠放需原厂连接件",
    price: 3800,
    taobaoPrice: 5199,
    taobaoNote: "公开电商未补贴行情",
    source: "网上看",
    image: "products/casarte-dryer-10.png",
    features: ["热泵柔烘", "56℃除螨", "四重线屑过滤"],
    note: "与 CEB10LWDKLBU1 套装国补后合计 ¥7,600，本工具按各 ¥3,800 拆分。",
    url: "https://www.casarte.com/laundry/20260319_288055.shtml",
  },
  {
    id: "dryer12",
    category: "干衣机",
    brand: "卡萨帝",
    name: "12kg 热泵干衣机",
    model: "CGS12BYTSMHKU1",
    size: "595 × 595 × 850 mm",
    install: "建议预留：宽 ≥ 650、深 ≥ 650、高 ≥ 870 mm；叠放需原厂连接件",
    price: 12999,
    source: "现场看",
    image: "products/casarte-laundry-12.jpg",
    features: ["12kg 大容量", "热泵烘干", "现场样机"],
  },
  {
    id: "dishwasher",
    category: "洗碗机",
    brand: "卡萨帝",
    name: "16套嵌入式洗碗机",
    model: "CWY16-S46HGU1",
    size: "598 × 581 × 768 mm",
    install: "建议柜体净空：宽 ≥ 600、深 ≥ 600、高 770–820 mm",
    price: 4700,
    source: "现场看",
    image: "products/casarte-dishwasher.png",
    features: ["16套容量", "双80℃高温洗", "自动开门烘干"],
    note: "产品图为同系列功能示意，最终以实机门板与安装图为准。",
  },
  {
    id: "fotilex20",
    category: "洗碗机",
    brand: "方太",
    name: "X20 Max 水槽洗碗机",
    model: "JBSD3F-03-X20Max",
    size: "1189 × 513 × 650 mm",
    install: "台面开孔参考：1160 × 480 mm；柜下预留进排水与电源",
    price: 12800,
    source: "现场看",
    image: "products/fotile-x20.png",
    features: ["水槽一体", "果蔬净洗", "安装参考 1160×480mm"],
  },
  {
    id: "robams2u",
    category: "洗碗机",
    brand: "老板",
    name: "S2 Ultra 洗碗机",
    model: "W80-S2U",
    size: "598 × 570 × 800 mm",
    install: "开孔：宽 600 × 深 ≥575 × 高 802–842 mm",
    price: 0,
    taobaoPrice: 21999,
    taobaoNote: "天猫公开索引价",
    source: "新增推荐",
    image: "products/robam-dishwasher-s2u.png",
    features: ["21套容量", "45分钟快洗", "AI除菌", "升降碗篮"],
    url: "https://www.robam.com/product/detail/1094.html",
  },
  {
    id: "mideaxh09",
    category: "洗碗机",
    brand: "美的",
    name: "XH09Pro 集成水槽洗碗机",
    model: "XH09Pro / J-900-W-A",
    size: "900 × 600 × 800 mm",
    install: "900mm整模块；厂家上门量尺后再拆柜、开孔和下单台面",
    price: 0,
    taobaoPrice: 10250,
    taobaoNote: "历史目标成交区间中值",
    source: "新增推荐",
    image: "products/midea-xh09pro.jpg",
    features: ["58L大单槽", "15套", "四星消毒", "下方前开门"],
    note: "大水槽优先路线；接受洗碗机位于水槽下方、正面开门后再选。",
  },
  {
    id: "hood",
    category: "油烟机",
    brand: "卡萨帝",
    name: "超薄全嵌油烟机",
    model: "CXW-358-CQ30UD",
    size: "890 × 325 × 590 mm",
    install: "吊柜宽建议 ≥ 900 mm；排烟管、止逆阀及灶烟距按官方安装图定位",
    price: 3000,
    source: "现场看",
    image: "products/casarte-hood.png",
    features: ["30m³/min", "1400Pa 静压", "325mm 全隐机身"],
    url: "https://www.casarte.com/kitchen-appliances/yyj/20260430_290002.shtml",
  },
  {
    id: "robamhood",
    category: "油烟机",
    brand: "老板",
    name: "R1P-i1 AI油烟机",
    model: "CXW-260-R1P-i1",
    size: "895 × 325 × 920 mm",
    install: "吊柜宽建议 ≥ 900 mm；开孔、排烟管及灶烟距以官方安装图为准",
    price: 0,
    source: "新增推荐",
    image: "products/robam-hood-r1p.png",
    features: ["31.5m³/min", "1650Pa", "AI识烟"],
    url: "https://www.robam.com/product/detail/1020.html",
  },
  {
    id: "robame1p",
    category: "油烟机",
    brand: "老板",
    name: "E1P 双腔油烟机",
    model: "CXW-260-68D8-E1P",
    size: "准确尺寸以官方安装图为准",
    install: "确认吊柜净空、公共烟道、止逆阀与可检修插座",
    price: 0,
    taobaoPrice: 4500,
    taobaoNote: "与59B8D套装历史总价约¥7,100–8,500，单机为拆分参考",
    source: "新增推荐",
    image: "products/robam-e1p.png",
    features: ["30m³/min", "1500Pa", "智能换气", "烟灶联动"],
    note: "必须写全长型号，避免被替换成近似渠道后缀。",
  },
  {
    id: "hob",
    category: "燃气灶",
    brand: "卡萨帝",
    name: "嵌入式燃气灶",
    model: "JZT-C6G86CGU9",
    size: "面板 860 × 450 mm",
    install: "台面开孔：700 × 400 mm；核对气源类型与橱柜通风",
    price: 1930,
    taobaoPrice: 3699,
    taobaoNote: "公开零售参考",
    source: "现场看",
    image: "products/casarte-hob.jpg",
    features: ["5.2kW", "70%热效率", "40mm 超薄"],
    note: "现场照片铭牌为相近型号，仅作外观参考；下单以清单型号为准。",
    url: "https://www.casarte.com/kitchen-appliances/rqz/20260204_285775.shtml",
  },
  {
    id: "robamhob",
    category: "燃气灶",
    brand: "老板",
    name: "9B8-i1 AI燃气灶",
    model: "JZ(Y/T)-9B8-i1",
    size: "860 × 450 × 136 mm",
    install: "台面开孔：700 × 400 mm，圆角 R10",
    price: 0,
    source: "新增推荐",
    image: "products/robam-hob-9b8.png",
    features: ["AI火候", "5.0/5.2kW", "70%热效率"],
    url: "https://www.robam.com/product/detail/1072.html",
  },
  {
    id: "robam59b8d",
    category: "燃气灶",
    brand: "老板",
    name: "59B8D 智能防干烧燃气灶",
    model: "JZT-59B8D（天然气12T）",
    size: "准确面板与开孔以官方安装图为准",
    install: "锁定天然气12T、开孔图、阀门可触达与柜体通风",
    price: 0,
    taobaoPrice: 3200,
    taobaoNote: "与E1P套装历史总价约¥7,100–8,500，单机为拆分参考",
    source: "新增推荐",
    image: "products/robam-59b8d.png",
    features: ["5.2kW", "70%热效率", "定时", "防干烧"],
    note: "与E1P可做本地烟灶联动，无需为了联网强行接入全屋生态。",
  },
  {
    id: "casarteoven",
    category: "蒸烤一体机",
    brand: "卡萨帝",
    name: "嵌入式蒸烤一体机",
    model: "C3SO6BGU1",
    size: "尺寸待官方安装图确认",
    install: "橱柜开孔暂不下单，待门店提供该型号安装图后锁定",
    price: 4750,
    source: "网上看",
    image: "products/casarte-oven.png",
    features: ["蒸烤一体", "嵌入式", "价格已确认"],
    note: "图片为同品牌同类产品示意；保留你图中型号 C3SO6BGU1。",
  },
  {
    id: "fotileg5p",
    category: "蒸烤一体机",
    brand: "方太",
    name: "G5P 微蒸烤一体机",
    model: "ZKW45-G5P",
    size: "595 × 556 × 455 mm",
    install: "半嵌开孔 560 × 450 × ≥550 mm；全嵌开孔 600 × 460 × ≥572 mm",
    price: 0,
    taobaoPrice: 5598,
    taobaoNote: "京东补贴后参考（淘宝未公开索引）",
    source: "新增推荐",
    image: "products/fotile-g5p.png",
    features: ["19.2英寸屏", "隐藏式水箱", "微蒸烤炸炖", "瓷膜内胆"],
    url: "https://www.fotile.com/product/13967.html",
  },
  {
    id: "robamoven",
    category: "蒸烤一体机",
    brand: "老板",
    name: "CQ926L60 蒸烤一体机",
    model: "ZKQC-65-CQ926L60",
    size: "595 × 520 × 595 mm",
    install: "全嵌开孔：宽 600 × 深 565 × 高 600 mm",
    price: 0,
    source: "新增推荐",
    image: "products/robam-oven-cq926.png",
    features: ["73L", "AI视觉", "ROKI智能烹饪"],
    url: "https://www.robam.com/product/detail/829.html",
  },
  {
    id: "robamd3p",
    category: "蒸烤一体机",
    brand: "老板",
    name: "小贝果 D3P 微蒸烤炸炖一体机",
    model: "ZKWQS-73-C98A-D3P",
    size: "约 595 × 545 × 595 mm",
    install: "约60cm高柜位、16A独立回路及散热通道；以厂家安装图为准",
    price: 0,
    taobaoPrice: 5750,
    taobaoNote: "历史活动区间中值",
    source: "新增推荐",
    image: "products/robam-d3p.png",
    features: ["77L", "微蒸烤炸炖", "上下双温", "五层空间"],
    note: "大容量宴客路线；不能沿用原45cm高方太开孔。",
  },
  {
    id: "prefilter",
    category: "前置过滤器",
    brand: "卡萨帝",
    name: "全屋前置过滤器",
    model: "CP40-M1(LP)",
    size: "尺寸待现场确认",
    install: "入户总阀后预留安装位、地漏与检修空间；确认水流方向",
    price: 750,
    source: "网上看",
    image: "products/prefilter.png",
    features: ["全屋前置", "入户过滤", "价格已确认"],
    note: "图片为同类前置过滤器示意，准确尺寸待产品安装图。",
  },
  {
    id: "prefilter41",
    category: "前置过滤器",
    brand: "卡萨帝",
    name: "6T/h 反冲洗前置过滤器",
    model: "CP-41(A)",
    size: "216 × 130 × 293 mm",
    install: "入户总阀后留排污、旁通、拆洗与检修空间",
    price: 0,
    taobaoPrice: 2000,
    taobaoNote: "历史渠道区间中值",
    source: "新增推荐",
    image: "products/prefilter.png",
    features: ["6T/h", "反冲洗", "40μm级前置", "两卫并发余量"],
    note: "较CP40-M1(LP)更适合两卫与厨房同时用水；无需为联网功能付费。",
  },
];

const starterItems: Record<string, PlanItem> = {
  fridge487: { qty: 1, unitPrice: 5100 },
  washer10: { qty: 1, unitPrice: 3800 },
  dryer10: { qty: 1, unitPrice: 3800 },
  dishwasher: { qty: 1, unitPrice: 4700 },
  hood: { qty: 1, unitPrice: 3000 },
  hob: { qty: 1, unitPrice: 1930 },
  casarteoven: { qty: 1, unitPrice: 4750 },
  prefilter: { qty: 1, unitPrice: 750 },
};
const initialPlans: Plan[] = [
  { id: "main", name: "方案 A · 当前清单", items: starterItems },
  {
    id: "upgrade",
    name: "方案 B · 品牌升级",
    items: {
      fridge487: { qty: 1, unitPrice: 5100 },
      wallwasher: { qty: 1, unitPrice: 3999 },
      dryer10: { qty: 1, unitPrice: 3800 },
      robams2u: { qty: 1, unitPrice: 0 },
      robamhood: { qty: 1, unitPrice: 0 },
      robamhob: { qty: 1, unitPrice: 0 },
      fotileg5p: { qty: 1, unitPrice: 0 },
    },
  },
];
const categories = [
  "全部",
  "冰箱",
  "洗衣机",
  "干衣机",
  "洗碗机",
  "油烟机",
  "燃气灶",
  "蒸烤一体机",
  "前置过滤器",
];
const money = (n: number) =>
  n
    ? new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
        maximumFractionDigits: 0,
      }).format(n)
    : "待询价";

export default function Home() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [activePlanId, setActivePlanId] = useState("main");
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("全部来源");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showPlanCompare, setShowPlanCompare] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("home-select-v1");
      if (saved) {
        const d = JSON.parse(saved);
        setProducts([...seedProducts, ...(d.customProducts || [])]);
        setPlans(d.plans?.length ? d.plans : initialPlans);
        setActivePlanId(d.activePlanId || "main");
      }
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated)
      localStorage.setItem(
        "home-select-v1",
        JSON.stringify({
          customProducts: products.filter((p) => p.custom),
          plans,
          activePlanId,
        }),
      );
  }, [products, plans, activePlanId, hydrated]);
  const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "全部" || p.category === category) &&
          (source === "全部来源" || p.source === source) &&
          `${p.brand}${p.name}${p.model}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, category, source, query],
  );
  const planTotal = (plan: Plan) =>
    Object.entries(plan.items).reduce(
      (s, [id, item]) => s + item.unitPrice * item.qty,
      0,
    );
  const pendingCount = (plan: Plan) =>
    Object.values(plan.items).filter((i) => !i.unitPrice).length;
  const addToPlan = (id: string) =>
    setPlans((ps) =>
      ps.map((p) =>
        p.id === activePlanId
          ? {
              ...p,
              items: {
                ...p.items,
                [id]: p.items[id]
                  ? { ...p.items[id], qty: p.items[id].qty + 1 }
                  : {
                      qty: 1,
                      unitPrice: products.find((x) => x.id === id)?.price || 0,
                    },
              },
            }
          : p,
      ),
    );
  const updateItem = (id: string, patch: Partial<PlanItem>) =>
    setPlans((ps) =>
      ps.map((p) =>
        p.id === activePlanId
          ? { ...p, items: { ...p.items, [id]: { ...p.items[id], ...patch } } }
          : p,
      ),
    );
  const removeItem = (id: string) =>
    setPlans((ps) =>
      ps.map((p) => {
        if (p.id !== activePlanId) return p;
        const items = { ...p.items };
        delete items[id];
        return { ...p, items };
      }),
    );
  const newPlan = () => {
    const id = `plan-${Date.now()}`;
    setPlans((p) => [
      ...p,
      {
        id,
        name: `方案 ${String.fromCharCode(65 + p.length)} · 新方案`,
        items: {},
      },
    ]);
    setActivePlanId(id);
  };
  const duplicatePlan = () => {
    const id = `plan-${Date.now()}`;
    setPlans((p) => [
      ...p,
      {
        id,
        name: `${activePlan.name} · 副本`,
        items: JSON.parse(JSON.stringify(activePlan.items)),
      },
    ]);
    setActivePlanId(id);
  };
  const deletePlan = () => {
    if (plans.length === 1) return;
    const next = plans.filter((p) => p.id !== activePlanId);
    setPlans(next);
    setActivePlanId(next[0].id);
  };
  const renamePlan = () => {
    const name = window.prompt("给方案起个名字", activePlan.name);
    if (name?.trim())
      setPlans((ps) =>
        ps.map((p) =>
          p.id === activePlanId ? { ...p, name: name.trim() } : p,
        ),
      );
  };
  const toggleCompare = (id: string) =>
    setCompareIds((ids) =>
      ids.includes(id)
        ? ids.filter((x) => x !== id)
        : ids.length < 4
          ? [...ids, id]
          : ids,
    );
  const resetData = () => {
    if (window.confirm("恢复初始设备库与两套示例方案？自定义内容会被清除。")) {
      setProducts(seedProducts);
      setPlans(initialPlans);
      setActivePlanId("main");
      localStorage.removeItem("home-select-v1");
    }
  };
  const addCustom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const p: Product = {
      id: `custom-${Date.now()}`,
      category: String(f.get("category")),
      brand: String(f.get("brand") || "自定义"),
      name: String(f.get("name")),
      model: String(f.get("model") || "待填写"),
      size: String(f.get("size") || "待填写"),
      install: String(f.get("install") || "待现场确认"),
      price: Number(f.get("price") || 0),
      source: "用户添加",
      image: String(f.get("image") || "og.png"),
      features: String(f.get("features") || "用户添加")
        .split(/[，,]/)
        .filter(Boolean),
      custom: true,
    };
    setProducts((v) => [p, ...v]);
    setShowCustom(false);
  };
  const compareProducts = compareIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  return (
    <main>
      <header className="topbar">
        <div className="brandmark">
          住选 <span>HOME SELECT</span>
        </div>
        <nav>
          <button onClick={() => setShowPlanCompare(true)}>方案对比</button>
          <button onClick={resetData}>恢复初始数据</button>
          <div className="save-state">● 自动保存到本机</div>
        </nav>
      </header>
      <section className="hero">
        <div>
          <div className="eyebrow">WHOLE-HOME APPLIANCE PLANNER</div>
          <h1>全屋家电选型台</h1>
          <p>
            把现场看过的、网上选中的设备放进同一套方案里。看参数，做比较，最后算清总价。
          </p>
          <div className="hero-actions">
            <button
              onClick={() =>
                document
                  .getElementById("catalog")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              开始选设备 ↓
            </button>
            <button className="ghost" onClick={() => setShowPlanCompare(true)}>
              比较 {plans.length} 套方案
            </button>
          </div>
        </div>
        <div className="hero-stat">
          <strong>{products.length}</strong>
          <span>已录入设备</span>
          <strong>{categories.length - 1}</strong>
          <span>覆盖品类</span>
          <strong>{plans.length}</strong>
          <span>愿望方案</span>
        </div>
      </section>
      <section className="plan-strip">
        <div className="plan-tabs">
          {plans.map((p) => (
            <button
              key={p.id}
              className={p.id === activePlanId ? "active" : ""}
              onClick={() => setActivePlanId(p.id)}
            >
              <span>{p.name}</span>
              <b>{money(planTotal(p))}</b>
              {pendingCount(p) > 0 && <small>{pendingCount(p)} 项待询价</small>}
            </button>
          ))}
          <button className="add-plan" onClick={newPlan}>
            ＋ 新建方案
          </button>
        </div>
        <div className="plan-tools">
          <button onClick={renamePlan}>重命名</button>
          <button onClick={duplicatePlan}>复制</button>
          <button onClick={deletePlan} disabled={plans.length === 1}>
            删除
          </button>
        </div>
      </section>
      <div className="workspace" id="catalog">
        <section className="catalog">
          <div className="section-head">
            <div>
              <div className="eyebrow">PRODUCT LIBRARY</div>
              <h2>设备库</h2>
              <p>{filtered.length} 件设备 · 点击加入当前愿望单</p>
            </div>
            <button className="outline" onClick={() => setShowCustom(true)}>
              ＋ 添加设备
            </button>
          </div>
          <div className="toolbar">
            <div className="search-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索品牌、型号或设备…"
              />
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option>全部来源</option>
                <option>网上看</option>
                <option>现场看</option>
                <option>新增推荐</option>
                <option>用户添加</option>
              </select>
            </div>
            <div className="chips">
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? "active" : ""}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid">
            {filtered.map((p) => (
              <article className="card" key={p.id}>
                <div className="image-wrap">
                  <img
                    src={optimizedImage(p.image)}
                    alt={`${p.brand} ${p.model}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = "og.png";
                    }}
                  />
                  <span
                    className={`source ${p.source === "现场看" ? "onsite" : p.source === "新增推荐" ? "recommend" : ""}`}
                  >
                    {p.source}
                  </span>
                  {p.custom && (
                    <button
                      className="delete-product"
                      aria-label="删除自定义设备"
                      onClick={() => {
                        if (window.confirm("删除这件自定义设备？"))
                          setProducts((v) => v.filter((x) => x.id !== p.id));
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="card-body">
                  <div className="cat">
                    {p.category} · {p.brand}
                  </div>
                  <h3>{p.name}</h3>
                  <div className="model">{p.model}</div>
                  <div className="size">
                    产品尺寸（宽×深×高）<b>{p.size}</b>
                    <small>{p.install}</small>
                  </div>
                  <div className="features">
                    {p.features.map((f) => (
                      <span key={f}>{f}</span>
                    ))}
                  </div>
                  {p.note && (
                    <details>
                      <summary>安装 / 选购备注</summary>
                      <p>{p.note}</p>
                    </details>
                  )}
                  <div className="card-foot">
                    <label className="compare-check">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(p.id)}
                        onChange={() => toggleCompare(p.id)}
                      />{" "}
                      对比
                    </label>
                    <div>
                    <small>你的价格</small>
                    <strong>{money(p.price)}</strong>
                    <em>
                      淘宝参考 {p.taobaoPrice ? money(p.taobaoPrice) : "未查到"}
                    </em>
                    {p.taobaoNote && <i>{p.taobaoNote}</i>}
                    </div>
                    <button onClick={() => addToPlan(p.id)}>
                      {activePlan.items[p.id] ? "再加一件" : "加入方案"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <div className="empty">
              没有匹配设备。换个筛选条件，或添加一件自定义设备。
            </div>
          )}
        </section>
        <aside className="quote">
          <div className="quote-head">
            <div>
              <div className="eyebrow">ACTIVE WISHLIST</div>
              <h2>{activePlan.name}</h2>
            </div>
            <span className="item-count">
              {Object.keys(activePlan.items).length} 项
            </span>
          </div>
          <div className="quote-list">
            {Object.entries(activePlan.items).map(([id, item]) => {
              const p = products.find((x) => x.id === id);
              if (!p) return null;
              return (
                <div className="quote-item" key={id}>
                  <img src={optimizedImage(p.image)} alt="" loading="lazy" decoding="async" />
                  <div className="qi-main">
                    <b>{p.name}</b>
                    <span>{p.model}</span>
                    <div className="mini-controls">
                      <button
                        onClick={() =>
                          item.qty > 1
                            ? updateItem(id, { qty: item.qty - 1 })
                            : removeItem(id)
                        }
                      >
                        −
                      </button>
                      <em>{item.qty}</em>
                      <button
                        onClick={() => updateItem(id, { qty: item.qty + 1 })}
                      >
                        ＋
                      </button>
                      <label>
                        ¥
                        <input
                          aria-label="单价"
                          value={item.unitPrice || ""}
                          placeholder="待询"
                          onChange={(e) =>
                            updateItem(id, {
                              unitPrice: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <button className="remove" onClick={() => removeItem(id)}>
                    ×
                  </button>
                </div>
              );
            })}
            {!Object.keys(activePlan.items).length && (
              <div className="quote-empty">
                愿望单还是空的
                <br />
                <span>从左侧挑一件设备开始吧</span>
              </div>
            )}
          </div>
          <div className="quote-total">
            <div className="total-row">
              <span>设备小计</span>
              <b>{money(planTotal(activePlan))}</b>
            </div>
            {pendingCount(activePlan) > 0 && (
              <div className="pending">
                另有 {pendingCount(activePlan)} 项待询价
              </div>
            )}
            <small>参考总价</small>
            <strong>{money(planTotal(activePlan))}</strong>
            <button onClick={() => setShowQuote(true)}>查看完整报价单 →</button>
          </div>
        </aside>
      </div>
      {compareIds.length > 0 && (
        <div className="compare-dock">
          <div>
            <b>已选 {compareIds.length}/4 件对比</b>
            <span>{compareProducts.map((p) => p.model).join(" · ")}</span>
          </div>
          <button onClick={() => setCompareIds([])}>清空</button>
          <button className="primary" onClick={() => setShowCompare(true)}>
            开始对比
          </button>
        </div>
      )}
      {showCustom && (
        <Modal title="添加自定义设备" onClose={() => setShowCustom(false)}>
          <form className="custom-form" onSubmit={addCustom}>
            <label>
              设备名称*
              <input name="name" required placeholder="例如：客厅冰吧" />
            </label>
            <label>
              品类
              <select name="category">
                {categories.slice(1).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              品牌
              <input name="brand" placeholder="品牌" />
            </label>
            <label>
              型号
              <input name="model" placeholder="型号" />
            </label>
            <label>
              产品尺寸
              <input name="size" placeholder="宽 × 深 × 高 mm" />
            </label>
            <label>
              参考价格
              <input
                name="price"
                type="number"
                min="0"
                placeholder="0 = 待询价"
              />
            </label>
            <label className="wide">
              安装预留
              <input name="install" placeholder="开孔 / 散热 / 水电要求" />
            </label>
            <label className="wide">
              优势标签
              <input name="features" placeholder="多个标签用逗号分隔" />
            </label>
            <label className="wide">
              图片网址
              <input
                name="image"
                type="url"
                placeholder="https://…（可不填）"
              />
            </label>
            <div className="form-actions">
              <button type="button" onClick={() => setShowCustom(false)}>
                取消
              </button>
              <button className="primary" type="submit">
                保存设备
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showCompare && (
        <Modal title="设备横向对比" wide onClose={() => setShowCompare(false)}>
          <div className="compare-table">
            <div className="tr heading">
              <b>项目</b>
              {compareProducts.map((p) => (
                <div key={p.id}>
                  <img src={optimizedImage(p.image)} alt="" loading="lazy" decoding="async" />
                  <strong>
                    {p.brand} {p.name}
                  </strong>
                </div>
              ))}
            </div>
            {[
              ["型号", "model"],
              ["品类", "category"],
              ["产品尺寸", "size"],
              ["安装预留", "install"],
              ["参考价", "price"],
              ["来源", "source"],
            ].map(([label, key]) => (
              <div className="tr" key={key}>
                <b>{label}</b>
                {compareProducts.map((p) => (
                  <span key={p.id}>
                    {key === "price"
                      ? money(p.price)
                      : String(p[key as keyof Product] || "—")}
                  </span>
                ))}
              </div>
            ))}
            <div className="tr">
              <b>核心优势</b>
              {compareProducts.map((p) => (
                <span key={p.id}>{p.features.join(" · ")}</span>
              ))}
            </div>
            <div className="tr actions">
              <b></b>
              {compareProducts.map((p) => (
                <button key={p.id} onClick={() => addToPlan(p.id)}>
                  加入 {activePlan.name}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
      {showQuote && (
        <Modal
          title={`${activePlan.name} · 完整报价`}
          wide
          onClose={() => setShowQuote(false)}
        >
          <QuoteTable
            plan={activePlan}
            products={products}
            total={planTotal(activePlan)}
          />
          <div className="modal-actions">
            <p>价格为当前方案中的可编辑单价；“待询价”项目不计入总额。</p>
            <button onClick={() => window.print()}>打印 / 另存为 PDF</button>
          </div>
        </Modal>
      )}
      {showPlanCompare && (
        <Modal
          title="多套方案总览"
          wide
          onClose={() => setShowPlanCompare(false)}
        >
          <div className="plans-compare">
            {plans.map((p) => (
              <article key={p.id}>
                <div className="pc-head">
                  <span>{Object.keys(p.items).length} 项设备</span>
                  <h3>{p.name}</h3>
                  <strong>{money(planTotal(p))}</strong>
                  {pendingCount(p) > 0 && (
                    <small>{pendingCount(p)} 项待询价</small>
                  )}
                </div>
                <ul>
                  {categories.slice(1).map((cat) => {
                    const ids = Object.keys(p.items).filter(
                      (id) =>
                        products.find((x) => x.id === id)?.category === cat,
                    );
                    return ids.length ? (
                      <li key={cat}>
                        <b>{cat}</b>
                        <span>
                          {ids
                            .map(
                              (id) => products.find((x) => x.id === id)?.model,
                            )
                            .join("、")}
                        </span>
                      </li>
                    ) : null;
                  })}
                </ul>
                <button
                  onClick={() => {
                    setActivePlanId(p.id);
                    setShowPlanCompare(false);
                  }}
                >
                  设为当前方案
                </button>
              </article>
            ))}
          </div>
        </Modal>
      )}
    </main>
  );
}

function Modal({
  title,
  onClose,
  wide = false,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className={`modal ${wide ? "wide" : ""}`}>
        <header>
          <div>
            <div className="eyebrow">HOME SELECT</div>
            <h2>{title}</h2>
          </div>
          <button aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function QuoteTable({
  plan,
  products,
  total,
}: {
  plan: Plan;
  products: Product[];
  total: number;
}) {
  return (
    <div className="quote-table">
      <div className="qt-row head">
        <b>品类 / 产品</b>
        <b>型号</b>
        <b>尺寸</b>
        <b>数量</b>
        <b>单价</b>
        <b>小计</b>
      </div>
      {Object.entries(plan.items).map(([id, item]) => {
        const p = products.find((x) => x.id === id);
        if (!p) return null;
        return (
          <div className="qt-row" key={id}>
            <span>
              <small>
                {p.category} · {p.brand}
              </small>
              {p.name}
            </span>
            <span>{p.model}</span>
            <span>{p.size}</span>
            <span>{item.qty}</span>
            <span>{money(item.unitPrice)}</span>
            <strong>{money(item.unitPrice * item.qty)}</strong>
          </div>
        );
      })}
      <div className="qt-grand">
        <span>方案参考总价</span>
        <strong>{money(total)}</strong>
      </div>
    </div>
  );
}
