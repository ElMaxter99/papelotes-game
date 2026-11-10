import { Host } from '@/components/host/Host';
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  return <Host code={(await params).code.toUpperCase()} />;
}
