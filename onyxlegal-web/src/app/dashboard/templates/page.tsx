'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Scale, Users, Sparkles, Loader2 } from 'lucide-react';
import { TemplateDiscoveryCard } from '@/features/contracts/components/TemplateDiscoveryCard';
import { templates as templatesApi, Template } from '@/lib/api';

const iconMap: Record<string, 'briefcase' | 'shield' | 'document'> = {
  VENDOR_AGREEMENT: 'briefcase',
  NDA: 'shield',
  EMPLOYMENT_OFFER: 'document',
  SERVICE_AGREEMENT: 'briefcase',
  CONSULTING: 'briefcase',
  FREELANCER: 'document',
  PARTNERSHIP: 'briefcase',
  CUSTOM: 'document',
};

export default function TemplatesPage() {
  const [templatesList, setTemplatesList] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await templatesApi.list();
        setTemplatesList(data);
      } catch (err) {
        console.warn('Failed to load templates from API, using fallback:', err);
        // Fallback mock data if API unavailable
        setTemplatesList([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadTemplates();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full flex flex-col pt-4 pb-12 items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-400 mt-3 text-sm">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pt-4 pb-12 animate-in fade-in duration-500 items-center">
      
      {/* Header Container */}
      <div className="max-w-2xl text-center mb-10 mt-4">
        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-6">
          <Sparkles size={14} /> AI Recommendation Engine
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Smart Contract Templates</h1>
        <p className="text-slate-500 text-lg">Onyx AI has analyzed your company profile and recommends the following optimized legal structures for your current growth stage.</p>
        
        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 text-sm font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Lawyer Verified
          </div>
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-indigo-500" />
            Indian Contract Act Compliant
          </div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-amber-500" />
            Trusted by 5,000+ Startups
          </div>
        </div>
      </div>

      {/* Templates Grid — now from real API data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto px-4 mt-6">
        {templatesList.length > 0 ? (
          templatesList.map((template, idx) => (
            <TemplateDiscoveryCard
              key={template.id}
              isRecommended={idx === 0}
              iconType={iconMap[template.category] || 'document'}
              score={template.riskScore}
              title={template.name}
              description={template.description || ''}
              socialProof={template.socialProof || ''}
            />
          ))
        ) : (
          // Fallback to hardcoded data if API returned empty
          <>
            <TemplateDiscoveryCard 
              isRecommended
              iconType="briefcase"
              score={98}
              title="Master Vendor Agreement"
              description="Establish robust terms for services, IP ownership, and deliverables with external contractors."
              socialProof="Used by 850+ B2B SaaS startups"
            />
            <TemplateDiscoveryCard 
              iconType="shield"
              score={95}
              title="Non-Disclosure Agreement"
              description="Protect IP when sharing sensitive information. Configurable for mutual or one-way protection."
              socialProof="Used by 1,200+ similar companies"
            />
            <TemplateDiscoveryCard 
              iconType="document"
              score={99}
              title="Employment Offer Letter"
              description="A legally robust offer protecting both the startup and new hire, compliant with local labor laws."
              socialProof="Used by 2,400+ tech startups"
            />
          </>
        )}
      </div>

    </div>
  );
}
