import { Spinner } from "@/components/admin/ui/Spinner";

export default function PanelLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size={24} className="text-brand" />
    </div>
  );
}
