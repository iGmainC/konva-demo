import type { ReactNode } from "react";

/**
 * Demo 卡片属性
 */
type DemoCardProps = {
  /** 卡片标题 */
  title: string;
  /** 卡片说明 */
  description: string;
  /** 卡片内容 */
  children: ReactNode;
};

/**
 * 通用 demo 卡片
 * @param props 卡片属性
 * @returns 带标题与说明的卡片布局
 */
export function DemoCard({ title, description, children }: DemoCardProps) {
  return (
    <section className="demo-card">
      <div className="demo-card-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="demo-card-body">{children}</div>
    </section>
  );
}
