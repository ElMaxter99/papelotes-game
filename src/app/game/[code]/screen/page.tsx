import { Screen } from '@/components/screen/Screen';
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  return <Screen code={(await params).code.toUpperCase()} />;
}
