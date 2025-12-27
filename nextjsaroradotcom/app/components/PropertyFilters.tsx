'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface PropertyFilter {
  tid: number | null;
  name: string;
  slug: string;
}

interface PropertyFiltersProps {
  filters: PropertyFilter[];
  currentFilter: string | null;
  basePath?: string;
}

export default function PropertyFilters({ filters, currentFilter, basePath }: PropertyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activePath = basePath || pathname;

  const buildHref = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete('page');

    if (slug === null) {
      params.delete('filter');
    } else {
      params.set('filter', slug);
    }

    const query = params.toString();
    return query ? `${activePath}?${query}` : activePath;
  };

  const handleFilterClick = (slug: string | null) => {
    if (slug === currentFilter || (slug === null && currentFilter === null)) {
      return;
    }
    router.push(buildHref(slug));
  };

  return (
    <div className="filter-container">
      <button
        className={`filter-btn ${currentFilter === null ? 'active' : ''}`}
        type="button"
        aria-pressed={currentFilter === null}
        onClick={() => handleFilterClick(null)}
      >
        - Any -
      </button>
      {filters.map((filter) => (
        <button
          key={filter.slug}
          className={`filter-btn ${currentFilter === filter.slug ? 'active' : ''}`}
          type="button"
          aria-pressed={currentFilter === filter.slug}
          onClick={() => handleFilterClick(filter.slug)}
        >
          {filter.name}
        </button>
      ))}
    </div>
  );
}
