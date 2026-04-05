const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: "₹3,999",
    yearlyPrice: "₹38,999",
    yearlyMonthlyEquivalent: "₹3,249/mo",
    detail: "For early retention teams",
    description: "A clean starting point for smaller teams who need clarity, queue visibility, and repeatable scoring.",
    points: ["15k scored customers monthly", "Single workspace", "Core dashboards and alerts", "Email support"],
    cta: "Start Starter"
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: "₹9,999",
    yearlyPrice: "₹95,999",
    yearlyMonthlyEquivalent: "₹7,999/mo",
    detail: "For operating teams at speed",
    description: "Best for teams that want a stronger operating loop with batch scoring, collaboration, and faster activation.",
    points: ["100k scored customers monthly", "Batch scoring API", "Role-based access", "Priority onboarding"],
    featured: true,
    cta: "Start Growth"
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: "₹24,999",
    yearlyPrice: "₹2,39,999",
    yearlyMonthlyEquivalent: "₹19,999/mo",
    detail: "For multi-team deployment",
    description: "For larger organizations that need higher volume, implementation guidance, and flexible deployment paths.",
    points: ["Unlimited scoring volume", "Custom deployment options", "Priority SLA", "Dedicated implementation"],
    cta: "Contact Sales"
  }
];

const getPlanById = (planId) => {
  return pricingPlans.find((plan) => plan.id === planId) || pricingPlans[1];
}

export { getPlanById, pricingPlans };
