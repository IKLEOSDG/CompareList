import type { Metadata } from "next";
import "./globals.css";
import "./full.css";
import "./portal.css";
import "./yj.css";
export const metadata:Metadata={title:"悦景新世界 20-1-19-1｜家装项目档案",description:"设计图纸、全屋智能、家电、主材、家具、全屋定制、门窗与统一预算。",openGraph:{title:"悦景新世界 20-1-19-1",description:"把一个家的所有选择，放进同一张图里。",images:["/og.png"]}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
