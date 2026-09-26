import type { Metadata } from "next";
import { LocalSetupForm } from "@/components/local-setup-form";

export const metadata: Metadata = { title: "连接配置" };

export default function SetupPage() {
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">LOCAL SETUP</p>
        <h1>连接你的服务</h1>
        <p>把已经准备好的账户密钥填写在这里即可。默认地址和模型已内置，无需理解或填写其他技术参数。</p>
      </section>

      <section className="settings-section">
        <LocalSetupForm />
      </section>

      <section className="settings-section">
        <h2>提交后会发生什么</h2>
        <ol className="setup-steps">
          <li>页面仅在你的本机开发环境中生成 `.env.local`。</li>
          <li>重启应用后，设置页会显示四项服务的真实连接状态。</li>
          <li>我会先做不消耗模型额度的连接验证，再执行数据库结构并接入真实处理。</li>
        </ol>
      </section>
    </>
  );
}
