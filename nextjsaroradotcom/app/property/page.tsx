import PropertiesPage, { revalidate } from '../properties/page';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export { revalidate };

export default function PropertyPage(props: PageProps) {
  return <PropertiesPage {...props} basePath="/property" />;
}
