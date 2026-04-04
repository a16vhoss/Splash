'use client';

import { useState, useEffect } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabNavigationProps {
  tabs: Tab[];
}

export function TabNavigation({ tabs }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  function scrollToSection(id: string) {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // Update active tab based on scroll position
  useEffect(() => {
    function handleScroll() {
      for (const tab of [...tabs].reverse()) {
        const el = document.getElementById(tab.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100) {
            setActiveTab(tab.id);
            break;
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tabs]);

  return (
    <div className="flex gap-0 border-b-2 border-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => scrollToSection(tab.id)}
          className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? 'text-primary border-b-2 border-primary -mb-[2px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
