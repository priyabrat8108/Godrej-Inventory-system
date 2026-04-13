import { MoreVertical, Pencil, PackageMinus, History } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Props {
  canEdit: boolean;
  onEdit: () => void;
  onUse: () => void;
  onHistory: () => void;
}

export const InventoryActionMenu = ({ canEdit, onEdit, onUse, onHistory }: Props) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => e.stopPropagation()}>
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {canEdit && (
          <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="h-3.5 w-3.5 mr-2" />Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onUse(); }}>
          <PackageMinus className="h-3.5 w-3.5 mr-2" />Use Material
        </DropdownMenuItem>
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onHistory(); }}>
          <History className="h-3.5 w-3.5 mr-2" />History
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
