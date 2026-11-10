import { Play } from '@/components/play/Play';
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  return <Play code={(await params).code.toUpperCase()} />;
}
