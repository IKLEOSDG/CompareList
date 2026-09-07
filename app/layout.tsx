import type { Metadata } from "next";
import "./globals.css";
import "./full.css";
import "./portal.css";
import "./yj.css";
export const metadata:Metadata={title:"悦景新世界｜家的装修记录",description:"奶油原木风家装项目记录：施工进度、最终图纸、家电清单与统一预算。",openGraph:{title:"悦景新世界 20-1-19-1",description:"把一个家的所有选择，放进同一张图里。",images:["/og.png"]}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
