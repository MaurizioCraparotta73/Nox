import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallMacButton() {
  return (
    <Button variant="outline" asChild className="shrink-0 px-3">
      <Link to="/installa" aria-label="Installa su Mac" title="Installa su Mac">
        <Download className="size-4" />
        <span className="hidden sm:inline">Installa</span>
      </Link>
    </Button>
  );
}
