import { motion } from "framer-motion";

const sections = [
  { label: "Data processed", text: "Account metadata, uploaded customer records for scoring, and operational usage logs are processed securely within our production boundaries." },
  { label: "Purpose", text: "We use your data strictly for service delivery, continuous security hardening, technical troubleshooting, and product performance improvements." },
  { label: "Retention", text: "Data is retained only for the duration of agreed operational windows, active subscriptions, or strictly as required by legal and compliance obligations." },
  { label: "Security", text: "We enforce industry-standard security measures including role-based access control, scoped credentials, and strictly protected network boundaries." }
];

const PrivacyPage = () => {
  return (
    <div className="relative min-h-screen bg-blue-50 px-4 pb-32 pt-32 sm:px-8">
      <motion.section
        className="relative mx-auto max-w-3xl rounded-[2.5rem] border border-blue-200 bg-white p-8 shadow-premium sm:p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <p className="workspace-kicker">Legal Framework</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
          Privacy Policy
        </h1>
        <p className="mt-8 text-lg font-bold leading-8 text-black">
          We process only the information strictly required to authenticate users, execute churn prediction workflows, and maintain platform reliability.
        </p>

        <div className="mt-12 space-y-8">
          {sections.map((item, index) => (
            <motion.article
              key={item.label}
              className="group"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-blue-600">{item.label}</p>
              <p className="mt-3 text-[15px] font-bold leading-7 text-black">{item.text}</p>
              <div className="mt-6 h-px w-full bg-blue-100 group-last:hidden" />
            </motion.article>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-blue-50 p-8 border border-blue-100">
          <p className="text-sm font-bold text-black leading-7">
            Have questions about your data? Reach out to our security team directly at <span className="text-blue-600 underline">security@retainq.com</span>.
          </p>
        </div>
      </motion.section>
    </div>
  );
}

export default PrivacyPage;
